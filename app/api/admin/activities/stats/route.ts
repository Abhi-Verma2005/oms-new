import { NextResponse } from "next/server"
import { requireAdminForAPI } from "@/lib/rbac"
import { prisma } from "@/lib/db"

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

  return NextResponse.json({ total, byCategory, recent })
}
