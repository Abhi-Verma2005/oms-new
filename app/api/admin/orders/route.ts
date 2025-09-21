import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const paymentStatus = searchParams.get('paymentStatus')
    const tagIds = searchParams.get('tagIds')?.split(',').filter(Boolean)
    const userId = searchParams.get('userId')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (status) {
      where.status = status
    }

    if (userId) {
      where.userId = userId
    }

    // Build user conditions for tag filtering
    const userConditions: any = {}
    
    if (tagIds && tagIds.length > 0) {
      // Filter orders by user tags (users who have the specified tags)
      userConditions.userTags = {
        some: {
          tagId: { in: tagIds }
        }
      }
    }

    // Handle search conditions
    if (search) {
      if (Object.keys(userConditions).length > 0) {
        // If we have user conditions (tags), combine them with search
        where.AND = [
          { user: userConditions },
          {
            OR: [
              { user: { name: { contains: search, mode: 'insensitive' } } },
              { user: { email: { contains: search, mode: 'insensitive' } } },
              { id: { contains: search, mode: 'insensitive' } }
            ]
          }
        ]
      } else {
        // No user conditions, just search
        where.OR = [
          { user: { name: { contains: search, mode: 'insensitive' } } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
          { id: { contains: search, mode: 'insensitive' } }
        ]
      }
    } else if (Object.keys(userConditions).length > 0) {
      // Only user conditions (tags), no search
      where.user = userConditions
    }

    // Build orderBy clause
    const orderBy: any = {}
    if (sortBy === 'user') {
      orderBy.user = { name: sortOrder }
    } else if (sortBy === 'totalAmount') {
      orderBy.totalAmount = sortOrder
    } else {
      orderBy[sortBy] = sortOrder
    }

    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
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
      }),
      prisma.order.count({ where })
    ])

    // Filter by payment status if specified
    let filteredOrders = orders
    if (paymentStatus) {
      filteredOrders = orders.filter(order => {
        const latestTransaction = order.transactions[0]
        if (paymentStatus === 'paid') {
          return latestTransaction?.status === 'SUCCESS'
        } else if (paymentStatus === 'pending') {
          return !latestTransaction || latestTransaction.status === 'INITIATED'
        } else if (paymentStatus === 'failed') {
          return latestTransaction?.status === 'FAILED'
        }
        return true
      })
    }

    // Ensure arrays exist even if they're empty for existing orders
    const ordersWithDefaults = filteredOrders.map(order => ({
      ...order,
      orderTags: order.orderTags || [],
      items: order.items || [],
      transactions: order.transactions || [],
      user: {
        ...order.user,
        userTags: order.user.userTags || []
      }
    }))

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      orders: ordersWithDefaults,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
