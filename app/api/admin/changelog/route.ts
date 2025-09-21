import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdminForAPI } from '@/lib/rbac'

export async function GET(req: NextRequest) {
  await requireAdminForAPI()
  const url = new URL(req.url)
  const category = url.searchParams.get('category') || undefined
  const entries = await prisma?.changelogEntry.findMany({
    where: { ...(category ? { category } : {}) },
    orderBy: { publishedAt: 'desc' }
  })
  return NextResponse.json(entries || [])
}

export async function POST(req: NextRequest) {
  const admin = await requireAdminForAPI()
  const { title, body, category, isPublished, publishedAt } = await req.json()
  const entry = await prisma?.changelogEntry.create({
    data: {
      title,
      body,
      category,
      isPublished: isPublished ?? true,
      publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
      authorId: admin.id,
    },
  })
  return NextResponse.json(entry)
}

export async function PUT(req: NextRequest) {
  await requireAdminForAPI()
  const { id, ...data } = await req.json()
  const updated = await prisma?.changelogEntry.update({ where: { id }, data })
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest) {
  await requireAdminForAPI()
  const url = new URL(req.url)
  const id = url.searchParams.get('id') || ''
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const deleted = await prisma?.changelogEntry.delete({ where: { id } })
  return NextResponse.json(deleted)
}


