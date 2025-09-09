import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import * as bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    if (!prisma) {
      console.error('Prisma client not available in signup API')
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    const body = await req.json()
    const { email, password, name, role } = body || {}

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        name: name ?? null,
        password: passwordHash,
      },
    })

    // Initialize onboarding profile
    await prisma.onboardingProfile.create({
      data: {
        userId: user.id,
        currentStep: 1,
      },
    })

    // Optionally assign default role if provided
    if (role) {
      const roleRec = await prisma.role.findUnique({ where: { name: role } })
      if (roleRec) {
        await prisma.userRole.create({ data: { userId: user.id, roleId: roleRec.id } })
      }
    }

    return NextResponse.json({ success: true, userId: user.id, redirectTo: '/onboarding-01' })
  } catch (error) {
    console.error('Signup error', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}


