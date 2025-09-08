import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { ActivityLogger, extractRequestInfo } from "@/lib/activity-logger"
import { addSecurityHeaders } from "@/lib/security"

export async function POST(request: NextRequest) {
  const session = await auth()
  const userId = (session?.user as any)?.id
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { activity, category, description, metadata } = await request.json()
  const { ipAddress, userAgent } = extractRequestInfo(request as any)

  await ActivityLogger.log({
    userId,
    activity,
    category,
    description,
    metadata,
    ipAddress,
    userAgent,
  } as any)

  const res = NextResponse.json({ ok: true })
  addSecurityHeaders(res)
  return res
}
