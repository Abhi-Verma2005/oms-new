import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const userId = (session as any)?.user?.id as string | undefined
    const email = (session as any)?.user?.email as string | undefined
    if (!userId || !email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    const body = await req.json().catch(() => null)
    const query = (body?.query || '').trim()
    const filters = body?.filters ?? null
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    // Upsert-like behavior: avoid duplicates for same user/query if not yet notified
    const existing = await prisma.searchInterest.findFirst({
      where: { userId, query, notified: false },
    })
    if (existing) {
      return NextResponse.json({ ok: true, id: existing.id })
    }

    const created = await prisma.searchInterest.create({
      data: { userId, email, query, filters },
    })
    return NextResponse.json({ ok: true, id: created.id })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to save interest' }, { status: 500 })
  }
}


