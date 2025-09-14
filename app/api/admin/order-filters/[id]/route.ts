import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if filter exists and belongs to user
    const existingFilter = await prisma.orderFilter.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!existingFilter) {
      return NextResponse.json({ error: 'Filter not found' }, { status: 404 })
    }

    await prisma.orderFilter.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting order filter:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
