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

    // Fetch user context from database if not provided, and enrich with core user info
    let finalUserContext = userContext
    if (!finalUserContext && session?.user?.id) {
      try {
        const [dbUser, dbUserContext] = await Promise.all([
          prisma.user.findUnique({
            where: { id: session.user.id },
            include: {
              userRoles: {
                where: { isActive: true },
                include: { role: true }
              }
            }
          }),
          prisma.userContext.findUnique({
            where: { userId: session.user.id }
          })
        ])
        
        if (dbUserContext || dbUser) {
          finalUserContext = {
            user: dbUser ? {
              id: dbUser.id,
              name: dbUser.name,
              email: dbUser.email,
              image: dbUser.image,
              roles: (dbUser.userRoles || []).filter(ur => ur.isActive).map(ur => ur.role?.name).filter(Boolean)
            } : undefined,
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
            },
            aiMetadata: dbUserContext.aiMetadata || {}
          }
        }
      } catch (error) {
        console.warn('Failed to fetch user context from database:', error)
      }
    }

    // Build user context section for AI
    const userContextSection = finalUserContext ? `
USER CONTEXT:
- User: ${finalUserContext.user?.name || 'Not specified'} (${finalUserContext.user?.email || 'email unknown'})
- Roles: ${(finalUserContext.user?.roles || []).join(', ') || 'None'}
- Company: ${finalUserContext.company?.name || 'Not specified'}
- Industry: ${finalUserContext.company?.industry || 'Not specified'}
- Role: ${finalUserContext.company?.role || 'Not specified'}
- Experience Level: ${finalUserContext.professional?.experience || 'Not specified'}
- Primary Goals: ${finalUserContext.professional?.primaryGoals?.join(', ') || 'Not specified'}
- Communication Style: ${finalUserContext.preferences?.communicationStyle || 'Not specified'}
- Learning Style: ${finalUserContext.aiInsights?.learningStyle || 'Not specified'}
- Expertise Areas: ${Object.keys(finalUserContext.aiInsights?.expertiseLevel || {}).join(', ') || 'Not specified'}

AI METADATA (dynamic): ${finalUserContext.aiMetadata ? JSON.stringify(finalUserContext.aiMetadata).slice(0, 500) + (JSON.stringify(finalUserContext.aiMetadata).length > 500 ? '…' : '') : 'None'}

Use this context to personalize your responses. Adapt your communication style to match the user's preferences and experience level. Provide relevant examples and explanations based on their industry and goals.` : ''

    const baseSystem = `${systemPrompt}

NAVIGATION DATA:
${navigationData.map((nav: any) => `- ${nav.name}: ${nav.route}`).join('\n')}

${filterContext}

${userContextSection}

When users ask to navigate to a specific page, respond with a special format: [NAVIGATE:ROUTE] where ROUTE is the actual route from the navigation data above. The frontend will handle the navigation.

When users ask to filter, search, or find specific content, construct the appropriate URL with query parameters and use the format: [NAVIGATE:FULL_URL_WITH_PARAMS] where FULL_URL_WITH_PARAMS includes the base route and all relevant query parameters.`

    // Debug: Log all context pieces being sent to AI
    try {
      console.log('AI Debug — systemPrompt source:', clientConfig?.systemPrompt ? 'clientConfig.systemPrompt' : (!clientConfig ? 'db/default (no clientConfig)' : 'clientConfig present, using default'))
      console.log('AI Debug — navigationData count:', Array.isArray(navigationData) ? navigationData.length : 0)
      console.log('AI Debug — navigationData sample:', Array.isArray(navigationData) ? navigationData.slice(0, 5) : navigationData)
      console.log('AI Debug — current URL context:', { currentUrl: currentUrl || null, currentPath, currentParams: currentParams.toString() })
      console.log('AI Debug — userContext (final):', finalUserContext || null)
      console.log('AI Debug — aiMetadata (final):', finalUserContext?.aiMetadata || null)
      console.log('AI Debug — userContextSection (rendered):\n', userContextSection || '(none)')
      console.log('AI Debug — baseSystem (system message) — length:', baseSystem.length)
      console.log('AI Debug — baseSystem (system message) — preview first 800 chars:\n', baseSystem.slice(0, 800))
    } catch (e) {
      console.warn('AI Debug — failed to log debug context:', e)
    }

    const chatMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: baseSystem },
      ...messages.map((m: any) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
      { role: 'user', content: message },
    ]

    // Prepare and log payload (sanitized)
    const openAIBody = {
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: chatMessages,
      temperature: 0.7,
      top_p: 0.95,
      max_tokens: 1024,
    }

    try {
      console.log('AI Debug — messages payload count:', chatMessages.length)
      console.log('AI Debug — messages roles:', chatMessages.map(m => m.role))
      console.log('AI Debug — user message (last):', message)
      console.log('AI Debug — payload (sanitized):', { ...openAIBody, messages: chatMessages.map((m, idx) => ({ idx, role: m.role, contentPreview: (m.content || '').slice(0, 200), contentLength: (m.content || '').length })) })
    } catch (e) {
      console.warn('AI Debug — failed to log payload:', e)
    }

    // Streaming response from OpenAI
    const streamingBody = { ...openAIBody, stream: true }
    const openAIRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPEN_AI_KEY}`,
      },
      body: JSON.stringify(streamingBody),
    })

    if (!openAIRes.ok || !openAIRes.body) {
      const errText = await openAIRes.text().catch(() => '')
      throw new Error(`OpenAI API error: ${openAIRes.status} ${errText}`)
    }

    const encoder = new TextEncoder()
    const decoder = new TextDecoder()
    let fullText = ''

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          const reader = openAIRes.body!.getReader()
          let buffer = ''
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''
            for (const line of lines) {
              const trimmed = line.trim()
              if (!trimmed || !trimmed.startsWith('data:')) continue
              const data = trimmed.slice(5).trim()
              if (data === '[DONE]') {
                continue
              }
              try {
                if (!data.startsWith('{')) {
                  // Not JSON – skip keep-alives or vendor messages
                  continue
                }
                const json = JSON.parse(data)
                const delta = json?.choices?.[0]?.delta?.content
                if (delta) {
                  fullText += delta
                  controller.enqueue(encoder.encode(delta))
                }
              } catch {
                // ignore keep-alives
              }
            }
          }
          controller.close()
          // Background: log + analyze after stream ends
          if (session?.user?.id) {
            try {
              const recentInteraction = await prisma.userInteraction.findFirst({
                where: { userId: session.user.id, interactionType: 'CHAT_MESSAGE', content: message },
                orderBy: { timestamp: 'desc' }
              })
              if (recentInteraction) {
                await prisma.userInteraction.update({ where: { id: recentInteraction.id }, data: { response: fullText } })
              }

              const recentMessages = await prisma.userInteraction.count({
                where: { userId: session.user.id, interactionType: 'CHAT_MESSAGE', timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
              })
              if (recentMessages >= 5) {
                fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/user-context/analyze`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Cookie': request.headers.get('cookie') || '' },
                  body: JSON.stringify({ interactions: [{ type: 'CHAT_MESSAGE', content: message, response: fullText, timestamp: new Date().toISOString() }] })
                }).catch(() => {})

                // dynamic metadata extraction into aiMetadata only
                try {
                  const extraction = await extractStructuredUserContext(message, messages)
                  if (extraction) {
                    const existingMetaRecord = await prisma.userContext.findUnique({ where: { userId: session.user.id }, select: { aiMetadata: true } })
                    const existingAiMetadata = existingMetaRecord?.aiMetadata || {}
                    await prisma.userContext.upsert({
                      where: { userId: session.user.id },
                      update: { aiMetadata: { ...existingAiMetadata, ...(extraction.aiMetadata || {}) } },
                      create: { userId: session.user.id, aiMetadata: extraction.aiMetadata || {} }
                    })
                  }
                } catch {}
              }
            } catch (e) {
              console.warn('AI Debug — post-stream logging failed:', e)
            }
          }
        } catch (err) {
          controller.error(err)
        }
      }
    })

    return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  } catch (error) {
    console.error('Error in AI chat API:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}

// Extract structured user context and dynamic metadata from conversation using OpenAI
async function extractStructuredUserContext(latestMessage: string, history: Array<{ role: string; content: string }>) {
  try {
    const messagesPayload = [
      { role: 'system', content: 'You extract structured user context and arbitrary namespaced metadata from chat. Respond only with valid JSON matching the schema. If nothing found, return {}.' },
      { role: 'user', content: `
From the following conversation, extract any newly mentioned user/company context fields and any other relevant metadata.

Rigid Schema (only include if explicitly present):
{
  "company": { "name": string|null, "size": "startup"|"small"|"medium"|"enterprise"|null, "industry": string|null, "role": string|null, "department": string|null },
  "professional": { "experience": "beginner"|"intermediate"|"advanced"|"expert"|null, "primaryGoals": string[]|null, "currentProjects": string[]|null },
  "preferences": { "communicationStyle": "formal"|"casual"|"technical"|"brief"|null, "preferredContentType": string[]|null, "timezone": string|null, "workingHours": {"start": string, "end": string, "days": string[]}|null }
}

Dynamic Schema (aiMetadata): a JSON object with arbitrary key/value pairs inferred from chat. Use kebab-case namespaced keys like "company:budget", "project:deadline", "tools:favorite-seo-tool". Only include items reasonably grounded in the conversation.

Conversation (most recent last):
${history.map(h => `${h.role.toUpperCase()}: ${h.content}`).join('\n')}

Latest user message:
${latestMessage}
` }
    ]

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPEN_AI_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: messagesPayload,
      response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 700
      })
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`OpenAI extraction error: ${res.status} ${errText}`)
    }

    const json = await res.json()
    const content = json?.choices?.[0]?.message?.content
    if (!content) return null

  let parsed: any
  try {
    parsed = JSON.parse(content)
  } catch (e) {
    console.warn('AI Debug — extractor returned non-JSON, ignoring')
    return null
  }
    if (
      parsed && (
        parsed.company || parsed.professional || parsed.preferences || parsed.aiMetadata
      )
    ) {
      return parsed
    }
    return null
  } catch (e) {
    console.warn('AI Debug — extraction failed:', e)
    return null
  }
}
