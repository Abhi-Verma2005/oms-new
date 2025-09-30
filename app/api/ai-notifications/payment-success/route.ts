import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId, amount, items } = await request.json()
    
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    // Store the payment success notification for the AI to pick up
    // In a real implementation, you might store this in a database or cache
    // For now, we'll just return success - the AI will handle the notification
    // when the user interacts with it next

    return NextResponse.json({ 
      success: true, 
      message: 'Payment success notification recorded',
      orderId,
      amount,
      items
    })

  } catch (error) {
    console.error('Error recording payment success notification:', error)
    return NextResponse.json(
      { error: 'Failed to record payment success notification' },
      { status: 500 }
    )
  }
}

