import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Public list (only published)
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const category = url.searchParams.get('category') || undefined
  const entries = await prisma?.changelogEntry.findMany({
    where: { isPublished: true, ...(category ? { category } : {}) },
    orderBy: { publishedAt: 'desc' },
  })
  return NextResponse.json(entries || [])
}


