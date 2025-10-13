import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { addSecurityHeaders } from '@/lib/security'

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const userId = (session?.user as any)?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const page = req.nextUrl.searchParams.get('page') || 'publishers'
  const { id: projectId } = await ctx.params

  const pref = await prisma.projectFilterPreference.findUnique({
    where: { userId_projectId_page: { userId, projectId, page } },
  })

  const res = NextResponse.json({ preference: pref?.data ?? null })
  addSecurityHeaders(res)
  return res
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const userId = (session?.user as any)?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const page: string = (req.nextUrl.searchParams.get('page') as string) || body.page || 'publishers'
  const data = body?.data ?? body?.filters ?? {}
  const { id: projectId } = await ctx.params

  const saved = await prisma.projectFilterPreference.upsert({
    where: { userId_projectId_page: { userId, projectId, page } },
    create: { userId, projectId, page, data },
    update: { data },
  })

  const res = NextResponse.json({ preference: saved.data })
  addSecurityHeaders(res)
  return res
}



