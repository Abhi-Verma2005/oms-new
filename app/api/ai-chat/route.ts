import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { message, messages, config: clientConfig, currentUrl } = await request.json()

    if (!process.env.OPEN_AI_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
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

    const fullSystemPrompt = baseSystem + publishersContext

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

    return NextResponse.json({ response: text })
  } catch (error) {
    console.error('Error in AI chat API:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}
