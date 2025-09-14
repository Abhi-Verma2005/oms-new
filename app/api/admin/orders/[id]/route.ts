import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            userTags: {
              include: {
                tag: true
              }
            }
          }
        },
        items: true,
        transactions: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        orderTags: {
          include: {
            tag: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Ensure arrays exist even if they're empty
    const orderWithDefaults = {
      ...order,
      orderTags: order.orderTags || [],
      items: order.items || [],
      transactions: order.transactions || [],
      user: {
        ...order.user,
        userTags: order.user.userTags || []
      }
    }

    return NextResponse.json({ order: orderWithDefaults })
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
