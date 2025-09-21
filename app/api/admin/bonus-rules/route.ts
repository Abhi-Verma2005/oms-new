import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const bonusRules = await prisma.bonusRule.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        tag: true,
        _count: {
          select: {
            bonusGrants: true
          }
        }
      }
    })

    return NextResponse.json({ bonusRules })
  } catch (error) {
    console.error('Error fetching bonus rules:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { 
      name, 
      description, 
      tagId, 
      filters, 
      bonusAmount, 
      maxUsers, 
      isActive = true,
      startsAt,
      expiresAt
    } = body

    if (!name || !bonusAmount || !filters) {
      return NextResponse.json({ error: 'Name, bonus amount, and filters are required' }, { status: 400 })
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

    const bonusRule = await prisma.bonusRule.create({
      data: {
        name,
        description,
        tagId,
        filters,
        bonusAmount,
        maxUsers,
        isActive,
        startsAt: startsAt ? new Date(startsAt) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdBy: session.user.id
      },
      include: {
        tag: true
      }
    })

    return NextResponse.json({ bonusRule })
  } catch (error) {
    console.error('Error creating bonus rule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
