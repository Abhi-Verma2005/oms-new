import { NextResponse } from 'next/server'

export async function GET() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  
  return NextResponse.json({
    hasSecret: !!secret,
    secretLength: secret?.length || 0,
    secretPrefix: secret?.substring(0, 15) || 'not set',
    secretSuffix: secret?.substring(-10) || 'not set',
    // Don't expose the full secret for security
    secretPreview: secret ? `${secret.substring(0, 10)}...${secret.substring(-5)}` : 'not set'
  })
}
