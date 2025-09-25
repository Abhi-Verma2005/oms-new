import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { message, messages, config: clientConfig, currentUrl, userContext } = await request.json()
    
    // Debug: Log received user context
    console.log('Received user context in API:', userContext)
    
    // Get session for user context
    const session = await getServerSession(authOptions)

    if (!process.env.OPEN_AI_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Log user interaction if authenticated
    if (session?.user?.id) {
      try {
        await prisma.userInteraction.create({
          data: {
            userId: session.user.id,
            interactionType: 'CHAT_MESSAGE',
            content: message,
            context: {
              currentUrl,
              messageCount: messages?.length || 0,
              userContext: userContext ? {
                company: userContext.company?.name,
                role: userContext.company?.role,
                experience: userContext.professional?.experience
              } : null
            }
          }
        })
      } catch (error) {
        console.warn('Failed to log user interaction:', error)
      }
    }

    // Prefer config supplied by client (preloaded on app startup) to avoid DB hits
    let systemPrompt = clientConfig?.systemPrompt || 'You are a helpful AI assistant for this application.'
    console.log(systemPrompt)
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

    // Extract current URL and existing parameters
    const currentUrlObj = currentUrl ? new URL(currentUrl) : null
    const currentParams = currentUrlObj ? new URLSearchParams(currentUrlObj.search) : new URLSearchParams()
    const currentPath = currentUrlObj ? currentUrlObj.pathname : ''
    
    // Build OpenAI messages
    const filterContext = `
FILTERING CAPABILITIES:

Publishers Page (/publishers):
- Basic filters: niche, language, country
- Price range: priceMin, priceMax (e.g., priceMin=100&priceMax=500)
- Domain Authority: daMin, daMax (0-100)
- Page Authority: paMin, paMax (0-100)  
- Domain Rating: drMin, drMax (0-100)
- Spam Score: spamMin, spamMax (0-100)
- Traffic: semrushOverallTrafficMin, semrushOrganicTrafficMin
- Backlinks: backlinksAllowedMin, backlinkNature (follow/nofollow)
- Link Placement: linkPlacement (header/content/footer)
- Permanence: permanence (permanent/guaranteed)
- Turnaround: tatDaysMin, tatDaysMax
- Content: sampleUrl, remarkIncludes
- Guidelines: guidelinesUrlIncludes, disclaimerIncludes
- Dates: lastPublishedAfter (YYYY-MM-DD)
- Limits: outboundLinkLimitMax
- Availability: availability (true/false)
- Trend: trend (rising/stable/declining)
- Search: q (search query)

CURRENT CONTEXT:
- Current URL: ${currentUrl || 'Not provided'}
- Current Path: ${currentPath}
- Current Parameters: ${currentParams.toString() || 'None'}

FILTER COMBINATION RULES:
1. ALWAYS preserve existing filters unless explicitly asked to remove them
2. When user adds new filters, combine them with existing ones
3. When user modifies a filter (e.g., changes priceMin from 100 to 200), replace that specific parameter
4. When user says "clear filters" or "reset", start fresh
5. Maintain conversation context - if user previously set priceMin=1000, and now says "priceMax 5000", combine them: priceMin=1000&priceMax=5000

Examples of Smart Filter Combination:
- Current: /publishers?priceMin=1000
- User: "add price max 5000" → /publishers?priceMin=1000&priceMax=5000
- User: "also filter by tech niche" → /publishers?priceMin=1000&priceMax=5000&niche=tech
- User: "change minimum price to 2000" → /publishers?priceMin=2000&priceMax=5000&niche=tech

Other Pages with Filters:
- Admin Users (/admin/users): search, status, paymentStatus, tagIds, hasRoles, dateFrom, dateTo, sortBy, sortOrder, page, limit
- Admin Orders (/admin/orders): similar filtering options

When users ask to filter or search for specific content, construct the appropriate URL with query parameters and use the format: [NAVIGATE:FULL_URL_WITH_PARAMS]
`

    // Fetch user context from database if not provided
    let finalUserContext = userContext
    if (!finalUserContext && session?.user?.id) {
      try {
        const dbUserContext = await prisma.userContext.findUnique({
          where: { userId: session.user.id }
        })
        
        if (dbUserContext) {
          finalUserContext = {
            company: {
              name: dbUserContext.companyName,
              size: dbUserContext.companySize,
              industry: dbUserContext.industry,
              role: dbUserContext.role,
              department: dbUserContext.department
            },
            professional: {
              experience: dbUserContext.experience,
              primaryGoals: dbUserContext.primaryGoals,
              currentProjects: dbUserContext.currentProjects
            },
            preferences: {
              communicationStyle: dbUserContext.communicationStyle,
              preferredContentType: dbUserContext.preferredContentType,
              timezone: dbUserContext.timezone,
              workingHours: dbUserContext.workingHours
            },
            aiInsights: {
              learningStyle: dbUserContext.learningStyle,
              expertiseLevel: dbUserContext.expertiseLevel,
              personalityTraits: dbUserContext.aiInsights?.personalityTraits || [],
              behaviorPatterns: dbUserContext.aiInsights?.behaviorPatterns || []
            }
          }
        }
      } catch (error) {
        console.warn('Failed to fetch user context from database:', error)
      }
    }

    // Build user context section for AI
    const userContextSection = finalUserContext ? `
USER CONTEXT:
- Company: ${finalUserContext.company?.name || 'Not specified'}
- Industry: ${finalUserContext.company?.industry || 'Not specified'}
- Role: ${finalUserContext.company?.role || 'Not specified'}
- Experience Level: ${finalUserContext.professional?.experience || 'Not specified'}
- Primary Goals: ${finalUserContext.professional?.primaryGoals?.join(', ') || 'Not specified'}
- Communication Style: ${finalUserContext.preferences?.communicationStyle || 'Not specified'}
- Learning Style: ${finalUserContext.aiInsights?.learningStyle || 'Not specified'}
- Expertise Areas: ${Object.keys(finalUserContext.aiInsights?.expertiseLevel || {}).join(', ') || 'Not specified'}

Use this context to personalize your responses. Adapt your communication style to match the user's preferences and experience level. Provide relevant examples and explanations based on their industry and goals.` : ''

    const baseSystem = `${systemPrompt}

NAVIGATION DATA:
${navigationData.map((nav: any) => `- ${nav.name}: ${nav.route}`).join('\n')}

${filterContext}

${userContextSection}

When users ask to navigate to a specific page, respond with a special format: [NAVIGATE:ROUTE] where ROUTE is the actual route from the navigation data above. The frontend will handle the navigation.

When users ask to filter, search, or find specific content, construct the appropriate URL with query parameters and use the format: [NAVIGATE:FULL_URL_WITH_PARAMS] where FULL_URL_WITH_PARAMS includes the base route and all relevant query parameters.`

    const chatMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: baseSystem },
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

    // Log AI response if user is authenticated
    if (session?.user?.id) {
      try {
        // Find the most recent interaction to update with response
        const recentInteraction = await prisma.userInteraction.findFirst({
          where: { 
            userId: session.user.id,
            interactionType: 'CHAT_MESSAGE',
            content: message
          },
          orderBy: { timestamp: 'desc' }
        })

        if (recentInteraction) {
          await prisma.userInteraction.update({
            where: { id: recentInteraction.id },
            data: { response: text }
          })
        }

        // Check if we should trigger context analysis
        const recentMessages = await prisma.userInteraction.count({
          where: { 
            userId: session.user.id,
            interactionType: 'CHAT_MESSAGE',
            timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
          }
        })

        // Trigger analysis if we have enough recent interactions
        if (recentMessages >= 5) {
          // Queue analysis (don't wait for it)
          fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/user-context/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              interactions: [{
                type: 'CHAT_MESSAGE',
                content: message,
                response: text,
                timestamp: new Date().toISOString()
              }]
            })
          }).catch(err => console.warn('Failed to trigger context analysis:', err))
        }
      } catch (error) {
        console.warn('Failed to log AI response or trigger analysis:', error)
      }
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
