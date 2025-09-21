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
      console.error('Prisma client not available in step3 API')
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    const { companyName, city, postalCode, street, country } = await req.json()
    await prisma.onboardingProfile.update({
      where: { userId },
      data: { companyName, city, postalCode, street, country, currentStep: 4 },
    })
    return NextResponse.json({ success: true, next: '/onboarding-04' })
  } catch (e) {
    console.error('Step3 API error:', e)
    return NextResponse.json({ error: 'Failed to update step 3' }, { status: 500 })
  }
}


