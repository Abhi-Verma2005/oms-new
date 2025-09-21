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

    const bonusRule = await prisma.bonusRule.findUnique({
      where: { id },
      include: {
        bonusGrants: true
      }
    })

    if (!bonusRule) {
      return NextResponse.json({ error: 'Bonus rule not found' }, { status: 404 })
    }

    if (!bonusRule.isActive) {
      return NextResponse.json({ error: 'Bonus rule is not active' }, { status: 400 })
    }

    // Check if rule has expired
    if (bonusRule.expiresAt && new Date() > bonusRule.expiresAt) {
      return NextResponse.json({ error: 'Bonus rule has expired' }, { status: 400 })
    }

    // Check if rule has started
    if (bonusRule.startsAt && new Date() < bonusRule.startsAt) {
      return NextResponse.json({ error: 'Bonus rule has not started yet' }, { status: 400 })
    }

    // Build user query based on filters
    const where: any = {}

    // Apply tag filter if specified
    if (bonusRule.tagId) {
      where.userTags = {
        some: {
          tagId: bonusRule.tagId
        }
      }
    }

    // Apply basic filters that can be done in the query
    const filters = bonusRule.filters as any
    if (filters) {
      // Date range filters
      if (filters.createdAfter) {
        where.createdAt = { gte: new Date(filters.createdAfter) }
      }
      if (filters.createdBefore) {
        where.createdAt = { ...where.createdAt, lte: new Date(filters.createdBefore) }
      }

      // Order status filters - can be done in query
      if (filters.orderStatuses && filters.orderStatuses.length > 0) {
        where.orders = {
          some: {
            status: { in: filters.orderStatuses }
          }
        }
      }
    }

    // Find eligible users with all necessary data
    const eligibleUsers = await prisma.user.findMany({
      where,
      include: {
        userTags: {
          include: {
            tag: true
          }
        },
        orders: {
          select: {
            id: true,
            status: true,
            totalAmount: true,
            createdAt: true
          }
        },
        bonusGrants: {
          where: {
            bonusRuleId: id
          }
        }
      }
    })

    // Apply complex filters in application logic
    let filteredUsers = eligibleUsers

    if (filters) {
      // Order count filters
      if (filters.minOrderCount || filters.maxOrderCount) {
        const minOrderCount = filters.minOrderCount ? parseInt(filters.minOrderCount) : 0
        const maxOrderCount = filters.maxOrderCount ? parseInt(filters.maxOrderCount) : Infinity
        
        filteredUsers = filteredUsers.filter(user => {
          const orderCount = user.orders.length
          return orderCount >= minOrderCount && orderCount <= maxOrderCount
        })
      }

      // Total spending filters
      if (filters.minTotalSpent || filters.maxTotalSpent) {
        const minTotalSpent = filters.minTotalSpent ? parseFloat(filters.minTotalSpent) * 100 : 0 // Convert to cents
        const maxTotalSpent = filters.maxTotalSpent ? parseFloat(filters.maxTotalSpent) * 100 : Infinity // Convert to cents
        
        filteredUsers = filteredUsers.filter(user => {
          const totalSpent = user.orders.reduce((sum, order) => sum + order.totalAmount, 0)
          return totalSpent >= minTotalSpent && totalSpent <= maxTotalSpent
        })
      }
    }

    // Filter out users who already received this bonus
    const newEligibleUsers = filteredUsers.filter(user => user.bonusGrants.length === 0)

    // Apply max users limit if specified
    const usersToGrant = bonusRule.maxUsers 
      ? newEligibleUsers.slice(0, bonusRule.maxUsers - bonusRule.bonusGrants.length)
      : newEligibleUsers

    if (usersToGrant.length === 0) {
      return NextResponse.json({ 
        message: 'No eligible users found for this bonus rule',
        grantsCreated: 0
      })
    }

    // Create bonus grants
    const bonusGrants = await Promise.all(
      usersToGrant.map(user =>
        prisma.bonusGrant.create({
          data: {
            bonusRuleId: id,
            userId: user.id,
            amount: bonusRule.bonusAmount,
            grantedBy: session.user.id,
            notes: `Automated grant from bonus rule: ${bonusRule.name}`
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        })
      )
    )

    // Update user credits (add bonus to daily credits)
    await Promise.all(
      usersToGrant.map(user =>
        prisma.user.update({
          where: { id: user.id },
          data: {
            dailyCredits: {
              increment: bonusRule.bonusAmount
            }
          }
        })
      )
    )

    return NextResponse.json({
      message: `Successfully granted bonuses to ${bonusGrants.length} users`,
      grantsCreated: bonusGrants.length,
      bonusGrants,
      totalAmount: bonusGrants.length * bonusRule.bonusAmount
    })
  } catch (error) {
    console.error('Error executing bonus rule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
