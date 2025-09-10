import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdminForAPI } from '@/lib/rbac'

export async function POST(req: NextRequest) {
  try {
    await requireAdminForAPI()
    if (!prisma) return NextResponse.json({ error: 'Database not available' }, { status: 500 })

    const body = await req.json().catch(() => null)
    const ids: string[] = Array.isArray(body?.ids) ? body.ids : []
    const notified: boolean | undefined = body?.notified
    if (!ids.length || typeof notified !== 'boolean') {
      return NextResponse.json({ error: 'ids[] and notified(boolean) required' }, { status: 400 })
    }

    const result = await prisma.searchInterest.updateMany({ where: { id: { in: ids } }, data: { notified } })
    return NextResponse.json({ ok: true, count: result.count })
  } catch (e) {
    return NextResponse.json({ error: 'Bulk update failed' }, { status: 500 })
  }
}

