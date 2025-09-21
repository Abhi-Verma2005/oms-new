import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { tagId, userIds, filters, notes, expiresAt } = body

    if (!tagId) {
      return NextResponse.json({ error: 'Tag ID is required' }, { status: 400 })
    }

    // Check if tag exists
    const tag = await prisma.tag.findUnique({
      where: { id: tagId }
    })

    if (!tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
    }

    let targetUserIds: string[] = []

    // If specific user IDs are provided
    if (userIds && userIds.length > 0) {
      targetUserIds = userIds
    }
    // If filters are provided, find users matching those filters
    else if (filters) {
      const where: any = {}

      // Search query
      if (filters.query) {
        where.OR = [
          { name: { contains: filters.query, mode: 'insensitive' as const } },
          { email: { contains: filters.query, mode: 'insensitive' as const } },
        ]
      }

      // Tag filters
      if (filters.tagIds && filters.tagIds.length > 0) {
        where.userTags = {
          some: {
            tagId: { in: filters.tagIds }
          }
        }
      }

      // Role filters
      if (filters.hasRoles !== undefined) {
        where.userRoles = filters.hasRoles 
          ? { some: { isActive: true } }
          : { none: { isActive: true } }
      }

      // Date filters
      if (filters.dateFrom || filters.dateTo) {
        where.createdAt = {}
        if (filters.dateFrom) {
          where.createdAt.gte = new Date(filters.dateFrom)
        }
        if (filters.dateTo) {
          where.createdAt.lte = new Date(filters.dateTo)
        }
      }

      const users = await prisma.user.findMany({
        where,
        select: { id: true }
      })

      targetUserIds = users.map(user => user.id)
    } else {
      return NextResponse.json({ error: 'Either userIds or filters must be provided' }, { status: 400 })
    }

    if (targetUserIds.length === 0) {
      return NextResponse.json({ error: 'No users found matching the criteria' }, { status: 400 })
    }

    // Check which users already have this tag
    const existingUserTags = await prisma.userTag.findMany({
      where: {
        userId: { in: targetUserIds },
        tagId: tagId
      },
      select: { userId: true }
    })

    const existingUserIds = new Set(existingUserTags.map(ut => ut.userId))
    const newUserIds = targetUserIds.filter(id => !existingUserIds.has(id))

    if (newUserIds.length === 0) {
      return NextResponse.json({ 
        message: 'All selected users already have this tag',
        assigned: 0,
        skipped: targetUserIds.length
      })
    }

    // Create user tags for new users
    const userTags = await Promise.all(
      newUserIds.map(userId =>
        prisma.userTag.create({
          data: {
            userId,
            tagId,
            assignedBy: session.user.id,
            notes: notes || null,
            expiresAt: expiresAt ? new Date(expiresAt) : null
          },
          include: {
            tag: true
          }
        })
      )
    )

    return NextResponse.json({
      message: `Successfully assigned tag to ${userTags.length} users`,
      assigned: userTags.length,
      skipped: existingUserIds.size,
      userTags
    })
  } catch (error) {
    console.error('Error bulk assigning tags:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
