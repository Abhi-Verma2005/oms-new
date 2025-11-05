import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function GET(request: NextRequest) {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    stripe: {
      secretKeyConfigured: !!process.env.STRIPE_SECRET_KEY,
      secretKeyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 7) || 'not set',
      secretKeyMode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_') 
        ? 'LIVE' 
        : process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') 
          ? 'TEST' 
          : 'UNKNOWN',
      publishableKeyConfigured: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      publishableKeyPrefix: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.substring(0, 7) || 'not set',
      publishableKeyMode: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_live_') 
        ? 'LIVE' 
        : process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_test_') 
          ? 'TEST' 
          : 'UNKNOWN',
      webhookSecretConfigured: !!process.env.STRIPE_WEBHOOK_SECRET,
      webhookSecretPrefix: process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 10) || 'not set',
      webhookSecretMode: process.env.STRIPE_WEBHOOK_SECRET?.startsWith('whsec_') 
        ? 'VALID_FORMAT' 
        : 'INVALID_FORMAT',
    },
    modeMismatch: false,
    issues: [] as string[],
  }

  // Check for mode mismatches
  if (diagnostics.stripe.secretKeyMode !== diagnostics.stripe.publishableKeyMode) {
    diagnostics.modeMismatch = true
    diagnostics.issues.push(
      `MODE MISMATCH: Secret key is ${diagnostics.stripe.secretKeyMode} but publishable key is ${diagnostics.stripe.publishableKeyMode}`
    )
  }

  // Check if keys are configured
  if (!diagnostics.stripe.secretKeyConfigured) {
    diagnostics.issues.push('STRIPE_SECRET_KEY is not configured')
  }

  if (!diagnostics.stripe.publishableKeyConfigured) {
    diagnostics.issues.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not configured')
  }

  if (!diagnostics.stripe.webhookSecretConfigured) {
    diagnostics.issues.push('STRIPE_WEBHOOK_SECRET is not configured')
  }

  // Test Stripe API connection
  try {
    const account = await stripe.account.retrieve()
    diagnostics.stripe.accountId = account.id
    diagnostics.stripe.accountCountry = account.country
    diagnostics.stripe.livemodeEnabled = account.livemode
    diagnostics.stripe.apiConnection = 'SUCCESS'
  } catch (error: any) {
    diagnostics.stripe.apiConnection = 'FAILED'
    diagnostics.stripe.apiError = error.message
    diagnostics.issues.push(`Stripe API connection failed: ${error.message}`)
  }

  // Check webhook endpoint
  diagnostics.webhookEndpoint = {
    url: 'https://oms-new-five.vercel.app/api/webhooks/stripe',
    expectedSecret: diagnostics.stripe.webhookSecretPrefix,
    note: 'Verify this matches your Stripe dashboard webhook signing secret'
  }

  return NextResponse.json(diagnostics, { 
    status: diagnostics.issues.length > 0 ? 200 : 200,
    headers: {
      'Content-Type': 'application/json',
    }
  })
}

