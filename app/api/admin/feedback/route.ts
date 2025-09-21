import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdminForAPI } from '@/lib/rbac'

export async function GET(req: NextRequest) {
  await requireAdminForAPI()
  if (!prisma || !(prisma as any).feedback) {
    return NextResponse.json([], { status: 200 })
  }
  const url = new URL(req.url)
  const userId = url.searchParams.get('userId') || undefined
  const rating = url.searchParams.get('rating')
  const where: any = { ...(userId ? { userId } : {}) }
  if (rating) where.rating = Number(rating)
  const items = await prisma?.feedback.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { id: true, email: true, name: true } } }
  })
  return NextResponse.json(items || [])
}


