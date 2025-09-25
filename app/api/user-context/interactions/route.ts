import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      interactionType,
      content,
      response,
      context,
      sessionId,
      pageUrl
    } = body

    // Create the interaction record
    const interaction = await prisma.userInteraction.create({
      data: {
        userId: session.user.id,
        interactionType: interactionType || 'OTHER',
        content: content || null,
        response: response || null,
        context: context || null,
        sessionId: sessionId || null,
        pageUrl: pageUrl || null
      }
    })

    // Trigger AI analysis if this is a significant interaction
    const shouldAnalyze = [
      'CHAT_MESSAGE',
      'SEARCH_QUERY',
      'FILTER_USAGE',
      'FEEDBACK',
      'SUPPORT_REQUEST'
    ].includes(interactionType)

    if (shouldAnalyze) {
      // Queue analysis (don't wait for it)
      analyzeInteractionAsync(session.user.id, interaction.id)
    }

    return NextResponse.json({
      success: true,
      interactionId: interaction.id
    })
  } catch (error) {
    console.error('Error logging user interaction:', error)
    return NextResponse.json(
      { error: 'Failed to log interaction' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const type = searchParams.get('type')

    const where: any = { userId: session.user.id }
    if (type) {
      where.interactionType = type
    }

    const interactions = await prisma.userInteraction.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit
    })

    return NextResponse.json({ interactions })
  } catch (error) {
    console.error('Error fetching user interactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch interactions' },
      { status: 500 }
    )
  }
}

// Async function to analyze interactions without blocking the response
async function analyzeInteractionAsync(userId: string, interactionId: string) {
  try {
    // Wait a bit to allow for potential batch of interactions
    await new Promise(resolve => setTimeout(resolve, 5000))

    // Get recent interactions for analysis
    const recentInteractions = await prisma.userInteraction.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: 10
    })

    // Only analyze if we have enough interactions or significant ones
    const significantTypes = ['CHAT_MESSAGE', 'SEARCH_QUERY', 'FEEDBACK']
    const hasSignificant = recentInteractions.some(i => significantTypes.includes(i.interactionType))
    
    if (recentInteractions.length >= 3 || hasSignificant) {
      // Trigger AI analysis
      await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/user-context/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          interactions: recentInteractions.map(i => ({
            type: i.interactionType,
            content: i.content,
            response: i.response,
            context: i.context,
            timestamp: i.timestamp
          }))
        })
      })
    }
  } catch (error) {
    console.error('Error in async interaction analysis:', error)
  }
}

