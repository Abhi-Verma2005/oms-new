import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user with all related data
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        userProfile: true,
        userContext: true,
        userAIInsights: true,
        userRoles: {
          include: {
            role: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Transform the data for the frontend
    const userContext = {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      dailyCredits: user.dailyCredits,
      lastCreditReset: user.lastCreditReset,
      userProfile: user.userProfile,
      userContext: user.userContext,
      aiInsights: user.userAIInsights,
      roles: user.userRoles.map(ur => ur.role.name),
      isAdmin: user.userRoles.some(ur => ur.role.name === 'admin')
    }

    return NextResponse.json(userContext)
  } catch (error) {
    console.error('Error fetching user context:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
