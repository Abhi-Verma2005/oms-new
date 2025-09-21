import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdminForAPI } from '@/lib/rbac'

export async function GET(req: NextRequest) {
  await requireAdminForAPI()
  if (!prisma || !(prisma as any).feedback) {
    return NextResponse.json({ total: 0, byRating: { 1:0,2:0,3:0,4:0,5:0 }, recent: [] })
  }
  const url = new URL(req.url)
  const userId = url.searchParams.get('userId') || undefined

  const where = userId ? { userId } : {}

  const [total, byRating, recent] = await Promise.all([
    prisma?.feedback.count({ where }) as Promise<number>,
    prisma?.feedback.groupBy({ by: ['rating'], _count: { _all: true }, where }) as any,
    prisma?.feedback.findMany({ where, orderBy: { createdAt: 'desc' }, take: 10, include: { user: { select: { id: true, email: true, name: true } } } })
  ])

  const ratingBuckets: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const r of byRating || []) ratingBuckets[r.rating] = r._count._all

  return NextResponse.json({
    total: total || 0,
    byRating: ratingBuckets,
    recent: (recent || []).map(r => ({ id: r.id, rating: r.rating, comment: r.comment, user: r.user, createdAt: r.createdAt })),
  })
}


