import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getUserContextWithMigration, createUnifiedUserContext } from '@/lib/user-context-migration'
import { processUserContext, getComprehensiveUserContext, extractMetadataFromMessage, refreshUserContextAfterUpdate } from '@/lib/ai-context-manager'

export async function POST(request: NextRequest) {
  try {
    const { message, messages, config: clientConfig, currentUrl } = await request.json()

    if (!process.env.OPEN_AI_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Get session for user context
    const session = await getServerSession(authOptions)

    // Get comprehensive user context
    let finalUserContext: any = null
    if (session?.user?.id) {
      try {
        const comprehensiveContext = await getComprehensiveUserContext(session.user.id)
        if (comprehensiveContext) {
          finalUserContext = {
            user: comprehensiveContext.user,
            profile: comprehensiveContext.profile ? {
              company: {
                name: comprehensiveContext.profile.companyName,
                size: comprehensiveContext.profile.companySize,
                industry: comprehensiveContext.profile.industry,
                role: comprehensiveContext.profile.role,
                department: comprehensiveContext.profile.department,
                website: comprehensiveContext.profile.website
              },
              professional: {
                experience: comprehensiveContext.profile.experience,
                primaryGoals: comprehensiveContext.profile.primaryGoals,
                currentProjects: comprehensiveContext.profile.currentProjects,
                budget: comprehensiveContext.profile.budget,
                teamSize: comprehensiveContext.profile.teamSize
              },
              preferences: {
                communicationStyle: comprehensiveContext.profile.communicationStyle,
                preferredContentType: comprehensiveContext.profile.preferredContentType,
                timezone: comprehensiveContext.profile.timezone,
                workingHours: comprehensiveContext.profile.workingHours,
                language: comprehensiveContext.profile.language
              },
              marketing: {
                leadSource: comprehensiveContext.profile.leadSource,
                leadScore: comprehensiveContext.profile.leadScore,
                marketingOptIn: comprehensiveContext.profile.marketingOptIn,
                newsletterOptIn: comprehensiveContext.profile.newsletterOptIn
              }
            } : undefined,
            aiInsights: comprehensiveContext.aiInsights ? {
              personalityTraits: comprehensiveContext.aiInsights.personalityTraits,
              behaviorPatterns: comprehensiveContext.aiInsights.behaviorPatterns,
              learningStyle: comprehensiveContext.aiInsights.learningStyle,
              expertiseLevel: comprehensiveContext.aiInsights.expertiseLevel,
              conversationTone: comprehensiveContext.aiInsights.conversationTone,
              communicationPatterns: comprehensiveContext.aiInsights.communicationPatterns,
              topicInterests: comprehensiveContext.aiInsights.topicInterests,
              painPoints: comprehensiveContext.aiInsights.painPoints,
              confidenceScore: comprehensiveContext.aiInsights.confidenceScore,
              lastAnalysisAt: comprehensiveContext.aiInsights.lastAnalysisAt
            } : undefined,
            aiMetadata: comprehensiveContext.aiInsights?.aiMetadata || {},
            recentInteractions: comprehensiveContext.recentInteractions,
            lastInteraction: comprehensiveContext.lastInteraction
          }
        }
      } catch (error) {
        console.warn('Failed to fetch comprehensive user context:', error)
      }
    }

    // Prefer config supplied by client (preloaded on app startup) to avoid DB hits
    let systemPrompt = clientConfig?.systemPrompt || 'You are a helpful AI assistant for this application.'
    let navigationData: any[] = Array.isArray(clientConfig?.navigationData) ? clientConfig.navigationData : []

    // If not supplied by client, fall back to DB
    if (!clientConfig) {
      try {
        const config = await prisma?.aIChatbotConfig.findFirst({
          where: { isActive: true },
          orderBy: { updatedAt: 'desc' }
        })

        const navigationItems = await prisma?.aIChatbotNavigation.findMany({
          where: { isActive: true },
          orderBy: { name: 'asc' }
        })

        systemPrompt = config?.systemPrompt || systemPrompt
        navigationData = navigationItems.map(nav => ({
          id: nav.id,
          name: nav.name,
          route: nav.route,
          description: nav.description
        }))
      } catch (error) {
        console.warn('Failed to fetch AI chatbot config from database, using defaults:', error)
      }
    }

    // Extract current URL parameters for context
    let currentFilters = {}
    let isOnPublishersPage = false
    
    if (currentUrl) {
      try {
        const url = new URL(currentUrl)
        isOnPublishersPage = url.pathname.includes('/publishers')
        
        if (isOnPublishersPage) {
          const params = url.searchParams
          currentFilters = {
            q: params.get('q') || '',
            niche: params.get('niche') || '',
            language: params.get('language') || '',
            country: params.get('country') || '',
            priceMin: params.get('priceMin') ? Number(params.get('priceMin')) : undefined,
            priceMax: params.get('priceMax') ? Number(params.get('priceMax')) : undefined,
            daMin: params.get('daMin') ? Number(params.get('daMin')) : undefined,
            daMax: params.get('daMax') ? Number(params.get('daMax')) : undefined,
            paMin: params.get('paMin') ? Number(params.get('paMin')) : undefined,
            paMax: params.get('paMax') ? Number(params.get('paMax')) : undefined,
            drMin: params.get('drMin') ? Number(params.get('drMin')) : undefined,
            drMax: params.get('drMax') ? Number(params.get('drMax')) : undefined,
            spamMin: params.get('spamMin') ? Number(params.get('spamMin')) : undefined,
            spamMax: params.get('spamMax') ? Number(params.get('spamMax')) : undefined,
            availability: params.get('availability') === '1' || params.get('availability') === 'true',
            tool: params.get('tool') || undefined,
            backlinkNature: params.get('backlinkNature') || undefined,
            linkPlacement: params.get('linkPlacement') || undefined,
            permanence: params.get('permanence') || undefined,
            remarkIncludes: params.get('remarkIncludes') || undefined,
            lastPublishedAfter: params.get('lastPublishedAfter') || undefined,
            outboundLinkLimitMax: params.get('outboundLinkLimitMax') ? Number(params.get('outboundLinkLimitMax')) : undefined,
            disclaimerIncludes: params.get('disclaimerIncludes') || undefined,
            trend: params.get('trend') || undefined,
          }
        }
      } catch (error) {
        console.warn('Failed to parse current URL:', error)
      }
    }

    // Build OpenAI messages
    const baseSystem = `${systemPrompt}

NAVIGATION DATA:
${navigationData.map((nav: any) => `- ${nav.name}: ${nav.route}`).join('\n')}

When users ask to navigate to a specific page, respond with a special format: [NAVIGATE:ROUTE] where ROUTE is the actual route from the navigation data above. The frontend will handle the navigation.`

    // Add publishers filtering context if on publishers page
    const publishersContext = isOnPublishersPage ? `

PUBLISHERS FILTERING CONTEXT:
You are currently on the publishers page. You can help users filter publishers by understanding their requests and applying appropriate filters.

CURRENT FILTERS:
${Object.entries(currentFilters).filter(([_, v]) => v !== undefined && v !== '' && v !== null).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

AVAILABLE FILTERS:
- q: Search query for website names
- niche: Content niche/category
- language: Website language
- country: Website country
- priceMin/priceMax: Price range in dollars
- daMin/daMax: Domain Authority range (0-100)
- paMin/paMax: Page Authority range (0-100)
- drMin/drMax: Domain Rating range (0-100)
- spamMin/spamMax: Spam Score range (0-10)
- availability: Boolean for available publishers
- tool: "Semrush" or "Ahrefs"
- backlinkNature: "dofollow" or "nofollow"
- linkPlacement: "in-content", "author-bio", or "footer"
- permanence: "lifetime" or "12-months"
- remarkIncludes: Text to include in remarks
- lastPublishedAfter: Date filter (YYYY-MM-DD)
- outboundLinkLimitMax: Maximum outbound links
- disclaimerIncludes: Text to include in disclaimers
- trend: Trend filter

FILTERING INSTRUCTIONS:
1. When users mention price ranges (e.g., "min price 500", "max 3000"), use [FILTER:priceMin=500] or [FILTER:priceMax=3000]
2. For multiple filters, combine them: [FILTER:priceMin=500&priceMax=3000&daMin=30]
3. To reset a specific filter, set it to empty: [FILTER:priceMax=] (removes max price)
4. To reset all filters, use: [FILTER:RESET]
5. For navigation to publishers with filters, use: [NAVIGATE:/publishers?priceMin=500&priceMax=3000]

When users ask about filtering or want to modify search criteria, respond with the appropriate [FILTER:...] command. The frontend will handle applying these filters and refetching the data.` : ''

    // Build comprehensive user context section for AI
    const userContextSection = finalUserContext ? `
COMPREHENSIVE USER CONTEXT:

BASIC INFO:
- User ID: ${finalUserContext.user?.id || 'Not specified'}
- Name: ${finalUserContext.user?.name || 'Not specified'}
- Email: ${finalUserContext.user?.email || 'Not specified'}
- Roles: ${finalUserContext.user?.roles?.join(', ') || 'None'}
- Recent Interactions: ${finalUserContext.recentInteractions || 0}
- Last Interaction: ${finalUserContext.lastInteraction ? new Date(finalUserContext.lastInteraction).toLocaleDateString() : 'Never'}

${finalUserContext.profile ? `
USER-PROVIDED DATA (Stable, with consent):
COMPANY:
- Name: ${finalUserContext.profile.company?.name || 'Not specified'}
- Industry: ${finalUserContext.profile.company?.industry || 'Not specified'}
- Size: ${finalUserContext.profile.company?.size || 'Not specified'}
- Role: ${finalUserContext.profile.company?.role || 'Not specified'}
- Department: ${finalUserContext.profile.company?.department || 'Not specified'}
- Website: ${finalUserContext.profile.company?.website || 'Not specified'}

PROFESSIONAL:
- Experience Level: ${finalUserContext.profile.professional?.experience || 'Not specified'}
- Primary Goals: ${finalUserContext.profile.professional?.primaryGoals?.join(', ') || 'Not specified'}
- Current Projects: ${finalUserContext.profile.professional?.currentProjects?.join(', ') || 'Not specified'}
- Budget: ${finalUserContext.profile.professional?.budget || 'Not specified'}
- Team Size: ${finalUserContext.profile.professional?.teamSize || 'Not specified'}

PREFERENCES:
- Communication Style: ${finalUserContext.profile.preferences?.communicationStyle || 'Not specified'}
- Content Type: ${finalUserContext.profile.preferences?.preferredContentType?.join(', ') || 'Not specified'}
- Timezone: ${finalUserContext.profile.preferences?.timezone || 'Not specified'}
- Language: ${finalUserContext.profile.preferences?.language || 'Not specified'}

MARKETING & LEADS:
- Lead Source: ${finalUserContext.profile.marketing?.leadSource || 'Not specified'}
- Lead Score: ${finalUserContext.profile.marketing?.leadScore || 'Not scored'}
- Marketing Opt-in: ${finalUserContext.profile.marketing?.marketingOptIn ? 'Yes' : 'No'}
- Newsletter Opt-in: ${finalUserContext.profile.marketing?.newsletterOptIn ? 'Yes' : 'No'}
` : ''}

${finalUserContext.aiInsights ? `
AI-GENERATED INSIGHTS (Dynamic, rapidly updated):
PERSONALITY & BEHAVIOR:
- Personality Traits: ${Array.isArray(finalUserContext.aiInsights.personalityTraits) ? finalUserContext.aiInsights.personalityTraits.join(', ') : 'Not analyzed'}
- Learning Style: ${finalUserContext.aiInsights.learningStyle || 'Not analyzed'}
- Conversation Tone: ${finalUserContext.aiInsights.conversationTone || 'Not analyzed'}

EXPERTISE & INTERESTS:
- Topic Interests: ${Array.isArray(finalUserContext.aiInsights.topicInterests) ? finalUserContext.aiInsights.topicInterests.join(', ') : 'Not analyzed'}
- Pain Points: ${Array.isArray(finalUserContext.aiInsights.painPoints) ? finalUserContext.aiInsights.painPoints.join(', ') : 'Not identified'}
- Expertise Level: ${finalUserContext.aiInsights.expertiseLevel ? JSON.stringify(finalUserContext.aiInsights.expertiseLevel) : 'Not analyzed'}

COMMUNICATION PATTERNS:
- Behavior Patterns: ${finalUserContext.aiInsights.behaviorPatterns ? JSON.stringify(finalUserContext.aiInsights.behaviorPatterns) : 'Not analyzed'}
- Communication Patterns: ${finalUserContext.aiInsights.communicationPatterns ? JSON.stringify(finalUserContext.aiInsights.communicationPatterns) : 'Not analyzed'}

AI CONFIDENCE:
- Confidence Score: ${finalUserContext.aiInsights.confidenceScore || 'Not calculated'}
- Last Analysis: ${finalUserContext.aiInsights.lastAnalysisAt ? new Date(finalUserContext.aiInsights.lastAnalysisAt).toLocaleDateString() : 'Never'}
` : ''}

${finalUserContext.aiMetadata ? `
AI METADATA (Dynamic, namespaced keys for marketing & personalization):
${Object.keys(finalUserContext.aiMetadata).length > 0 ? Object.entries(finalUserContext.aiMetadata).map(([k, v]) => `- ${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('\n') : 'None'}
` : ''}

CONTEXT USAGE INSTRUCTIONS:
1. Use this context to personalize every response
2. Adapt your communication style to match their preferences
3. Reference their company, role, and goals when relevant
4. Use their expertise level to adjust technical depth
5. Address their pain points and interests
6. Leverage AI metadata for marketing insights
7. Build on previous conversations and interests
8. Be consistent with their communication patterns` : ''

    const fullSystemPrompt = baseSystem + publishersContext + userContextSection

    const chatMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: fullSystemPrompt },
      ...messages.map((m: any) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
      { role: 'user', content: message },
    ]

    const openAIRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPEN_AI_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: chatMessages,
        temperature: 0.7,
        top_p: 0.95,
        max_tokens: 1024,
      }),
    })

    if (!openAIRes.ok) {
      const errText = await openAIRes.text()
      throw new Error(`OpenAI API error: ${openAIRes.status} ${errText}`)
    }

    const data = await openAIRes.json()
    const text = data?.choices?.[0]?.message?.content || ''

    // Log user interaction immediately (non-blocking)
    if (session?.user?.id) {
      prisma.userInteraction.create({
        data: {
          userId: session.user.id,
          interactionType: 'CHAT_MESSAGE',
          content: message,
          response: text,
          context: {
            currentUrl,
            messageCount: messages?.length || 0,
            userContext: finalUserContext?.profile ? {
              company: finalUserContext.profile.company?.name,
              role: finalUserContext.profile.company?.role,
              experience: finalUserContext.profile.professional?.experience
            } : null
          }
        }
      }).catch(error => console.warn('Failed to log user interaction:', error))

      // Process context analysis in background (non-blocking)
      processContextInBackground(session.user.id, message, text, messages || [], currentUrl, finalUserContext)
    }

    return NextResponse.json({ response: text })
  } catch (error) {
    console.error('Error in AI chat API:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}

// Background context processing function (non-blocking)
async function processContextInBackground(
  userId: string,
  message: string,
  response: string,
  messageHistory: any[],
  currentUrl: string,
  currentContext: any
) {
  try {
    console.log('🔄 Starting background context analysis...')
    
    // Process user context with comprehensive AI analysis
    const contextResult = await processUserContext(
      userId,
      message,
      response,
      messageHistory,
      currentUrl
    )

    console.log(`🧠 Background context processing result:`, {
      shouldUpdate: contextResult.shouldUpdate,
      confidence: contextResult.confidence,
      reasoning: contextResult.reasoning
    })

    // Extract additional metadata from the message
    const additionalMetadata = await extractMetadataFromMessage(
      userId,
      message,
      currentContext
    )

    if (Object.keys(additionalMetadata).length > 0) {
      console.log(`📊 Additional metadata extracted:`, additionalMetadata)
      
      // Update AI insights with additional metadata
      const existingInsights = await prisma.userAIInsights.findUnique({
        where: { userId }
      })

      if (existingInsights) {
        await prisma.userAIInsights.update({
          where: { userId },
          data: {
            aiMetadata: {
              ...(existingInsights.aiMetadata as any || {}),
              ...additionalMetadata
            },
            lastAnalysisAt: new Date()
          }
        })
      }
    }

    // Refresh user context cache after updates
    if (contextResult.shouldUpdate || Object.keys(additionalMetadata).length > 0) {
      await refreshUserContextAfterUpdate(userId)
      console.log('✅ User context refreshed after updates')
    }

  } catch (error) {
    console.warn('Background context processing failed:', error)
  }
}

