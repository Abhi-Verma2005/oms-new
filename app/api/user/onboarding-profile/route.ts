import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function GET(_req: NextRequest) {
  const session = await auth()
  const userId = (session as any)?.user?.id as string | undefined
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }
    const profile = await prisma.onboardingProfile.findUnique({ where: { userId } })
    return NextResponse.json({
      companyName: profile?.companyName ?? null,
      currentStep: profile?.currentStep ?? 1,
      monthlyBudget: profile?.monthlyBudget ?? null,
      promotedUrl: profile?.promotedUrl ?? null,
      competitorUrl: profile?.competitorUrl ?? null,
    })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

