import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { rateLimit, createRateLimitHeaders } from "@/lib/rate-limit"
import { addSecurityHeaders } from "@/lib/security"
import bcrypt from 'bcryptjs'

const limiter = rateLimit({ windowMs: 60_000, max: 30 })

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
    const { oldPassword, newPassword } = body as { oldPassword?: string; newPassword?: string }

    if (!oldPassword || !newPassword) {
      return NextResponse.json({ error: 'oldPassword and newPassword are required' }, { status: 400 })
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, password: true } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    if (!user.password) {
      return NextResponse.json({ error: 'Password login not enabled for this account' }, { status: 400 })
    }

    const isValid = await bcrypt.compare(oldPassword, user.password)
    if (!isValid) {
      return NextResponse.json({ error: 'Old password is incorrect' }, { status: 400 })
    }

    const hashed = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } })

    const res = NextResponse.json({ ok: true })
    addSecurityHeaders(res)
    return res
  } catch (error) {
    console.error('Failed to update password', error)
    return NextResponse.json({ error: 'Failed to update password' }, { status: 500 })
  }
}


