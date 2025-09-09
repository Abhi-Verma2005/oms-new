import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await auth()
  const userId = (session as any)?.user?.id as string | undefined
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const profile = await prisma.onboardingProfile.findUnique({ where: { userId } })
  return NextResponse.json(profile ?? {})
}


