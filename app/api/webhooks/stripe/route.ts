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
  // Get the raw body as a buffer for signature verification
  const rawBody = await request.arrayBuffer()
  const body = Buffer.from(rawBody).toString('utf8')
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  console.log('Webhook received:', {
    hasSignature: !!signature,
    bodyLength: body.length,
    rawBodyLength: rawBody.byteLength,
    webhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    signature: signature?.substring(0, 20) + '...'
  })

  let event: Stripe.Event

  // For development/testing, allow bypassing signature verification
  if (process.env.NODE_ENV === 'development' && signature === 'test-signature') {
    console.log('Development mode: Bypassing signature verification')
    try {
      event = JSON.parse(body) as Stripe.Event
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
        Buffer.from(rawBody),
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      )
      console.log('Signature verification successful for event:', event.type)
    } catch (err) {
      console.error('Webhook signature verification failed:', {
        error: err instanceof Error ? err.message : String(err),
        signature: signature?.substring(0, 20) + '...',
        bodyLength: rawBody.byteLength,
        webhookSecretLength: process.env.STRIPE_WEBHOOK_SECRET?.length
      })
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }
  }

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
        const { userId, items, orderType, orderId } = paymentIntent.metadata
        
        if (!userId || !items) {
          console.error('Missing required metadata in payment intent:', {
            userId: !!userId,
            items: !!items,
            orderId: !!orderId
          })
          break
        }

        // Verify user exists before creating order
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, email: true }
        })

        if (!user) {
          console.error('User not found in database:', { userId })
          // Return 200 to prevent webhook retries, but log the error
          break
        }

        // Parse items
        const parsedItems = JSON.parse(items)
        console.log('Parsed items:', parsedItems)
        
        try {
          // Always create a new order after successful payment
          // Since we no longer create orders upfront, we always create them here
          const order = await prisma.order.create({
            data: {
              userId,
              totalAmount: paymentIntent.amount,
              currency: paymentIntent.currency.toUpperCase(),
              status: 'PAID',
              items: {
                create: parsedItems.map((item: any) => ({
                  siteId: item.id,
                  siteName: item.name,
                  priceCents: Math.round(item.price * 100),
                  withContent: false, // Default value
                  quantity: item.quantity,
                }))
              },
              transactions: {
                create: {
                  amount: paymentIntent.amount,
                  currency: paymentIntent.currency.toUpperCase(),
                  status: 'SUCCESS',
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

          console.log('Order created successfully after payment:', order.id)
          
          // Log payment and order creation activities
          try {
            await ActivityLogger.log({
              userId,
              activity: 'PAYMENT_SUCCESS',
              category: 'PAYMENT',
              description: `Payment successful for $${(paymentIntent.amount / 100).toFixed(2)} ${paymentIntent.currency.toUpperCase()}`,
              metadata: {
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
          console.error('Error handling order in database:', dbError)
          // Don't return error status - Stripe payment was successful
          // Log the error but return 200 to prevent webhook retries
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

        // Create a failed order record for tracking purposes
        if (paymentIntent.metadata.userId) {
          try {
            // Parse items from metadata
            const items = paymentIntent.metadata.items ? JSON.parse(paymentIntent.metadata.items) : []
            
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
                    priceCents: Math.round(item.price * 100),
                    withContent: false,
                    quantity: item.quantity,
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
            console.error('Error handling failed payment:', dbError)
            // Don't return error status - webhook was processed successfully
            // Log the error but return 200 to prevent webhook retries
          }
        }

        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    
    // Only return 500 for critical errors that should be retried
    // For database/logging errors, return 200 to prevent infinite retries
    if (error instanceof Error && error.message.includes('signature')) {
      // Signature verification failed - return 400 (don't retry)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }
    
    // For other errors (database, logging), return 200 to prevent retries
    // but log the error for debugging
    console.error('Webhook processed with errors, but returning 200 to prevent retries')
    return NextResponse.json({ received: true, warning: 'Processed with errors' })
  }
}

// Optional: respond 200 to GET/HEAD for health checks to avoid 405 in Stripe UI
export async function GET() {
  return NextResponse.json({ ok: true, message: 'Stripe webhook endpoint. Use POST for events.' })
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}
