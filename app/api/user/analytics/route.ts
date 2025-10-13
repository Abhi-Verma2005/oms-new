import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { rateLimit, createRateLimitHeaders } from '@/lib/rate-limit'
import { addSecurityHeaders } from '@/lib/security'

const limiter = rateLimit({ windowMs: 60_000, max: 60 })

export async function GET(request: NextRequest) {
  const session = await auth()
  const userId = (session?.user as any)?.id
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const rl = await limiter(request)
  if (!rl.success) {
    return NextResponse.json({ error: "Too Many Requests" }, { status: 429, headers: createRateLimitHeaders(rl.limit, rl.remaining, rl.resetTime) as any })
  }

  try {
    // Get user's orders
    const orders = await prisma.order.findMany({
      where: { userId },
      include: { items: true, transactions: true }
    })

    // Calculate total spent from completed orders
    const totalSpent = orders
      .filter(order => order.status === 'PAID')
      .reduce((sum, order) => {
        const orderTotal = order.items.reduce((itemSum, item) => itemSum + item.priceCents, 0)
        return sum + orderTotal
      }, 0)

    // Get user's wishlist items count
    const wishlist = await prisma.wishlist.findUnique({
      where: { userId_name: { userId, name: 'Default' } },
      include: { items: true }
    })
    const wishlistItems = wishlist?.items.length || 0

    // Get user's feedback count from feedback table
    const feedbackCount = await prisma.feedback.count({
      where: {
        userId
      }
    })

    // Get user's daily credits
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { dailyCredits: true, lastCreditReset: true }
    })

    // Calculate credits used today based on daily credits vs remaining
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Credits used today = initial daily credits (50) - remaining credits
    const initialDailyCredits = 50
    const remainingCredits = user?.dailyCredits || 50
    const creditsUsedToday = Math.max(0, initialDailyCredits - remainingCredits)

    // Calculate activity score based on recent activities (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentActivities = await prisma.userActivity.count({
      where: {
        userId,
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    })

    // Calculate previous month's activities for comparison
    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

    const previousMonthActivities = await prisma.userActivity.count({
      where: {
        userId,
        createdAt: {
          gte: sixtyDaysAgo,
          lt: thirtyDaysAgo
        }
      }
    })

    // Calculate activity score (0-100 based on recent activity)
    const activityScore = Math.min(100, Math.max(0, Math.floor((recentActivities / 10) * 100)))
    
    // Calculate month-over-month change
    const monthOverMonthChange = previousMonthActivities > 0 
      ? Math.round(((recentActivities - previousMonthActivities) / previousMonthActivities) * 100)
      : recentActivities > 0 ? 100 : 0

    // Get order status distribution
    const orderStatusDistribution = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Get weekly credits usage (last 7 days) - simplified version
    // Since we don't track historical credit usage, we'll show current day usage for all days
    const weeklyCreditsUsage: { day: string; credits: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      // For now, show current day's usage for all days
      // In a real implementation, you'd need to track daily credit usage separately
      const dayCredits = i === 0 ? creditsUsedToday : 0

      weeklyCreditsUsage.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        credits: dayCredits
      })
    }

    // Get wishlist activity (last 7 days)
    const wishlistActivity: { day: string; additions: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const dayWishlistAdds = await prisma.userActivity.count({
        where: {
          userId,
          category: 'WISHLIST',
          activity: {
            contains: 'ADD_TO_WISHLIST'
          },
          createdAt: {
            gte: date,
            lt: nextDate
          }
        }
      })

      wishlistActivity.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        additions: dayWishlistAdds
      })
    }

    // Wishlist breakdown by recency
    const now = new Date()
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const startOfTwoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1)

    const [addedThisMonth, addedLastMonth, addedEarlier] = await Promise.all([
      prisma.wishlistItem.count({
        where: {
          wishlist: { userId },
          addedAt: { gte: startOfThisMonth }
        }
      }),
      prisma.wishlistItem.count({
        where: {
          wishlist: { userId },
          addedAt: { gte: startOfLastMonth, lt: startOfThisMonth }
        }
      }),
      prisma.wishlistItem.count({
        where: {
          wishlist: { userId },
          addedAt: { lt: startOfLastMonth }
        }
      })
    ])

    const wishlistBreakdown = { addedThisMonth, addedLastMonth, addedEarlier }

    // Monthly activity breakdown by category for last 6 months
    const categories = ['NAVIGATION','ORDER','PROFILE','OTHER','PAYMENT','CART','WISHLIST'] as const
    const monthLabels: string[] = []
    const activityByMonth: Record<string, Record<string, number>> = {}
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const label = start.toLocaleString('en-US', { month: 'short' })
      monthLabels.push(label)
      activityByMonth[label] = {}
      // count per category
      const counts = await prisma.userActivity.groupBy({
        by: ['category'],
        where: { userId, createdAt: { gte: start, lt: end } },
        _count: { _all: true }
      })
      for (const c of categories) activityByMonth[label][c] = 0
      counts.forEach(c => { (activityByMonth[label] as any)[c.category] = c._count._all })
    }

    const analytics = {
      totalOrders: orders.length,
      totalSpent: totalSpent / 100, // Convert cents to dollars
      wishlistItems,
      feedbackCount,
      dailyCredits: user?.dailyCredits || 50,
      creditsUsedToday,
      activityScore,
      monthOverMonthChange,
      orderStatusDistribution,
      weeklyCreditsUsage,
      wishlistActivity,
      wishlistBreakdown,
      activityByMonth,
      monthLabels
    }

    const res = NextResponse.json(analytics)
    addSecurityHeaders(res)
    return res

  } catch (error) {
    console.error('Error fetching user analytics:', error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
