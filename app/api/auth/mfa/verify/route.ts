import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { verifyTOTP } from "@/lib/mfa-utils"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { token } = await request.json()
    if (!token || token.length !== 6) {
      return NextResponse.json({ error: "Invalid token format" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: { mfaSecret: true, mfaEnabled: true },
    })

    if (!user?.mfaSecret) {
      return NextResponse.json({ error: "MFA not set up" }, { status: 400 })
    }

    const isValid = verifyTOTP(token, user.mfaSecret)

    if (!isValid) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: (session.user as any).id },
      data: { mfaEnabled: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("MFA verification error:", error)
    return NextResponse.json(
      { error: "Failed to verify MFA token" },
      { status: 500 }
    )
  }
}
