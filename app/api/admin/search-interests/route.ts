import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdminForAPI } from '@/lib/rbac'

export async function GET(req: NextRequest) {
  try {
    await requireAdminForAPI()
    if (!prisma) return NextResponse.json({ error: 'Database not available' }, { status: 500 })

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, Number(searchParams.get('page') || 1))
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize') || 20)))
    const q = (searchParams.get('q') || '').trim()
    const notified = searchParams.get('notified')
    const userId = (searchParams.get('userId') || '').trim()

    const where: any = {}
    if (q) where.query = { contains: q, mode: 'insensitive' }
    if (notified === 'true') where.notified = true
    if (notified === 'false') where.notified = false
    if (userId) where.userId = userId

    const [total, items] = await Promise.all([
      prisma.searchInterest.count({ where }),
      prisma.searchInterest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { user: { select: { id: true, email: true, name: true } } },
      }),
    ])

    return NextResponse.json({
      page,
      pageSize,
      total,
      items: items.map(i => ({
        id: i.id,
        userId: i.userId,
        userEmail: i.user?.email,
        userName: i.user?.name,
        query: i.query,
        filters: i.filters,
        notified: i.notified,
        createdAt: i.createdAt,
      })),
    })
  } catch (e: any) {
    const status = e?.status || 500
    return NextResponse.json({ error: 'Failed to list interests' }, { status })
  }
}
