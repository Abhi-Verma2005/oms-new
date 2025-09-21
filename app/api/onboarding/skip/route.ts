import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = (session as any)?.user?.id as string | undefined
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { toStep } = await req.json()
    const target = Number(toStep) || 2
    await prisma.onboardingProfile.update({
      where: { userId },
      data: { currentStep: target },
    })
    const nextPath = target === 2
      ? '/onboarding-02'
      : target === 3
      ? '/onboarding-03'
      : target === 4
      ? '/onboarding-04'
      : '/onboarding-05'
    return NextResponse.json({ success: true, next: nextPath })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to skip' }, { status: 500 })
  }
}


