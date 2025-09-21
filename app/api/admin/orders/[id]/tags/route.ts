import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { tagId, notes } = body

    if (!tagId) {
      return NextResponse.json({ error: 'Tag ID is required' }, { status: 400 })
    }

    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Check if tag exists
    const tag = await prisma.tag.findUnique({
      where: { id: tagId }
    })

    if (!tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
    }

    // Check if tag is already assigned to this order
    const existingOrderTag = await prisma.orderTag.findUnique({
      where: {
        orderId_tagId: {
          orderId: id,
          tagId: tagId
        }
      }
    })

    if (existingOrderTag) {
      return NextResponse.json({ error: 'Tag is already assigned to this order' }, { status: 400 })
    }

    const orderTag = await prisma.orderTag.create({
      data: {
        orderId: id,
        tagId: tagId,
        assignedBy: session.user.id,
        notes: notes || null
      },
      include: {
        tag: true
      }
    })

    return NextResponse.json({ orderTag })
  } catch (error) {
    console.error('Error adding tag to order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
