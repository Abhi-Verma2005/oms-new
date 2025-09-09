import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await auth()
  console.log('Step1 API - Session:', session)
  const userId = (session as any)?.user?.id as string | undefined
  if (!userId) {
    console.log('Step1 API - No userId found in session')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    if (!prisma) {
      console.error('Prisma client not available in step1 API')
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    const { situation } = await req.json()
    await prisma.onboardingProfile.update({
      where: { userId },
      data: { situation, currentStep: 2 },
    })
    return NextResponse.json({ success: true, next: '/onboarding-02' })
  } catch (e) {
    console.error('Step1 API error:', e)
    return NextResponse.json({ error: 'Failed to update step 1' }, { status: 500 })
  }
}


