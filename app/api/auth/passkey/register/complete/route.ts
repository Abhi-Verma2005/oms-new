import { NextRequest, NextResponse } from "next/server"
import { verifyRegistrationResponse } from "@simplewebauthn/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, credential } = await request.json()
    if (!name || !credential) {
      return NextResponse.json({ error: "Name and credential are required" }, { status: 400 })
    }

    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: credential.response.clientDataJSON,
      expectedOrigin: process.env.AUTH_URL || "http://localhost:3000",
      expectedRPID: process.env.AUTH_WEBAUTHN_RP_ID || "localhost",
    })

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ error: "Verification failed" }, { status: 400 })
    }

    const { credentialID, credentialPublicKey, counter } = verification.registrationInfo

    await prisma.authenticator.create({
      data: {
        credentialID: Buffer.from(credentialID).toString("base64url"),
        userId: (session.user as any).id,
        providerAccountId: (session.user as any).id,
        credentialPublicKey: Buffer.from(credentialPublicKey).toString("base64url"),
        counter,
        credentialDeviceType: "singleDevice",
        credentialBackedUp: false,
        transports: credential.response.transports?.join(","),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Passkey registration complete error:", error)
    return NextResponse.json(
      { error: "Failed to complete passkey registration" },
      { status: 500 }
    )
  }
}
