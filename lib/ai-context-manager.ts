import { prisma } from '@/lib/db'

/**
 * AI Context Manager - Handles all AI-driven context extraction and management
 */

export interface AIInsightData {
  personalityTraits?: string[]
  behaviorPatterns?: Record<string, any>
  learningStyle?: string
  expertiseLevel?: Record<string, string>
  conversationTone?: string
  communicationPatterns?: Record<string, any>
  topicInterests?: string[]
  painPoints?: string[]
  aiMetadata?: Record<string, any>
  confidenceScore?: number
}

export interface ContextExtractionResult {
  shouldUpdate: boolean
  insights: AIInsightData
  reasoning: string
  confidence: number
}

/**
 * Main function to process user message and extract context
 */
export async function processUserContext(
  userId: string,
  message: string,
  response: string,
  messageHistory: any[],
  currentUrl?: string
): Promise<ContextExtractionResult> {
  try {
    // Get current user context
    const currentContext = await getUserCurrentContext(userId)
    
    // Quick check if we should even analyze this message
    if (!shouldAnalyzeMessage(message, currentContext)) {
      return {
        shouldUpdate: false,
        insights: {},
        reasoning: 'Message does not contain significant new information',
        confidence: 0.1
      }
    }
    
    // Extract insights from the conversation
    const extractionResult = await extractContextFromConversation(
      message,
      response,
      messageHistory,
      currentContext,
      currentUrl
    )

    // Update AI insights if significant changes detected
    if (extractionResult.shouldUpdate) {
      await updateUserAIInsights(userId, extractionResult.insights)
    }

    return extractionResult
  } catch (error) {
    console.error('Error processing user context:', error)
    return {
      shouldUpdate: false,
      insights: {},
      reasoning: 'Error processing context',
      confidence: 0
    }
  }
}

/**
 * Quick check to determine if message should be analyzed
 */
function shouldAnalyzeMessage(message: string, currentContext: any): boolean {
  // Skip very short messages
  if (message.length < 10) return false
  
  // Skip simple greetings
  const greetings = ['hi', 'hello', 'hey', 'thanks', 'thank you', 'ok', 'okay', 'yes', 'no']
  if (greetings.some(greeting => message.toLowerCase().includes(greeting)) && message.length < 50) {
    return false
  }
  
  // Skip if we already have recent analysis (within last hour)
  if (currentContext.aiInsights?.lastAnalysisAt) {
    const lastAnalysis = new Date(currentContext.aiInsights.lastAnalysisAt)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    if (lastAnalysis > oneHourAgo) {
      return false
    }
  }
  
  // Look for keywords that indicate new information
  const infoKeywords = [
    'work at', 'company', 'project', 'budget', 'team', 'role', 'experience',
    'challenge', 'problem', 'goal', 'need', 'want', 'looking for',
    'tool', 'software', 'platform', 'service', 'solution'
  ]
  
  const hasInfoKeywords = infoKeywords.some(keyword => 
    message.toLowerCase().includes(keyword)
  )
  
  return hasInfoKeywords || message.length > 100
}

/**
 * Get current user context for AI analysis
 */
async function getUserCurrentContext(userId: string) {
  const [profile, aiInsights] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId } }),
    prisma.userAIInsights.findUnique({ where: { userId } })
  ])

  return {
    profile,
    aiInsights,
    hasProfile: !!profile,
    hasAIInsights: !!aiInsights
  }
}

/**
 * Extract context from conversation using AI
 */
async function extractContextFromConversation(
  message: string,
  response: string,
  messageHistory: any[],
  currentContext: any,
  currentUrl?: string
): Promise<ContextExtractionResult> {
  try {
    const conversationText = messageHistory
      .slice(-10) // Last 10 messages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n')
      .slice(0, 3000) // Limit to avoid token limits

    const currentMetadata = currentContext.aiInsights?.aiMetadata || {}
    const currentPersonality = currentContext.aiInsights?.personalityTraits || []
    const currentInterests = currentContext.aiInsights?.topicInterests || []
    const currentPainPoints = currentContext.aiInsights?.painPoints || []

    const analysisPrompt = `
Analyze this conversation for NEW user information. Be concise and focused.

CURRENT CONTEXT:
- Personality: ${currentPersonality.join(', ') || 'None'}
- Interests: ${currentInterests.join(', ') || 'None'}
- Pain Points: ${currentPainPoints.join(', ') || 'None'}
- Metadata: ${Object.keys(currentMetadata).length} keys

CONVERSATION:
Message: ${message}
Response: ${response}
History: ${conversationText.slice(0, 1000)}

EXTRACT ONLY NEW INFORMATION:
{
  "shouldUpdate": true/false,
  "reasoning": "Brief reason",
  "confidence": 0.0-1.0,
  "insights": {
    "personalityTraits": ["new trait only"],
    "behaviorPatterns": {
      "communicationStyle": "formal|casual|technical|brief",
      "technicalDepth": "basic|intermediate|advanced"
    },
    "conversationTone": "professional|casual|technical|friendly",
    "topicInterests": ["new interest only"],
    "painPoints": ["new pain point only"],
    "aiMetadata": {
      "company:name": "if mentioned",
      "company:size": "startup|small|medium|enterprise",
      "project:type": "seo|content|linkbuilding|marketing",
      "tools:mentioned": ["tool1", "tool2"],
      "budget:level": "low|medium|high",
      "goals:mentioned": ["goal1"],
      "challenges:mentioned": ["challenge1"],
      "timeline:urgency": "low|medium|high"
    }
  }
}

RULES:
- Only NEW information not in current context
- Be very conservative with shouldUpdate
- Focus on clear, obvious information
- Skip if just greetings or small talk
`

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPEN_AI_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert user behavior analyst. Extract structured insights from conversation data. Respond only with valid JSON.' 
          },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.1,
        max_tokens: 2000
      })
    })

    if (!aiResponse.ok) {
      throw new Error(`OpenAI API error: ${aiResponse.status}`)
    }

    const data = await aiResponse.json()
    const content = data?.choices?.[0]?.message?.content

    if (!content) {
      return {
        shouldUpdate: false,
        insights: {},
        reasoning: 'No analysis content received',
        confidence: 0
      }
    }

    const result = JSON.parse(content)
    
    // Validate and sanitize the result
    return {
      shouldUpdate: result.shouldUpdate || false,
      reasoning: result.reasoning || 'No reasoning provided',
      confidence: Math.min(Math.max(result.confidence || 0, 0), 1),
      insights: {
        personalityTraits: Array.isArray(result.insights?.personalityTraits) ? result.insights.personalityTraits : [],
        behaviorPatterns: result.insights?.behaviorPatterns || {},
        learningStyle: result.insights?.learningStyle || 'reading',
        expertiseLevel: result.insights?.expertiseLevel || {},
        conversationTone: result.insights?.conversationTone || 'professional',
        communicationPatterns: result.insights?.communicationPatterns || {},
        topicInterests: Array.isArray(result.insights?.topicInterests) ? result.insights.topicInterests : [],
        painPoints: Array.isArray(result.insights?.painPoints) ? result.insights.painPoints : [],
        aiMetadata: result.insights?.aiMetadata || {},
        confidenceScore: result.confidence || 0.5
      }
    }

  } catch (error) {
    console.error('Error extracting context from conversation:', error)
    return {
      shouldUpdate: false,
      insights: {},
      reasoning: 'Error in context extraction',
      confidence: 0
    }
  }
}

/**
 * Update user AI insights with new data
 */
async function updateUserAIInsights(userId: string, newInsights: AIInsightData) {
  try {
    const existingInsights = await prisma.userAIInsights.findUnique({
      where: { userId }
    })

    if (existingInsights) {
      // Merge with existing insights
      const mergedInsights = {
        personalityTraits: mergeArrays(existingInsights.personalityTraits as string[], newInsights.personalityTraits || []),
        behaviorPatterns: { ...(existingInsights.behaviorPatterns as any || {}), ...(newInsights.behaviorPatterns || {}) },
        learningStyle: newInsights.learningStyle || existingInsights.learningStyle,
        expertiseLevel: { ...(existingInsights.expertiseLevel as any || {}), ...(newInsights.expertiseLevel || {}) },
        conversationTone: newInsights.conversationTone || existingInsights.conversationTone,
        communicationPatterns: { ...(existingInsights.communicationPatterns as any || {}), ...(newInsights.communicationPatterns || {}) },
        topicInterests: mergeArrays(existingInsights.topicInterests as string[], newInsights.topicInterests || []),
        painPoints: mergeArrays(existingInsights.painPoints as string[], newInsights.painPoints || []),
        aiMetadata: { ...(existingInsights.aiMetadata as any || {}), ...(newInsights.aiMetadata || {}) },
        confidenceScore: newInsights.confidenceScore || existingInsights.confidenceScore
      }

      await prisma.userAIInsights.update({
        where: { userId },
        data: {
          ...mergedInsights,
          lastAnalysisAt: new Date()
        }
      })

      // Log the update
      await prisma.aIInsightUpdate.create({
        data: {
          userAIInsightsId: existingInsights.id,
          updateType: 'GENERAL',
          newValue: newInsights,
          aiConfidence: newInsights.confidenceScore || 0.5,
          aiReasoning: 'Real-time conversation analysis',
          source: 'chat_interaction'
        }
      })
    } else {
      // Create new insights record
      const newRecord = await prisma.userAIInsights.create({
        data: {
          userId,
          personalityTraits: newInsights.personalityTraits || [],
          behaviorPatterns: newInsights.behaviorPatterns || {},
          learningStyle: newInsights.learningStyle || 'reading',
          expertiseLevel: newInsights.expertiseLevel || {},
          conversationTone: newInsights.conversationTone || 'professional',
          communicationPatterns: newInsights.communicationPatterns || {},
          topicInterests: newInsights.topicInterests || [],
          painPoints: newInsights.painPoints || [],
          aiMetadata: newInsights.aiMetadata || {},
          confidenceScore: newInsights.confidenceScore || 0.5,
          lastAnalysisAt: new Date()
        }
      })

      // Log the creation
      await prisma.aIInsightUpdate.create({
        data: {
          userAIInsightsId: newRecord.id,
          updateType: 'GENERAL',
          newValue: newInsights,
          aiConfidence: newInsights.confidenceScore || 0.5,
          aiReasoning: 'Initial conversation analysis',
          source: 'chat_interaction'
        }
      })
    }

    console.log(`✅ Updated AI insights for user ${userId}`)
  } catch (error) {
    console.error('Error updating user AI insights:', error)
    throw error
  }
}

/**
 * Merge arrays without duplicates
 */
function mergeArrays(existing: string[], newItems: string[]): string[] {
  const combined = [...existing, ...newItems]
  return [...new Set(combined)].filter(Boolean)
}

/**
 * Get comprehensive user context for AI
 */
export async function getComprehensiveUserContext(userId: string) {
  try {
    const [user, profile, aiInsights, recentInteractions] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: {
          userRoles: {
            where: { isActive: true },
            include: { role: true }
          }
        }
      }),
      prisma.userProfile.findUnique({ where: { userId } }),
      prisma.userAIInsights.findUnique({ where: { userId } }),
      prisma.userInteraction.findMany({
        where: { 
          userId,
          interactionType: 'CHAT_MESSAGE',
          timestamp: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
        },
        orderBy: { timestamp: 'desc' },
        take: 20
      })
    ])

    return {
      user: user ? {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        roles: user.userRoles.map(ur => ur.role?.name).filter(Boolean)
      } : null,
      profile,
      aiInsights,
      recentInteractions: recentInteractions.length,
      lastInteraction: recentInteractions[0]?.timestamp
    }
  } catch (error) {
    console.error('Error getting comprehensive user context:', error)
    return null
  }
}

/**
 * Refresh user context after updates to ensure AI gets latest data
 */
export async function refreshUserContextAfterUpdate(userId: string) {
  try {
    // This function can be used to invalidate any caches or refresh context
    // For now, we'll just log that the context was refreshed
    console.log(`🔄 Refreshing context for user ${userId} after updates`)
    
    // In a more sophisticated setup, you might:
    // - Invalidate Redis cache
    // - Update in-memory context store
    // - Trigger context refresh in other services
    
    return true
  } catch (error) {
    console.error('Error refreshing user context:', error)
    return false
  }
}

/**
 * Extract specific metadata from user message
 */
export async function extractMetadataFromMessage(
  userId: string,
  message: string,
  context?: any
): Promise<Record<string, any>> {
  try {
    const extractionPrompt = `
Extract metadata from: "${message}"

JSON only:
{
  "company:name": "if mentioned",
  "company:size": "startup|small|medium|enterprise",
  "project:type": "seo|content|linkbuilding|marketing",
  "tools:mentioned": ["tool1"],
  "budget:level": "low|medium|high",
  "team:role": "if mentioned",
  "goals:mentioned": ["goal1"],
  "challenges:mentioned": ["challenge1"],
  "timeline:urgency": "low|medium|high"
}

Only explicit mentions.
`

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPEN_AI_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Extract metadata from user messages. Respond only with valid JSON.' },
          { role: 'user', content: extractionPrompt }
        ],
        temperature: 0.1,
        max_tokens: 500
      })
    })

    if (!aiResponse.ok) {
      throw new Error(`OpenAI API error: ${aiResponse.status}`)
    }

    const data = await aiResponse.json()
    const content = data?.choices?.[0]?.message?.content

    if (!content) {
      return {}
    }

    const result = JSON.parse(content)
    
    // Filter out empty values
    const filteredResult: Record<string, any> = {}
    for (const [key, value] of Object.entries(result)) {
      if (value && value !== '' && value !== null && value !== undefined) {
        if (Array.isArray(value) && value.length > 0) {
          filteredResult[key] = value
        } else if (!Array.isArray(value)) {
          filteredResult[key] = value
        }
      }
    }

    return filteredResult
  } catch (error) {
    console.error('Error extracting metadata from message:', error)
    return {}
  }
}

