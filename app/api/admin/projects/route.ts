import { NextRequest, NextResponse } from 'next/server'
import { requireAdminForAPI } from '@/lib/rbac'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    await requireAdminForAPI()
    const url = new URL(request.url)
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'))
    const takeParam = Number(url.searchParams.get('limit') || '20')
    const take = Math.min(50, Math.max(1, isNaN(takeParam) ? 20 : takeParam))
    const skip = (page - 1) * take
    const q = (url.searchParams.get('query') || '').trim()

    const where: any = {}
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' as const } },
        { domain: { contains: q, mode: 'insensitive' as const } },
      ]
    }

    const [projects, totalCount] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          _count: { select: { competitors: true } },
          user: { select: { id: true, email: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.project.count({ where })
    ])

    return NextResponse.json({
      data: projects,
      pagination: {
        page,
        limit: take,
        totalCount,
        totalPages: Math.ceil(totalCount / take),
        hasNextPage: page * take < totalCount,
        hasPrevPage: page > 1,
      }
    })
  } catch (e) {
    console.error('GET /api/admin/projects error', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}


