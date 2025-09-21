import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdminForAPI } from '@/lib/rbac'

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminForAPI()
    if (!prisma) return NextResponse.json({ error: 'Database not available' }, { status: 500 })

    const resolvedParams = await context.params
    const id = resolvedParams?.id
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    await prisma.searchInterest.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    const status = e?.code === 'P2025' ? 404 : 500
    return NextResponse.json({ error: 'Failed to delete interest' }, { status })
  }
}


