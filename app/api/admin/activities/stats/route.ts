import { NextResponse } from "next/server"
import { requireAdminForAPI } from "@/lib/auth-middleware"
import { prisma } from "@/lib/db"
import { addSecurityHeaders } from "@/lib/security"

export async function GET() {
  try {
    await requireAdminForAPI()
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unauthorized' }, { status: 401 })
  }

  const [total, byCategory, recent] = await Promise.all([
    prisma.userActivity.count(),
    prisma.userActivity.groupBy({ by: ['category'], _count: { category: true } }),
    prisma.userActivity.findMany({ orderBy: { createdAt: 'desc' }, take: 10, include: { user: { select: { id: true, name: true, email: true } } } }),
  ])

  const res = NextResponse.json({ total, byCategory, recent })
  addSecurityHeaders(res)
  return res
}
