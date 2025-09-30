import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        userRoles: {
          where: { isActive: true },
          include: { role: true }
        }
      }
    })

    const isAdmin = user?.userRoles.some(ur => ur.role?.name === 'admin')
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get users with their profiles and AI insights
    const users = await prisma.user.findMany({
      take: limit,
      skip: offset,
      include: {
        userProfile: true,
        userAIInsights: true,
        _count: {
          select: {
            interactions: {
              where: {
                interactionType: 'CHAT_MESSAGE',
                timestamp: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
              }
            }
          }
        },
        interactions: {
          where: {
            interactionType: 'CHAT_MESSAGE'
          },
          orderBy: { timestamp: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Transform data for frontend
    const insights = users.map(user => ({
      id: user.id,
      userId: user.id,
      user: {
        name: user.name || 'Unknown',
        email: user.email
      },
      profile: user.userProfile ? {
        companyName: user.userProfile.companyName,
        industry: user.userProfile.industry,
        role: user.userProfile.role,
        experience: user.userProfile.experience
      } : null,
      aiInsights: user.userAIInsights ? {
        personalityTraits: user.userAIInsights.personalityTraits as string[] || [],
        conversationTone: user.userAIInsights.conversationTone,
        topicInterests: user.userAIInsights.topicInterests as string[] || [],
        painPoints: user.userAIInsights.painPoints as string[] || [],
        confidenceScore: user.userAIInsights.confidenceScore,
        lastAnalysisAt: user.userAIInsights.lastAnalysisAt?.toISOString(),
        aiMetadata: user.userAIInsights.aiMetadata as Record<string, any> || {}
      } : null,
      recentInteractions: user._count.interactions,
      lastInteraction: user.interactions[0]?.timestamp?.toISOString() || user.createdAt.toISOString()
    }))

    // Get summary statistics
    const stats = await prisma.user.aggregate({
      _count: { id: true }
    })

    const withProfiles = await prisma.userProfile.count()
    const withAIInsights = await prisma.userAIInsights.count()
    
    const avgConfidence = await prisma.userAIInsights.aggregate({
      _avg: { confidenceScore: true }
    })

    const avgInteractions = await prisma.userInteraction.aggregate({
      where: {
        interactionType: 'CHAT_MESSAGE',
        timestamp: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      },
      _count: { id: true }
    })

    return NextResponse.json({
      insights,
      stats: {
        totalUsers: stats._count.id,
        withProfiles,
        withAIInsights,
        avgConfidence: avgConfidence._avg.confidenceScore || 0,
        avgInteractions: Math.round(avgInteractions._count.id / stats._count.id) || 0
      }
    })

  } catch (error) {
    console.error('Error fetching user insights:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user insights' },
      { status: 500 }
    )
  }
}

