import { NextRequest, NextResponse } from "next/server"
// Lazy load inside the handler to avoid top-level await/type issues
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name } = await request.json()
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const existingAuthenticators = await prisma.authenticator.findMany({
      where: { userId: (session.user as any).id },
    })

    let generateRegistrationOptions: any
    try {
      ;({ generateRegistrationOptions } = await import("@simplewebauthn/server" as any))
    } catch {}
    if (!generateRegistrationOptions) {
      return NextResponse.json({ error: "Passkey server dependency not installed" }, { status: 501 })
    }
    const options = await generateRegistrationOptions({
      rpName: process.env.AUTH_WEBAUTHN_RP_NAME || "Mosaic OMS",
      rpID: process.env.AUTH_WEBAUTHN_RP_ID || "localhost",
      userID: (session.user as any).id,
      userName: session.user?.email || (session.user as any)?.name || "user",
      userDisplayName: (session.user as any)?.name || session.user?.email || "User",
      attestationType: "none",
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "preferred",
        residentKey: "preferred",
      },
      supportedAlgorithmIDs: [-7, -257],
      excludeCredentials: existingAuthenticators.map((auth) => ({
        id: auth.credentialID,
        type: "public-key",
        transports: auth.transports ? (auth.transports.split(",") as any) : undefined,
      })),
    })

    return NextResponse.json(options)
  } catch (error) {
    console.error("Passkey registration begin error:", error)
    return NextResponse.json(
      { error: "Failed to start passkey registration" },
      { status: 500 }
    )
  }
}
