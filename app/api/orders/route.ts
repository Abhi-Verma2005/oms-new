import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { rateLimit, createRateLimitHeaders } from "@/lib/rate-limit"
import { addSecurityHeaders } from "@/lib/security"

const limiter = rateLimit({ windowMs: 60_000, max: 60 })

export async function GET(request: NextRequest) {
  const session = await auth()
  const userId = (session?.user as any)?.id
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const rl = await limiter(request)
  if (!rl.success) {
    return NextResponse.json({ error: "Too Many Requests" }, { status: 429, headers: createRateLimitHeaders(rl.limit, rl.remaining, rl.resetTime) as any })
  }

  const orders = await prisma.order.findMany({
    where: { userId },
    include: { items: true, transactions: true },
    orderBy: { createdAt: "desc" },
  })

  const res = NextResponse.json({ orders })
  addSecurityHeaders(res)
  return res
}

// Create an order (requires explicit status - no PENDING orders allowed)
export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = (session?.user as any)?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rl = await limiter(req)
  if (!rl.success) {
    return NextResponse.json({ error: "Too Many Requests" }, { status: 429, headers: createRateLimitHeaders(rl.limit, rl.remaining, rl.resetTime) as any })
  }

  try {
    const body = await req.json()
    const { items, currency = 'USD', status } = body as {
      items: Array<{ siteId: string; siteName: string; priceCents: number; withContent?: boolean; quantity?: number }>
      currency?: string
      status: 'PAID' | 'FAILED' | 'CANCELLED' // Explicit status required
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 })
    }

    if (!status || !['PAID', 'FAILED', 'CANCELLED'].includes(status)) {
      return NextResponse.json({ error: 'Valid status (PAID, FAILED, or CANCELLED) is required' }, { status: 400 })
    }

    const totalAmount = items.reduce((sum, it) => sum + (it.priceCents * (it.quantity ?? 1)), 0)

    const order = await prisma.order.create({
      data: {
        userId: userId,
        totalAmount,
        currency,
        status, // Use explicit status instead of default PENDING
        items: {
          create: items.map((it) => ({
            siteId: it.siteId,
            siteName: it.siteName,
            priceCents: it.priceCents,
            withContent: Boolean(it.withContent),
            quantity: it.quantity ?? 1,
          }))
        }
      },
      include: { items: true }
    })

    // Create transaction record with appropriate status
    const tx = await prisma.transaction.create({
      data: {
        orderId: order.id,
        amount: order.totalAmount,
        currency: order.currency,
        status: status === 'PAID' ? 'SUCCESS' : 'FAILED',
        provider: 'offline',
      }
    })

    const res = NextResponse.json({ order: { ...order, transactions: [tx] } })
    addSecurityHeaders(res)
    return res
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
