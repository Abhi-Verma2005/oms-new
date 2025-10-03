import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { rateLimit, createRateLimitHeaders } from "@/lib/rate-limit"
import { addSecurityHeaders } from "@/lib/security"
import { ActivityLogger, extractRequestInfo } from "@/lib/activity-logger"

const limiter = rateLimit({ windowMs: 60_000, max: 120 })

export async function GET(request: NextRequest) {
  const session = await auth()
  const userId = (session?.user as any)?.id
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const rl = await limiter(request)
  if (!rl.success) return NextResponse.json({ error: "Too Many Requests" }, { status: 429, headers: createRateLimitHeaders(rl.limit, rl.remaining, rl.resetTime) as any })

  const searchParams = request.nextUrl.searchParams
  const q = searchParams.get('q') || undefined
  const orderBy = (searchParams.get('orderBy') as any) || 'addedAt'
  const order = ((searchParams.get('order') || 'desc') as 'asc' | 'desc')
  const projectId = searchParams.get('projectId') || undefined

  const wishlist = await prisma.wishlist.upsert({
    where: { userId_name: { userId, name: 'Default' } },
    update: {},
    create: { userId, name: 'Default' },
  })

  const items = await prisma.wishlistItem.findMany({
    where: {
      wishlistId: wishlist.id,
      ...(q ? { OR: [ { siteName: { contains: q, mode: 'insensitive' } }, { siteUrl: { contains: q, mode: 'insensitive' } } ] } : {}),
    },
    orderBy: { [orderBy]: order },
  })

  const res = NextResponse.json({ wishlist, items })
  addSecurityHeaders(res)
  return res
}

export async function POST(request: NextRequest) {
  const session = await auth()
  const userId = (session?.user as any)?.id
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const rl = await limiter(request)
  if (!rl.success) return NextResponse.json({ error: "Too Many Requests" }, { status: 429, headers: createRateLimitHeaders(rl.limit, rl.remaining, rl.resetTime) as any })

  const { siteId, siteName, siteUrl, priceCents, notes, projectId } = await request.json()
  if (!siteId || !siteName) return NextResponse.json({ error: 'siteId and siteName are required' }, { status: 400 })

  const wishlist = await prisma.wishlist.upsert({
    where: { userId_name: { userId, name: 'Default' } },
    update: {},
    create: { userId, name: 'Default' },
  })

  const item = await prisma.wishlistItem.upsert({
    where: { wishlistId_siteId: { wishlistId: wishlist.id, siteId } },
    update: { siteName, siteUrl: siteUrl ?? null, priceCents, notes },
    create: { wishlistId: wishlist.id, siteId, siteName, siteUrl: siteUrl ?? null, priceCents, notes },
  })

  const res = NextResponse.json({ item })
  addSecurityHeaders(res)

  const { ipAddress, userAgent } = extractRequestInfo(request as any)
  ActivityLogger.log({ userId, activity: 'ADD_TO_WISHLIST', category: 'WISHLIST', description: `Added ${siteName}`, metadata: { siteId }, ipAddress, userAgent, projectId } as any).catch(() => {})

  return res
}

export async function DELETE(request: NextRequest) {
  const session = await auth()
  const userId = (session?.user as any)?.id
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const rl = await limiter(request)
  if (!rl.success) return NextResponse.json({ error: "Too Many Requests" }, { status: 429, headers: createRateLimitHeaders(rl.limit, rl.remaining, rl.resetTime) as any })

  const { searchParams } = request.nextUrl
  const siteId = searchParams.get('siteId')
  const projectId = searchParams.get('projectId') || undefined
  if (!siteId) return NextResponse.json({ error: 'siteId is required' }, { status: 400 })

  const wishlist = await prisma.wishlist.upsert({
    where: { userId_name: { userId, name: 'Default' } },
    update: {},
    create: { userId, name: 'Default' },
  })

  await prisma.wishlistItem.delete({ where: { wishlistId_siteId: { wishlistId: wishlist.id, siteId } } })

  const res = NextResponse.json({ success: true })
  addSecurityHeaders(res)

  const { ipAddress, userAgent } = extractRequestInfo(request as any)
  ActivityLogger.log({ userId, activity: 'REMOVE_FROM_WISHLIST', category: 'WISHLIST', description: `Removed ${siteId}`, metadata: { siteId }, ipAddress, userAgent, projectId } as any).catch(() => {})

  return res
}


