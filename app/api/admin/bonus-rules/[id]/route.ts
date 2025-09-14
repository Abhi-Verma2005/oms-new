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

    const bonusRule = await prisma.bonusRule.findUnique({
      where: { id },
      include: {
        tag: true,
        bonusGrants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            grantedAt: 'desc'
          }
        }
      }
    })

    if (!bonusRule) {
      return NextResponse.json({ error: 'Bonus rule not found' }, { status: 404 })
    }

    return NextResponse.json({ bonusRule })
  } catch (error) {
    console.error('Error fetching bonus rule:', error)
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
    const { 
      name, 
      description, 
      tagId, 
      filters, 
      bonusAmount, 
      maxUsers, 
      isActive,
      startsAt,
      expiresAt
    } = body

    if (!name || !bonusAmount || !filters) {
      return NextResponse.json({ error: 'Name, bonus amount, and filters are required' }, { status: 400 })
    }

    // Check if bonus rule exists
    const existingRule = await prisma.bonusRule.findUnique({
      where: { id: id }
    })

    if (!existingRule) {
      return NextResponse.json({ error: 'Bonus rule not found' }, { status: 404 })
    }

    // Validate tag if provided
    if (tagId) {
      const tag = await prisma.tag.findUnique({
        where: { id: tagId }
      })
      if (!tag) {
        return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
      }
    }

    const bonusRule = await prisma.bonusRule.update({
      where: { id: id },
      data: {
        name,
        description,
        tagId,
        filters,
        bonusAmount,
        maxUsers,
        isActive,
        startsAt: startsAt ? new Date(startsAt) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      },
      include: {
        tag: true
      }
    })

    return NextResponse.json({ bonusRule })
  } catch (error) {
    console.error('Error updating bonus rule:', error)
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

    // Check if bonus rule exists
    const existingRule = await prisma.bonusRule.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            bonusGrants: true
          }
        }
      }
    })

    if (!existingRule) {
      return NextResponse.json({ error: 'Bonus rule not found' }, { status: 404 })
    }

    // Check if bonus rule has grants
    if (existingRule._count.bonusGrants > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete bonus rule that has already granted bonuses. Please deactivate it instead.' 
      }, { status: 400 })
    }

    await prisma.bonusRule.delete({
      where: { id: id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting bonus rule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
