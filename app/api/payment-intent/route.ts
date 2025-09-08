import { NextResponse } from 'next/server'
import { stripe, formatAmountForStripe } from '@/lib/stripe'

export async function POST(request: Request) {
  try {
    const { amount, currency = 'USD' } = await request.json()
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }
    const paymentIntent = await stripe.paymentIntents.create({
      amount: formatAmountForStripe(amount, currency),
      currency: String(currency).toLowerCase(),
      automatic_payment_methods: { enabled: true },
    })
    return NextResponse.json({ clientSecret: paymentIntent.client_secret })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to create payment intent' }, { status: 500 })
  }
}
