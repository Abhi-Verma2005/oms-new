import { NextResponse } from 'next/server'
import { stripe, formatAmountForStripe } from '@/lib/stripe'
import { auth } from '@/lib/auth'
import { ActivityLogger } from '@/lib/activity-logger'

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

    // Log payment initiation activity
    try {
      await ActivityLogger.log({
        userId,
        activity: 'PAYMENT_INITIATED',
        category: 'PAYMENT',
        description: `Payment initiated for $${(amount / 100).toFixed(2)} ${currency.toUpperCase()} with ${items.length} items`,
        metadata: {
          paymentIntentId: paymentIntent.id,
          amount: formatAmountForStripe(amount, currency),
          currency: currency.toLowerCase(),
          itemCount: items.length,
          items: items.map(item => ({ id: item.id, name: item.name }))
        }
      } as any)
    } catch (logError) {
      console.error('Error logging payment initiation activity:', logError)
    }

    return NextResponse.json({ clientSecret: paymentIntent.client_secret })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to create payment intent' }, { status: 500 })
  }
}
