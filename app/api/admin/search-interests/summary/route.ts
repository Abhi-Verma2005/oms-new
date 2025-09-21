import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdminForAPI } from '@/lib/rbac'

export async function GET(req: NextRequest) {
  try {
    await requireAdminForAPI()
    if (!prisma) return NextResponse.json({ error: 'Database not available' }, { status: 500 })

    const { searchParams } = new URL(req.url)
    const userId = (searchParams.get('userId') || '').trim()

    // Quick connectivity check to avoid long timeouts/errors when DB is down
    const dbIsReachable = await (async () => {
      try {
        // Keep this very fast; if unreachable, bail out gracefully
        await Promise.race([
          prisma.$queryRawUnsafe('SELECT 1'),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1000))
        ])
        return true
      } catch (_) {
        return false
      }
    })()

    if (!dbIsReachable) {
      return NextResponse.json({
        totals: { total: 0, pending: 0, notified: 0 },
        topQueries: [],
        recent: [],
        dbAvailable: false
      })
    }

    // Top queries by count
    const rawTop = userId
      ? await prisma.$queryRawUnsafe(
          `SELECT query, COUNT(*)::int AS count
           FROM search_interests
           WHERE user_id = $1
           GROUP BY query
           ORDER BY count DESC
           LIMIT 20`,
           userId
        ) as any[]
      : await prisma.$queryRawUnsafe(
          `SELECT query, COUNT(*)::int AS count
           FROM search_interests
           GROUP BY query
           ORDER BY count DESC
           LIMIT 20`
        ) as any[]

    // Recent activity
    const recent = await prisma.searchInterest.findMany({
      where: userId ? { userId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { user: { select: { id: true, email: true, name: true } } },
    })

    // Notified vs pending
    const [pendingCount, notifiedCount, total] = await Promise.all([
      prisma.searchInterest.count({ where: { notified: false, ...(userId ? { userId } : {}) } }),
      prisma.searchInterest.count({ where: { notified: true, ...(userId ? { userId } : {}) } }),
      prisma.searchInterest.count({ where: userId ? { userId } : undefined }),
    ])

    return NextResponse.json({
      totals: { total, pending: pendingCount, notified: notifiedCount },
      topQueries: rawTop.map(r => ({ query: r.query, count: Number(r.count) })),
      recent: recent.map(r => ({
        id: r.id,
        query: r.query,
        userEmail: (r as any).user?.email,
        createdAt: r.createdAt,
        notified: r.notified,
      })),
      dbAvailable: true,
    })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load summary' }, { status: 500 })
  }
}
