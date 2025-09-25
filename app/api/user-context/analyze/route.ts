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
    const { interactions = [] } = body

    // Get user's recent interactions for analysis
    const recentInteractions = await prisma.userInteraction.findMany({
      where: { userId: session.user.id },
      orderBy: { timestamp: 'desc' },
      take: 50
    })

    // Get current user context
    const userContext = await prisma.userContext.findUnique({
      where: { userId: session.user.id }
    })

    // Combine interactions for analysis
    const allInteractions = [
      ...interactions,
      ...recentInteractions.map(i => ({
        type: i.interactionType,
        content: i.content,
        response: i.response,
        context: i.context,
        sentiment: i.sentiment,
        intent: i.intent,
        topics: i.topics,
        preferences: i.preferences,
        timestamp: i.timestamp
      }))
    ]

    // Analyze interactions with AI
    const analysisResult = await analyzeUserInteractions(allInteractions, userContext)

    // Update user context with AI insights
    const updatedContext = await prisma.userContext.upsert({
      where: { userId: session.user.id },
      update: {
        aiInsights: {
          ...userContext?.aiInsights,
          ...analysisResult.insights,
          lastAnalyzed: new Date().toISOString()
        },
        learningStyle: analysisResult.insights.learningStyle || userContext?.learningStyle,
        expertiseLevel: {
          ...userContext?.expertiseLevel,
          ...analysisResult.insights.expertiseLevel
        }
      },
      create: {
        userId: session.user.id,
        aiInsights: {
          ...analysisResult.insights,
          lastAnalyzed: new Date().toISOString()
        },
        learningStyle: analysisResult.insights.learningStyle,
        expertiseLevel: analysisResult.insights.expertiseLevel || {},
        primaryGoals: [],
        currentProjects: [],
        preferredContentType: []
      }
    })

    // Create context update record
    await prisma.contextUpdate.create({
      data: {
        userContextId: updatedContext.id,
        updateType: 'AI_INSIGHTS',
        field: 'analysis',
        newValue: analysisResult.insights,
        aiConfidence: analysisResult.confidence,
        aiReasoning: analysisResult.reasoning,
        source: 'ai_analysis'
      }
    })

    return NextResponse.json({
      success: true,
      insights: analysisResult.insights,
      confidence: analysisResult.confidence,
      reasoning: analysisResult.reasoning,
      lastUpdated: updatedContext.lastUpdated.toISOString()
    })
  } catch (error) {
    console.error('Error analyzing user context:', error)
    return NextResponse.json(
      { error: 'Failed to analyze user context' },
      { status: 500 }
    )
  }
}

async function analyzeUserInteractions(interactions: any[], currentContext: any) {
  if (!process.env.OPEN_AI_KEY) {
    throw new Error('OpenAI API key not configured')
  }

  // Prepare interaction summary for AI analysis
  const interactionSummary = interactions.slice(0, 20).map(i => ({
    type: i.type,
    content: i.content?.substring(0, 200), // Truncate for token efficiency
    sentiment: i.sentiment,
    intent: i.intent,
    topics: i.topics,
    timestamp: i.timestamp
  })).filter(i => i.content)

  const currentContextSummary = currentContext ? {
    company: {
      name: currentContext.companyName,
      size: currentContext.companySize,
      industry: currentContext.industry
    },
    professional: {
      experience: currentContext.experience,
      goals: currentContext.primaryGoals,
      projects: currentContext.currentProjects
    },
    preferences: {
      communicationStyle: currentContext.communicationStyle,
      contentTypes: currentContext.preferredContentType
    }
  } : {}

  const prompt = `
Analyze the following user interactions and current context to generate insights about the user's preferences, communication style, expertise level, and learning style.

CURRENT CONTEXT:
${JSON.stringify(currentContextSummary, null, 2)}

RECENT INTERACTIONS:
${JSON.stringify(interactionSummary, null, 2)}

Based on this data, provide insights in the following JSON format:
{
  "learningStyle": "visual|auditory|kinesthetic|reading" (or null if unclear),
  "expertiseLevel": {
    "seo": 0.0-1.0,
    "content-marketing": 0.0-1.0,
    "link-building": 0.0-1.0,
    "digital-marketing": 0.0-1.0
  },
  "personalityTraits": ["trait1", "trait2", "trait3"],
  "behaviorPatterns": ["pattern1", "pattern2"],
  "communicationStyle": "formal|casual|technical|brief" (or null if unclear),
  "preferredContentType": ["video", "text", "infographics", "tutorials"],
  "confidence": 0.0-1.0
}

Focus on:
1. Communication patterns and tone
2. Technical knowledge level based on questions and terminology
3. Preferred learning methods based on interaction types
4. Professional context and goals
5. Personality traits from communication style

Be conservative with confidence scores. Only include insights you're reasonably confident about based on the data.
`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPEN_AI_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert at analyzing user behavior and preferences from interaction data. Respond only with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 800,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('No content received from OpenAI')
    }

    // Parse the JSON response
    const analysis = JSON.parse(content)

    // Validate and clean the response
    const cleanAnalysis = {
      learningStyle: ['visual', 'auditory', 'kinesthetic', 'reading'].includes(analysis.learningStyle) 
        ? analysis.learningStyle : null,
      expertiseLevel: analysis.expertiseLevel || {},
      personalityTraits: Array.isArray(analysis.personalityTraits) 
        ? analysis.personalityTraits.slice(0, 5) : [],
      behaviorPatterns: Array.isArray(analysis.behaviorPatterns) 
        ? analysis.behaviorPatterns.slice(0, 5) : [],
      communicationStyle: ['formal', 'casual', 'technical', 'brief'].includes(analysis.communicationStyle) 
        ? analysis.communicationStyle : null,
      preferredContentType: Array.isArray(analysis.preferredContentType) 
        ? analysis.preferredContentType.slice(0, 5) : [],
      confidence: Math.max(0, Math.min(1, analysis.confidence || 0.5))
    }

    return {
      insights: cleanAnalysis,
      confidence: cleanAnalysis.confidence,
      reasoning: `Analyzed ${interactions.length} interactions to identify user patterns and preferences.`
    }
  } catch (error) {
    console.error('OpenAI analysis error:', error)
    
    // Fallback analysis based on simple heuristics
    return {
      insights: {
        learningStyle: null,
        expertiseLevel: {},
        personalityTraits: [],
        behaviorPatterns: [],
        communicationStyle: null,
        preferredContentType: [],
        confidence: 0.3
      },
      confidence: 0.3,
      reasoning: 'Fallback analysis due to API error. Limited insights available.'
    }
  }
}

