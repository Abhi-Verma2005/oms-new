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
    return NextResponse.json(
      { error: "Too Many Requests" },
      { status: 429, headers: createRateLimitHeaders(rl.limit, rl.remaining, rl.resetTime) as any }
    )
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, image: true, createdAt: true, updatedAt: true },
  })

  const res = NextResponse.json({ user })
  addSecurityHeaders(res)
  return res
}

export async function PATCH(request: NextRequest) {
  const session = await auth()
  const userId = (session?.user as any)?.id
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const rl = await limiter(request)
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too Many Requests" },
      { status: 429, headers: createRateLimitHeaders(rl.limit, rl.remaining, rl.resetTime) as any }
    )
  }

  try {
    const body = await request.json()
    const { name, image } = body as { name?: string; image?: string | null }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(typeof name === 'string' ? { name } : {}),
        ...(image !== undefined ? { image } : {}),
      },
      select: { id: true, name: true, email: true, image: true, createdAt: true, updatedAt: true },
    })

    const res = NextResponse.json({ user: updated })
    addSecurityHeaders(res)
    return res
  } catch (error) {
    console.error('Failed to update profile', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}


