import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { headers } from 'next/headers'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  console.log('=== WEBHOOK DEBUG ===')
  console.log('Body length:', body.length)
  console.log('Has signature:', !!signature)
  console.log('Signature:', signature)
  console.log('Webhook secret configured:', !!process.env.STRIPE_WEBHOOK_SECRET)
  console.log('Webhook secret value:', process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 10) + '...')
  
  if (!signature) {
    return NextResponse.json({ 
      error: 'No signature provided',
      debug: {
        hasSignature: false,
        hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
        webhookSecretPrefix: process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 10) + '...'
      }
    }, { status: 400 })
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ 
      error: 'Webhook secret not configured',
      debug: {
        hasSignature: true,
        hasWebhookSecret: false
      }
    }, { status: 500 })
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
    
    return NextResponse.json({ 
      success: true,
      eventType: event.type,
      eventId: event.id,
      debug: {
        hasSignature: true,
        hasWebhookSecret: true,
        signatureVerified: true,
        eventType: event.type
      }
    })
  } catch (err) {
    console.error('Signature verification failed:', err)
    
    return NextResponse.json({ 
      error: 'Invalid signature',
      debug: {
        hasSignature: true,
        hasWebhookSecret: true,
        signatureVerified: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      }
    }, { status: 400 })
  }
}

export async function GET() {
  return NextResponse.json({
    debug: {
      hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      webhookSecretPrefix: process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 10) + '...',
      environment: process.env.NODE_ENV
    }
  })
}