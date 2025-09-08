import { NextRequest, NextResponse } from "next/server"
import { requireAdminForAPI } from "@/lib/auth-middleware"
import { prisma } from "@/lib/db"
import { addSecurityHeaders } from "@/lib/security"

export async function GET(req: NextRequest) {
  try {
    await requireAdminForAPI()
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const page = Number(searchParams.get('page') || '1')
  const limit = Number(searchParams.get('limit') || '20')
  const userId = searchParams.get('userId') || undefined
  const category = searchParams.get('category') || undefined

  const where: any = {}
  if (userId) where.userId = userId
  if (category) where.category = category

  const [activities, total] = await Promise.all([
    prisma.userActivity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.userActivity.count({ where }),
  ])

  const res = NextResponse.json({ activities, total, page, limit, totalPages: Math.ceil(total / limit) })
  addSecurityHeaders(res)
  return res
}
