import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; tagId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, tagId } = await params

    // Check if order tag exists
    const orderTag = await prisma.orderTag.findUnique({
      where: {
        orderId_tagId: {
          orderId: id,
          tagId: tagId
        }
      }
    })

    if (!orderTag) {
      return NextResponse.json({ error: 'Tag assignment not found' }, { status: 404 })
    }

    await prisma.orderTag.delete({
      where: {
        orderId_tagId: {
          orderId: id,
          tagId: tagId
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing tag from order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
