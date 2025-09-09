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
    if (!prisma) {
      console.error('Prisma client not available in step2 API')
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    const { companyType, marketingOptIn } = await req.json()
    await prisma.onboardingProfile.update({
      where: { userId },
      data: { companyType, marketingOptIn, currentStep: 3 },
    })
    return NextResponse.json({ success: true, next: '/onboarding-03' })
  } catch (e) {
    console.error('Step2 API error:', e)
    return NextResponse.json({ error: 'Failed to update step 2' }, { status: 500 })
  }
}


