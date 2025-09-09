import { NextResponse } from 'next/server'
import { stripe, formatAmountForStripe } from '@/lib/stripe'
import { auth } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { amount, currency = 'USD', items } = await request.json()
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items are required' }, { status: 400 })
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: formatAmountForStripe(amount, currency),
      currency: String(currency).toLowerCase(),
      automatic_payment_methods: { enabled: true },
      metadata: {
        userId: userId,
        items: JSON.stringify(items),
        orderType: 'purchase'
      }
    })
    return NextResponse.json({ clientSecret: paymentIntent.client_secret })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to create payment intent' }, { status: 500 })
  }
}
