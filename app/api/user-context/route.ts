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

    // Get or create user context
    let userContext = await prisma.userContext.findUnique({
      where: { userId: session.user.id },
      include: {
        contextUpdates: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    })

    // If no context exists, create a basic one
    if (!userContext) {
      userContext = await prisma.userContext.create({
        data: {
          userId: session.user.id,
          companyName: null,
          companySize: null,
          industry: null,
          role: null,
          department: null,
          experience: null,
          primaryGoals: [],
          currentProjects: [],
          communicationStyle: null,
          preferredContentType: [],
          timezone: null,
          workingHours: null,
          aiInsights: {},
          learningStyle: null,
          expertiseLevel: {}
        },
        include: {
          contextUpdates: {
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        }
      })
    }

    // Transform to match frontend store format
    const contextData = {
      company: {
        name: userContext.companyName,
        size: userContext.companySize,
        industry: userContext.industry,
        role: userContext.role,
        department: userContext.department
      },
      professional: {
        experience: userContext.experience,
        primaryGoals: userContext.primaryGoals,
        currentProjects: userContext.currentProjects
      },
      preferences: {
        communicationStyle: userContext.communicationStyle,
        preferredContentType: userContext.preferredContentType,
        timezone: userContext.timezone,
        workingHours: userContext.workingHours
      },
      aiInsights: {
        learningStyle: userContext.learningStyle,
        expertiseLevel: userContext.expertiseLevel,
        personalityTraits: userContext.aiInsights?.personalityTraits || [],
        behaviorPatterns: userContext.aiInsights?.behaviorPatterns || [],
        lastAnalyzed: userContext.aiInsights?.lastAnalyzed
      },
      lastUpdated: userContext.lastUpdated.toISOString(),
      isLoaded: true
    }

    return NextResponse.json(contextData)
  } catch (error) {
    console.error('Error fetching user context:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user context' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { company, professional, preferences, aiInsights } = body

    // Update or create user context
    const userContext = await prisma.userContext.upsert({
      where: { userId: session.user.id },
      update: {
        // Company info
        companyName: company?.name,
        companySize: company?.size,
        industry: company?.industry,
        role: company?.role,
        department: company?.department,
        
        // Professional context
        experience: professional?.experience,
        primaryGoals: professional?.primaryGoals || [],
        currentProjects: professional?.currentProjects || [],
        
        // Preferences
        communicationStyle: preferences?.communicationStyle,
        preferredContentType: preferences?.preferredContentType || [],
        timezone: preferences?.timezone,
        workingHours: preferences?.workingHours,
        
        // AI insights
        learningStyle: aiInsights?.learningStyle,
        expertiseLevel: aiInsights?.expertiseLevel || {},
        aiInsights: {
          personalityTraits: aiInsights?.personalityTraits || [],
          behaviorPatterns: aiInsights?.behaviorPatterns || [],
          lastAnalyzed: aiInsights?.lastAnalyzed
        }
      },
      create: {
        userId: session.user.id,
        // Company info
        companyName: company?.name,
        companySize: company?.size,
        industry: company?.industry,
        role: company?.role,
        department: company?.department,
        
        // Professional context
        experience: professional?.experience,
        primaryGoals: professional?.primaryGoals || [],
        currentProjects: professional?.currentProjects || [],
        
        // Preferences
        communicationStyle: preferences?.communicationStyle,
        preferredContentType: preferences?.preferredContentType || [],
        timezone: preferences?.timezone,
        workingHours: preferences?.workingHours,
        
        // AI insights
        learningStyle: aiInsights?.learningStyle,
        expertiseLevel: aiInsights?.expertiseLevel || {},
        aiInsights: {
          personalityTraits: aiInsights?.personalityTraits || [],
          behaviorPatterns: aiInsights?.behaviorPatterns || [],
          lastAnalyzed: aiInsights?.lastAnalyzed
        }
      }
    })

    return NextResponse.json({
      success: true,
      lastUpdated: userContext.lastUpdated.toISOString()
    })
  } catch (error) {
    console.error('Error updating user context:', error)
    return NextResponse.json(
      { error: 'Failed to update user context' },
      { status: 500 }
    )
  }
}

