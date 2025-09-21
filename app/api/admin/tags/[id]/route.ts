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

    const tag = await prisma.tag.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            userTags: true,
            orderTags: true,
            bonusRules: true
          }
        }
      }
    })

    if (!tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
    }

    return NextResponse.json({ tag })
  } catch (error) {
    console.error('Error fetching tag:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
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
    const { name, color, description, isActive } = body

    if (!name || !color) {
      return NextResponse.json({ error: 'Name and color are required' }, { status: 400 })
    }

    // Check if tag exists
    const existingTag = await prisma.tag.findUnique({
      where: { id: id }
    })

    if (!existingTag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
    }

    // Check if another tag with the same name exists (excluding current tag)
    const nameConflict = await prisma.tag.findFirst({
      where: {
        name,
        id: { not: id }
      }
    })

    if (nameConflict) {
      return NextResponse.json({ error: 'Tag name already exists' }, { status: 400 })
    }

    const tag = await prisma.tag.update({
      where: { id: id },
      data: {
        name,
        color,
        description,
        isActive: isActive !== undefined ? isActive : true
      }
    })

    return NextResponse.json({ tag })
  } catch (error) {
    console.error('Error updating tag:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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

    // Check if tag exists
    const existingTag = await prisma.tag.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            userTags: true,
            orderTags: true,
            bonusRules: true
          }
        }
      }
    })

    if (!existingTag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
    }

    // Check if tag is in use
    const totalUsage = existingTag._count.userTags + existingTag._count.orderTags + existingTag._count.bonusRules
    if (totalUsage > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete tag that is currently in use. Please remove all assignments first.' 
      }, { status: 400 })
    }

    await prisma.tag.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting tag:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
