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

    const { interactions } = await request.json()
    
    if (!interactions || !Array.isArray(interactions)) {
      return NextResponse.json({ error: 'Invalid interactions data' }, { status: 400 })
    }

    // Get recent user interactions for analysis
    const recentInteractions = await prisma.userInteraction.findMany({
      where: { 
        userId: session.user.id,
        interactionType: 'CHAT_MESSAGE',
        timestamp: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
      },
      orderBy: { timestamp: 'desc' },
      take: 50
    })

    if (recentInteractions.length < 3) {
      return NextResponse.json({ message: 'Not enough interactions for analysis' })
    }

    // Analyze user patterns using AI
    const analysis = await analyzeUserPatterns(recentInteractions, session.user.id)

    // Update or create UserAIInsights record
    const existingInsights = await prisma.userAIInsights.findUnique({
      where: { userId: session.user.id }
    })

    if (existingInsights) {
      // Update existing insights
      await prisma.userAIInsights.update({
        where: { userId: session.user.id },
        data: {
          personalityTraits: analysis.personalityTraits,
          behaviorPatterns: analysis.behaviorPatterns,
          learningStyle: analysis.learningStyle,
          expertiseLevel: analysis.expertiseLevel,
          conversationTone: analysis.conversationTone,
          communicationPatterns: analysis.communicationPatterns,
          topicInterests: analysis.topicInterests,
          painPoints: analysis.painPoints,
          aiMetadata: analysis.aiMetadata,
          confidenceScore: analysis.confidenceScore,
          lastAnalysisAt: new Date()
        }
      })
    } else {
      // Create new insights record
      await prisma.userAIInsights.create({
        data: {
          userId: session.user.id,
          personalityTraits: analysis.personalityTraits,
          behaviorPatterns: analysis.behaviorPatterns,
          learningStyle: analysis.learningStyle,
          expertiseLevel: analysis.expertiseLevel,
          conversationTone: analysis.conversationTone,
          communicationPatterns: analysis.communicationPatterns,
          topicInterests: analysis.topicInterests,
          painPoints: analysis.painPoints,
          aiMetadata: analysis.aiMetadata,
          confidenceScore: analysis.confidenceScore,
          lastAnalysisAt: new Date()
        }
      })
    }

    // Log the analysis update
    await prisma.aIInsightUpdate.create({
      data: {
        userAIInsightsId: existingInsights?.id || (await prisma.userAIInsights.findUnique({ where: { userId: session.user.id } }))?.id!,
        updateType: 'GENERAL',
        newValue: analysis,
        aiConfidence: analysis.confidenceScore,
        aiReasoning: 'Automated analysis of recent user interactions',
        source: 'chat_interaction'
      }
    })

    return NextResponse.json({ 
      success: true, 
      analysis: {
        personalityTraits: analysis.personalityTraits,
        conversationTone: analysis.conversationTone,
        topicInterests: analysis.topicInterests,
        confidenceScore: analysis.confidenceScore
      }
    })

  } catch (error) {
    console.error('Error in user context analysis:', error)
    return NextResponse.json(
      { error: 'Failed to analyze user context' },
      { status: 500 }
    )
  }
}

// AI-powered user pattern analysis
async function analyzeUserPatterns(interactions: any[], userId: string) {
  try {
    const conversationText = interactions
      .map(i => `${i.content || ''} ${i.response || ''}`)
      .join(' ')
      .slice(0, 4000) // Limit to avoid token limits

    const analysisPrompt = `
Analyze the following user conversation data and extract structured insights. Respond with valid JSON only.

Conversation Data:
${conversationText}

Extract and return:
{
  "personalityTraits": ["trait1", "trait2"], // e.g., ["analytical", "detail-oriented", "results-driven"]
  "behaviorPatterns": {
    "communicationStyle": "formal|casual|technical|brief",
    "questionPatterns": ["pattern1", "pattern2"],
    "preferredTopics": ["topic1", "topic2"],
    "urgencyLevel": "low|medium|high"
  },
  "learningStyle": "visual|auditory|kinesthetic|reading",
  "expertiseLevel": {
    "seo": "beginner|intermediate|advanced|expert",
    "content": "beginner|intermediate|advanced|expert",
    "linkbuilding": "beginner|intermediate|advanced|expert"
  },
  "conversationTone": "professional|casual|technical|friendly",
  "communicationPatterns": {
    "responseLength": "short|medium|long",
    "technicalDepth": "basic|intermediate|advanced",
    "questionFrequency": "low|medium|high"
  },
  "topicInterests": ["interest1", "interest2"],
  "painPoints": ["pain1", "pain2"],
  "aiMetadata": {
    "company:budget": "low|medium|high",
    "project:urgency": "low|medium|high",
    "tools:preferences": ["tool1", "tool2"],
    "goals:primary": "goal1",
    "challenges:main": "challenge1"
  },
  "confidenceScore": 0.85 // 0-1 confidence in analysis
}
`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPEN_AI_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert user behavior analyst. Extract structured insights from conversation data. Respond only with valid JSON.' },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.1,
        max_tokens: 1500
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('No analysis content received')
    }

    const analysis = JSON.parse(content)
    
    // Validate and sanitize the analysis
    return {
      personalityTraits: Array.isArray(analysis.personalityTraits) ? analysis.personalityTraits : [],
      behaviorPatterns: analysis.behaviorPatterns || {},
      learningStyle: analysis.learningStyle || 'reading',
      expertiseLevel: analysis.expertiseLevel || {},
      conversationTone: analysis.conversationTone || 'professional',
      communicationPatterns: analysis.communicationPatterns || {},
      topicInterests: Array.isArray(analysis.topicInterests) ? analysis.topicInterests : [],
      painPoints: Array.isArray(analysis.painPoints) ? analysis.painPoints : [],
      aiMetadata: analysis.aiMetadata || {},
      confidenceScore: Math.min(Math.max(analysis.confidenceScore || 0.5, 0), 1)
    }

  } catch (error) {
    console.error('Error in AI analysis:', error)
    
    // Return default analysis on error
    return {
      personalityTraits: [],
      behaviorPatterns: {},
      learningStyle: 'reading',
      expertiseLevel: {},
      conversationTone: 'professional',
      communicationPatterns: {},
      topicInterests: [],
      painPoints: [],
      aiMetadata: {},
      confidenceScore: 0.3
    }
  }
}

