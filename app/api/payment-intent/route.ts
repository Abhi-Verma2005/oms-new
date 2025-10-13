import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { stripe } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = (session?.user as any)?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const amount: number = Number(body.amount)
    const currency: string = (body.currency || 'USD').toLowerCase()
    const items = body.items || []
    const productId: string | undefined = body.productId
    const projectId: string | undefined = body.projectId

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    const intent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        userId,
        items: JSON.stringify(items),
        orderType: 'purchase',
        productId: productId || '',
        projectId: projectId || '',
      },
    })

    return NextResponse.json({ clientSecret: intent.client_secret })
  } catch (e: any) {
    console.error('Error creating payment intent:', e)
    return NextResponse.json({ error: 'Failed to create payment intent' }, { status: 500 })
  }
}

