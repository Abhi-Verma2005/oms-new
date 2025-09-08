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
