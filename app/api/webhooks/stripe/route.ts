import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { prisma } from '@/lib/db'
import { ActivityLogger } from '@/lib/activity-logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: NextRequest) {
  // Get the raw body as a string for signature verification
  // Read as arrayBuffer first to ensure we get raw bytes (prevents Vercel parsing issues)
  let rawBody: string
  try {
    const buffer = await request.arrayBuffer()
    rawBody = Buffer.from(buffer).toString('utf-8')
  } catch (error) {
    // Fallback to text() if arrayBuffer fails
    rawBody = await request.text()
  }
  
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  console.log('Webhook received:', {
    hasSignature: !!signature,
    bodyLength: rawBody.length,
    webhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    webhookSecretPrefix: process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 10) || 'not set',
    environment: process.env.NODE_ENV,
    signature: signature?.substring(0, 20) + '...'
  })

  let event: Stripe.Event

  // For development/testing, allow bypassing signature verification
  if (process.env.NODE_ENV === 'development' && signature === 'test-signature') {
    console.log('Development mode: Bypassing signature verification')
    try {
      event = JSON.parse(rawBody) as Stripe.Event
    } catch (err) {
      console.error('Failed to parse webhook body:', err)
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }
  } else {
    if (!signature) {
      console.error('No signature provided')
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('STRIPE_WEBHOOK_SECRET not configured')
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }

    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      )
      console.log('Signature verification successful for event:', event.type)
    } catch (err) {
      console.error('Webhook signature verification failed:', {
        error: err instanceof Error ? err.message : String(err),
        signature: signature?.substring(0, 20) + '...',
        bodyLength: rawBody.length,
        webhookSecretLength: process.env.STRIPE_WEBHOOK_SECRET?.length
      })
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }
  }

  // Event ID for logging and deduplication
  const eventId = event.id

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        
        console.log('Processing payment_intent.succeeded:', {
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          metadata: paymentIntent.metadata
        })
        
        // Extract metadata
        const { userId, items, orderType, projectId } = paymentIntent.metadata
        
        if (!userId || !items) {
          console.error('Missing required metadata in payment intent:', {
            userId: !!userId,
            items: !!items
          })
          break
        }

        // Check if order already exists (idempotency)
        const existingOrder = await prisma.order.findFirst({
          where: {
            transactions: {
              some: {
                reference: paymentIntent.id,
                provider: 'stripe'
              }
            }
          }
        })

        if (existingOrder) {
          console.log('Order already exists for payment intent:', paymentIntent.id)
          break
        }

        // Verify user exists before creating order
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, email: true }
        })

        if (!user) {
          console.error('User not found in database:', { userId })
          break
        }

        // Parse items with error handling
        let parsedItems: any[]
        try {
          parsedItems = JSON.parse(items)
          if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
            throw new Error('Items must be a non-empty array')
          }
        } catch (parseError) {
          console.error('Failed to parse items from metadata:', parseError)
          break
        }
        
        console.log('Parsed items:', parsedItems)
        
        try {
          // Create order after successful payment
          const order = await prisma.order.create({
            data: {
              userId,
              totalAmount: paymentIntent.amount,
              currency: paymentIntent.currency.toUpperCase(),
              status: 'PAID',
              projectId: projectId || null,
              items: {
                create: parsedItems.map((item: any) => ({
                  siteId: item.id,
                  siteName: item.name,
                  priceCents: item.priceCents || 0, // Already in cents
                  withContent: false,
                  quantity: item.quantity || 1,
                }))
              },
              transactions: {
                create: {
                  amount: paymentIntent.amount,
                  currency: paymentIntent.currency.toUpperCase(),
                  status: 'SUCCESS',
                  provider: 'stripe',
                  reference: paymentIntent.id, // Store payment intent ID for reference
                }
              }
            },
            include: {
              items: true,
              transactions: true,
            }
          })

          console.log('Order created successfully after payment:', order.id)
          
          // Log payment and order creation activities
          try {
            await ActivityLogger.log({
              userId,
              activity: 'PAYMENT_SUCCESS',
              category: 'PAYMENT',
              description: `Payment successful for $${(paymentIntent.amount / 100).toFixed(2)} ${paymentIntent.currency.toUpperCase()}`,
              metadata: {
                stripeEventId: eventId, // Store event ID for deduplication
                paymentIntentId: paymentIntent.id,
                amount: paymentIntent.amount,
                currency: paymentIntent.currency,
                orderId: order.id
              }
            } as any)
            
            await ActivityLogger.log({
              userId,
              activity: 'ORDER_CREATED',
              category: 'ORDER',
              description: `Order created with ${parsedItems.length} items`,
              metadata: {
                orderId: order.id,
                totalAmount: paymentIntent.amount,
                currency: paymentIntent.currency,
                itemCount: parsedItems.length,
                items: parsedItems.map(item => ({ id: item.id, name: item.name }))
              }
            } as any)
          } catch (logError) {
            console.error('Error logging activities:', logError)
          }
        } catch (dbError) {
          console.error('Error handling order in database:', {
            error: dbError instanceof Error ? dbError.message : String(dbError),
            stack: dbError instanceof Error ? dbError.stack : undefined,
            paymentIntentId: paymentIntent.id,
            userId
          })
          // Return 500 for database errors - Stripe will retry
          return NextResponse.json(
            { error: 'Database error', received: false },
            { status: 500 }
          )
        }

        console.log('Payment succeeded:', {
          paymentIntentId: paymentIntent.id,
          userId,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          items: parsedItems,
          orderType,
        })

        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        
        console.log('Payment failed:', {
          paymentIntentId: paymentIntent.id,
          userId: paymentIntent.metadata.userId,
          error: paymentIntent.last_payment_error,
        })

        // Check if order already exists (idempotency)
        const existingOrder = await prisma.order.findFirst({
          where: {
            transactions: {
              some: {
                reference: paymentIntent.id,
                provider: 'stripe'
              }
            }
          }
        })

        if (existingOrder) {
          console.log('Order already exists for payment intent:', paymentIntent.id)
          break
        }

        // Create a failed order record for tracking purposes
        if (paymentIntent.metadata.userId) {
          try {
            // Parse items from metadata with error handling
            let items: any[] = []
            try {
              if (paymentIntent.metadata.items) {
                items = JSON.parse(paymentIntent.metadata.items)
                if (!Array.isArray(items)) items = []
              }
            } catch (parseError) {
              console.error('Failed to parse items from metadata:', parseError)
            }
            
            // Create a failed order directly (no PENDING state)
            const failedOrder = await prisma.order.create({
              data: {
                userId: paymentIntent.metadata.userId,
                totalAmount: paymentIntent.amount,
                currency: paymentIntent.currency.toUpperCase(),
                status: 'FAILED',
                items: {
                  create: items.map((item: any) => ({
                    siteId: item.id,
                    siteName: item.name,
                    priceCents: item.priceCents || 0, // Already in cents
                    withContent: false,
                    quantity: item.quantity || 1,
                  }))
                },
                transactions: {
                  create: {
                    amount: paymentIntent.amount,
                    currency: paymentIntent.currency.toUpperCase(),
                    status: 'FAILED',
                    provider: 'stripe',
                    reference: paymentIntent.id,
                  }
                }
              },
              include: {
                items: true,
                transactions: true,
              }
            })

            console.log('Failed order created:', failedOrder.id)
            
            // Log failed payment activity
            try {
              await ActivityLogger.log({
                userId: paymentIntent.metadata.userId,
                activity: 'PAYMENT_FAILED',
                category: 'PAYMENT',
                description: `Payment failed for $${(paymentIntent.amount / 100).toFixed(2)} ${paymentIntent.currency.toUpperCase()}`,
                metadata: {
                  paymentIntentId: paymentIntent.id,
                  amount: paymentIntent.amount,
                  currency: paymentIntent.currency,
                  orderId: failedOrder.id,
                  error: paymentIntent.last_payment_error?.message || 'Unknown error'
                }
              } as any)
            } catch (logError) {
              console.error('Error logging failed payment activity:', logError)
            }
          } catch (dbError) {
            console.error('Error handling failed payment:', {
              error: dbError instanceof Error ? dbError.message : String(dbError),
              stack: dbError instanceof Error ? dbError.stack : undefined,
              paymentIntentId: paymentIntent.id,
              userId: paymentIntent.metadata.userId
            })
            // Return 500 for database errors - Stripe will retry
            return NextResponse.json(
              { error: 'Database error', received: false },
              { status: 500 }
            )
          }
        }

        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      eventType: event?.type,
      eventId: event?.id
    })
    
    // Return appropriate status codes based on error type
    if (error instanceof Error && error.message.includes('signature')) {
      // Signature verification failed - return 400 (don't retry)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }
    
    // For unexpected errors, return 500 so Stripe retries
    return NextResponse.json(
      { error: 'Internal server error', received: false },
      { status: 500 }
    )
  }
}

// Optional: respond 200 to GET/HEAD for health checks to avoid 405 in Stripe UI
export async function GET() {
  return NextResponse.json({ ok: true, message: 'Stripe webhook endpoint. Use POST for events.' })
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}
