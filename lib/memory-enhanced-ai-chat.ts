import { NextRequest, NextResponse } from 'next/server'
import { streamText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getUserContextWithMigration, createUnifiedUserContext } from '@/lib/user-context-migration'
import { processUserContext, getComprehensiveUserContext, extractMetadataFromMessage, refreshUserContextAfterUpdate } from '@/lib/ai-context-manager'
import { 
  storeConversationMemory, 
  generateMemoryContext, 
  findRelevantMemories 
} from './conversation-memory'

/**
 * Enhanced AI Chat with Per-User Memory System
 * This integrates the conversation memory system with the existing AI chat
 */
export async function enhancedAIChat(request: NextRequest) {
  try {
    const { message, messages, config: clientConfig, currentUrl, cartState, autoMessage } = await request.json()
    const isStream = request.nextUrl?.searchParams?.get('stream') === '1'
    
    console.log('🧠 Enhanced AI Chat with Memory - Processing message:', message.substring(0, 100))

    if (!process.env.OPEN_AI_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Get session for user context
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Helper: soft-timeout wrapper so we don't block first-token streaming
    const withTimeout = async <T>(promise: Promise<T>, ms: number): Promise<T | null> => {
      return await Promise.race([
        promise.then((v) => v as T).catch(() => null),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
      ])
    }

    // Get comprehensive user context (timeboxed)
    let finalUserContext: any = null
    try {
      const comprehensiveContext = await withTimeout(getComprehensiveUserContext(session.user.id), 200)
      if (comprehensiveContext) {
        finalUserContext = comprehensiveContext
      } else {
        // Create minimal context if timeout
        finalUserContext = {
          user: {
            id: session.user.id,
            name: session.user.name,
            email: session.user.email
          },
          profile: undefined,
          aiInsights: undefined,
          aiMetadata: {},
          recentInteractions: 0,
          lastInteraction: null
        }
      }
    } catch (error) {
      console.warn('Failed to fetch comprehensive user context:', error)
      finalUserContext = {
        user: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email
        },
        profile: undefined,
        aiInsights: undefined,
        aiMetadata: {},
        recentInteractions: 0,
        lastInteraction: null
      }
    }

    // 🧠 MEMORY ENHANCEMENT: Get conversation memory context
    let memoryContext = ''
    let relevantMemories: any[] = []
    
    try {
      const memoryResult = await withTimeout(
        generateMemoryContext(
          session.user.id,
          message,
          {
            maxContextLength: 2000,
            includeUserProfile: true,
            includeRecentHistory: true,
            includeSimilarConversations: true,
            sessionId: extractSessionId(currentUrl, messages)
          }
        ),
        300 // 300ms timeout for memory retrieval
      )
      
      if (memoryResult) {
        memoryContext = memoryResult.memoryContext
        relevantMemories = memoryResult.relevantMemories
        console.log(`🧠 Retrieved ${relevantMemories.length} relevant memories for user ${session.user.id}`)
      }
    } catch (error) {
      console.warn('Failed to retrieve conversation memory:', error)
    }

    // Get system prompt and navigation data
    let systemPrompt = clientConfig?.systemPrompt || `You are a helpful AI assistant for this application.

IMPORTANT: Keep responses concise and focused - aim for 3-4 lines maximum. Use markdown formatting to make your responses visually appealing and easy to read:
- **Bold text** for emphasis and important information
- *Italic text* for subtle emphasis
- \`inline code\` for technical terms, commands, or specific values
- # Headers for main topics and sections
- ## Subheaders for subtopics
- - Bullet points for lists
- > Blockquotes for important notes or tips
- Tables for structured data
- **Links** with [descriptive text](url) for external resources

## FILTER MANAGEMENT
**IMPORTANT: ONLY apply filters when explicitly requested by the user. DO NOT automatically apply filters based on previous user data, preferences, or assumptions.**

When users request filter changes, you MUST use the [FILTER: {...}] action tag to apply comprehensive filters. Available filter parameters:

**Search & Content:**
- q: Search query/website name
- niche: Content category (e.g., "technology", "health", "finance")
- language: Website language (e.g., "en", "es", "fr")
- country: Website country (e.g., "US", "UK", "CA")

**Pricing:**
- priceMin: Minimum price (number)
- priceMax: Maximum price (number)

**Domain Authority:**
- daMin: Minimum domain authority (0-100)
- daMax: Maximum domain authority (0-100)

**Page Authority:**
- paMin: Minimum page authority (0-100)
- paMax: Maximum page authority (0-100)

**Domain Rating:**
- drMin: Minimum domain rating (0-100)
- drMax: Maximum domain rating (0-100)

**Spam Score:**
- spamMin: Minimum spam score (0-100)
- spamMax: Maximum spam score (0-100)

**Traffic (Semrush Data):**
- semrushOverallTrafficMin: Minimum Semrush traffic
- semrushOrganicTrafficMin: Minimum Semrush organic traffic

**Link Attributes:**
- backlinkNature: Link type ("dofollow", "nofollow", "sponsored")
- linkPlacement: Placement ("header", "footer", "content", "sidebar")
- permanence: Permanence ("permanent", "temporary")

**Other:**
- availability: Boolean (true/false)
- remarkIncludes: Text to include in remarks
- lastPublishedAfter: Date (YYYY-MM-DD)
- outboundLinkLimitMax: Maximum outbound links
- disclaimerIncludes: Text to include in disclaimers
- trend: Trend direction ("up", "down", "stable")

**Example Filter Commands (ONLY apply when explicitly requested):**
- "Show me tech sites under $500" → [FILTER: {"niche": "technology", "priceMax": 500}]
- "Find high authority sites" → [FILTER: {"daMin": 70}]
- "Sites in English from US" → [FILTER: {"language": "en", "country": "US"}]
- "Dofollow links only" → [FILTER: {"backlinkNature": "dofollow"}]
- "Sites with high Semrush traffic" → [FILTER: {"semrushOverallTrafficMin": 1000000}]
- "Semrush organic traffic minimum 500k" → [FILTER: {"semrushOrganicTrafficMin": 500000}]
- "Apply filters based on my past data" → Only then use [FILTER: {...}] with historical data

**DO NOT automatically apply filters when users:**
- Ask general questions about sites or recommendations
- Share business information or preferences
- Request explanations or advice
- Mention their industry or needs without asking for filters

Be concise, direct, and helpful. Use markdown formatting to maximize impact in minimal space.`

    // 🧠 MEMORY ENHANCEMENT: Add memory context to system prompt
    if (memoryContext) {
      systemPrompt += `\n\n## CONVERSATION MEMORY CONTEXT\n${memoryContext}\n\nUse this context to provide more personalized and relevant responses. Reference previous conversations when helpful, but keep responses concise.`
    }

    let navigationData: any[] = Array.isArray(clientConfig?.navigationData) ? clientConfig.navigationData : []

    // Get config from DB if not supplied by client
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
        console.warn('Failed to fetch AI chatbot config from database:', error)
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
            priceMin: params.get('priceMin') || '',
            priceMax: params.get('priceMax') || '',
            daMin: params.get('daMin') || '',
            daMax: params.get('daMax') || '',
            sortBy: params.get('sortBy') || '',
            sortOrder: params.get('sortOrder') || ''
          }
        }
      } catch (error) {
        console.warn('Failed to parse current URL:', error)
      }
    }

    // Build enhanced system prompt with all context - ensure base context is preserved
    const enhancedSystemPrompt = `${systemPrompt}

## CRITICAL CONTEXT REMINDER
You are working in a PUBLISHERS/SITES MARKETPLACE platform. Users are looking for publisher websites for link building and content marketing. When they mention filters, pricing, TAT (turnaround time), or site criteria, they are referring to filtering publisher websites, not generic products or services.

${memoryContext}

## CURRENT CONTEXT
- **Current URL:** ${currentUrl || 'Not provided'}
- **Page Type:** ${isOnPublishersPage ? 'Publishers/Sites browsing' : 'Other'}
- **User Profile:** ${finalUserContext?.profile ? 'Available' : 'Not available'}
- **Recent Interactions:** ${finalUserContext?.recentInteractions || 0}
- **Cart State:** ${cartState?.totalItems || 0} items, $${cartState?.totalPrice || 0}

${isOnPublishersPage ? `## CURRENT FILTERS
${Object.entries(currentFilters).map(([key, value]) => `- **${key}:** ${value || 'None'}`).join('\n')}

## AVAILABLE FILTERS FOR PUBLISHERS
You can help users filter publishers by any of these criteria:

**Basic Info:**
- niche: technology, health, finance, business, lifestyle, travel, food, sports, education, entertainment, news, blog, ecommerce
- language: en, es, fr, de, it, pt (English, Spanish, French, German, Italian, Portuguese)
- country: US, UK, CA, AU, DE, FR, ES, IT, IN, JP, CN, BR, MX, RU, KR

**Authority & SEO:**
- daMin/daMax: Domain Authority (0-100)
- paMin/paMax: Page Authority (0-100) 
- drMin/drMax: Domain Rating (0-100)
- spamMin/spamMax: Spam Score (0-10, lower is better)
- tool: Semrush or Ahrefs

**Traffic & Performance:**
- semrushOverallTrafficMin: Minimum Semrush traffic
- semrushOrganicTrafficMin: Minimum Semrush organic traffic
- trend: increasing, stable, or decreasing

**Publishing Details:**
- priceMin/priceMax: Price range in dollars
- tatDaysMin/tatDaysMax: Turnaround time in days
- backlinkNature: dofollow, nofollow, or sponsored
- linkPlacement: in-content, author-bio, or footer
- permanence: lifetime or 12-months
- backlinksAllowedMin: Minimum backlinks allowed
- outboundLinkLimitMax: Maximum outbound links
- availability: true for available only

**Examples of natural language that should trigger filters:**
- "Show me tech sites with DA above 50" → daMin: 50, niche: technology
- "Find sites under $100 with dofollow links" → priceMax: 100, backlinkNature: dofollow
- "Show increasing traffic sites in English" → trend: increasing, language: en
- "Find health sites with low spam score" → niche: health, spamMax: 3
- "TAT min I want 6" → tatDaysMin: 6
- "Turnaround time maximum 10 days" → tatDaysMax: 10
- "I need sites with 5 day turnaround" → tatDaysMax: 5

**Clear/Reset Commands:**
When users say "clear filters", "reset filters", "remove all filters", or "no filters", use:
- [FILTER: RESET] - This will clear all filters and show all publishers

**IMPORTANT FILTER INSTRUCTIONS:**
When users request filter changes, ALWAYS use the [FILTER: ...] tag format. Examples:
- "change country to india" → [FILTER: country=IN]
- "show tech sites" → [FILTER: niche=technology]  
- "price under $100" → [FILTER: priceMax=100]
- "tat min i want 6" → [FILTER: tatDaysMin=6]
- "turnaround time 5 days" → [FILTER: tatDaysMax=5]
- "clear filters" → [FILTER: RESET]

**FILTER FORMAT:** Use URL parameter format: [FILTER: key1=value1&key2=value2]
Example: [FILTER: niche=technology&country=US&priceMax=500]` : ''}

## NAVIGATION OPTIONS
${navigationData.map(nav => `- **${nav.name}:** ${nav.description} (${nav.route})`).join('\n')}

## RESPONSE GUIDELINES
1. **Be Contextually Aware:** Use the current page, filters, and user history to provide relevant responses
2. **Be Actionable:** Provide specific actions users can take
3. **Be Concise:** Keep responses to 3-4 lines maximum
4. **Use Markdown:** Format responses for visual appeal
5. **Be Personal:** Reference previous conversations when relevant (from memory context)

## TOOL ACTIONS
Use these action tags to trigger UI interactions:
- [NAVIGATE: {"route": "/path", "description": "Navigate to..."}] - Navigate to a page
- [FILTER: "key1=value1&key2=value2"] - Apply search filters (URL parameter format)
- [ADD_TO_CART: {"item": {...}, "description": "Add to cart..."}] - Add item to cart
- [REMOVE_FROM_CART: {"itemId": "...", "description": "Remove from cart..."}] - Remove item from cart
- [VIEW_CART] - Show cart contents
- [CLEAR_CART] - Clear cart
- [CART_SUMMARY] - Show cart summary
- [PROCEED_TO_CHECKOUT] - Go to checkout
- [VIEW_ORDERS] - View user orders
- [RECOMMEND: {"type": "...", "description": "Recommend..."}] - Recommend items
- [SIMILAR_ITEMS: {"item": {...}, "description": "Find similar..."}] - Find similar items
- [BEST_DEALS] - Show best deals

Remember to use these tools when appropriate to enhance user experience.`

    // Build chat messages - include more conversation history for better context
    const recentMessages = messages.slice(-10) // Include last 10 messages for better context
    const chatMessages = [
      { role: 'system', content: enhancedSystemPrompt },
      ...recentMessages.map((m: any) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
      { role: 'user', content: message },
    ]

    if (isStream) {
      const openai = createOpenAI({ apiKey: process.env.OPEN_AI_KEY! })
      const result = await streamText({
        model: openai(process.env.OPENAI_MODEL || 'gpt-4o-mini'),
        messages: chatMessages,
        temperature: 0.7,
        maxTokens: 1024,
      })

      const encoder = new TextEncoder()
      const textStream = result.textStream
      let fullText = ''
      let detectionBuffer = ''

      // Tool patterns
      const actionPatterns: Array<{ pattern: RegExp; type: string }> = [
        { pattern: /\[\s*NAVIGATE\s*:\s*([\s\S]*?)\s*\]/g, type: 'navigate' },
        { pattern: /\[\s*FILTER\s*:\s*([\s\S]*?)\s*\]/g, type: 'filter' },
        { pattern: /\[\s*ADD_TO_CART\s*:\s*([\s\S]*?)\s*\]/g, type: 'addToCart' },
        { pattern: /\[\s*REMOVE_FROM_CART\s*:\s*([\s\S]*?)\s*\]/g, type: 'removeFromCart' },
        { pattern: /\[\s*VIEW_CART\s*\]/g, type: 'viewCart' },
        { pattern: /\[\s*CLEAR_CART\s*\]/g, type: 'clearCart' },
        { pattern: /\[\s*CART_SUMMARY\s*\]/g, type: 'cartSummary' },
        { pattern: /\[\s*PROCEED_TO_CHECKOUT\s*\]/g, type: 'proceedToCheckout' },
        { pattern: /\[\s*VIEW_ORDERS\s*\]/g, type: 'viewOrders' },
        { pattern: /\[\s*PAYMENT_SUCCESS\s*:\s*([\s\S]*?)\s*\]/g, type: 'paymentSuccess' },
        { pattern: /\[\s*PAYMENT_FAILED\s*:\s*([\s\S]*?)\s*\]/g, type: 'paymentFailed' },
        { pattern: /\[\s*ORDER_DETAILS\s*:\s*([\s\S]*?)\s*\]/g, type: 'orderDetails' },
        { pattern: /\[\s*RECOMMEND\s*:\s*([\s\S]*?)\s*\]/g, type: 'recommend' },
        { pattern: /\[\s*SIMILAR_ITEMS\s*:\s*([\s\S]*?)\s*\]/g, type: 'similarItems' },
        { pattern: /\[\s*BEST_DEALS\s*\]/g, type: 'bestDeals' }
      ]

      const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
          controller.enqueue(encoder.encode(' '))
          try {
            for await (const delta of textStream) {
              fullText += delta
              detectionBuffer += delta
              controller.enqueue(encoder.encode(delta))

              // Detect and emit tool events
              for (const { pattern, type } of actionPatterns) {
                let match: RegExpExecArray | null
                pattern.lastIndex = 0
                const matches: Array<{ full: string; json: string }> = []
                while ((match = pattern.exec(detectionBuffer)) !== null) {
                  const raw = match[1]
                  const data = typeof raw === 'string' ? raw.replace(/\n/g, '').trim() : true
                  const json = JSON.stringify({ type, data })
                  const event = `\n[[TOOL]]${json}\n`
                  controller.enqueue(encoder.encode(event))
                  matches.push({ full: match[0], json })
                }
                // Remove emitted matches from buffer
                for (const m of matches) {
                  detectionBuffer = detectionBuffer.replace(m.full, '')
                }
              }

              // Keep detection buffer from growing unbounded
              if (detectionBuffer.length > 2000) {
                detectionBuffer = detectionBuffer.slice(-2000)
              }
            }
          } catch (err) {
            console.error('Streaming error:', err)
            controller.error(err)
            return
          }
          
          // 🧠 MEMORY ENHANCEMENT: Store conversation memory after streaming completes
          try {
            await storeConversationMemory(
              session.user.id,
              message,
              fullText,
              {
                sessionId: extractSessionId(currentUrl, messages),
                context: {
                  url: currentUrl,
                  cartState,
                  pageContext: isOnPublishersPage ? 'Publishers page' : 'General chat',
                  userProfile: finalUserContext?.profile
                },
                importance: calculateMessageImportance(message, fullText, relevantMemories),
                extractedInsights: extractInsightsFromResponse(fullText),
                sentiment: extractSentiment(message),
                intent: extractIntent(message),
                topics: extractTopics(message, fullText)
              }
            )
            console.log(`🧠 Stored conversation memory for user ${session.user.id}`)
          } catch (error) {
            console.warn('Failed to store conversation memory:', error)
          }

          // Store in existing user_interactions table for backward compatibility
          try {
            await prisma.userInteraction.create({
              data: {
                userId: session.user.id,
                interactionType: 'CHAT_MESSAGE',
                content: message,
                response: fullText,
                context: {
                  currentUrl,
                  messageCount: messages?.length || 0,
                  userContext: finalUserContext?.profile ? {
                    company: finalUserContext.profile.company?.name,
                    role: finalUserContext.profile.company?.role,
                    experience: finalUserContext.profile.professional?.experience
                  } : null,
                  memoryContext: memoryContext ? 'Available' : 'Not available',
                  relevantMemoriesCount: relevantMemories.length
                }
              }
            }).catch(error => console.warn('Failed to log user interaction:', error))
          } catch (error) {
            console.warn('Failed to store user interaction:', error)
          }

          // Background context processing
          try {
            await processContextInBackground(
              session.user.id, 
              message, 
              fullText, 
              messages || [], 
              currentUrl, 
              finalUserContext
            )
          } catch (error) {
            console.warn('Background context processing failed:', error)
          }
        },
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    } else {
      // Non-streaming response (fallback)
      const openai = createOpenAI({ apiKey: process.env.OPEN_AI_KEY! })
      const result = await openai(process.env.OPENAI_MODEL || 'gpt-4o-mini').generateText({
        messages: chatMessages,
        temperature: 0.7,
        maxTokens: 1024,
      })

      const fullText = result.text || ''

      // 🧠 MEMORY ENHANCEMENT: Store conversation memory
      try {
        await storeConversationMemory(
          session.user.id,
          message,
          fullText,
          {
            sessionId: extractSessionId(currentUrl, messages),
            context: {
              url: currentUrl,
              cartState,
              pageContext: isOnPublishersPage ? 'Publishers page' : 'General chat',
              userProfile: finalUserContext?.profile
            },
            importance: calculateMessageImportance(message, fullText, relevantMemories),
            extractedInsights: extractInsightsFromResponse(fullText),
            sentiment: extractSentiment(message),
            intent: extractIntent(message),
            topics: extractTopics(message, fullText)
          }
        )
      } catch (error) {
        console.warn('Failed to store conversation memory:', error)
      }

      return NextResponse.json({ response: fullText })
    }

  } catch (error) {
    console.error('Enhanced AI Chat error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Helper functions for memory enhancement
 */

function extractSessionId(currentUrl: string, messages: any[]): string | undefined {
  // Extract session ID from URL or generate from message count
  if (currentUrl) {
    try {
      const url = new URL(currentUrl)
      const sessionParam = url.searchParams.get('session')
      if (sessionParam) return sessionParam
    } catch (error) {
      // Ignore URL parsing errors
    }
  }
  
  // Generate session ID based on message count (simple approach)
  if (messages && messages.length > 0) {
    return `session_${messages.length}_${Date.now()}`
  }
  
  return undefined
}

function calculateMessageImportance(message: string, response: string, relevantMemories: any[]): number {
  let importance = 0.5 // Base importance
  
  // Increase importance for longer messages
  if (message.length > 100) importance += 0.1
  if (message.length > 200) importance += 0.1
  
  // Increase importance for longer responses
  if (response.length > 200) importance += 0.1
  if (response.length > 500) importance += 0.1
  
  // Increase importance if similar memories exist (indicates recurring topic)
  if (relevantMemories.length > 0) importance += 0.2
  
  // Increase importance for questions
  if (message.includes('?') || message.toLowerCase().includes('how') || message.toLowerCase().includes('what')) {
    importance += 0.1
  }
  
  // Increase importance for action words
  const actionWords = ['buy', 'purchase', 'order', 'help', 'problem', 'issue', 'recommend']
  if (actionWords.some(word => message.toLowerCase().includes(word))) {
    importance += 0.1
  }
  
  return Math.min(importance, 1.0)
}

function extractInsightsFromResponse(response: string): any {
  const insights: any = {}
  
  // Extract mentioned prices
  const priceMatches = response.match(/\$[\d,]+/g)
  if (priceMatches) {
    insights.mentionedPrices = priceMatches
  }
  
  // Extract mentioned features
  const features = response.match(/\*\*([^*]+)\*\*/g)
  if (features) {
    insights.mentionedFeatures = features.map(f => f.replace(/\*\*/g, ''))
  }
  
  // Extract recommendations
  if (response.toLowerCase().includes('recommend')) {
    insights.hasRecommendations = true
  }
  
  return insights
}

function extractSentiment(message: string): string {
  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love', 'perfect', 'awesome']
  const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'problem', 'issue', 'wrong', 'broken']
  
  const messageLower = message.toLowerCase()
  
  const positiveCount = positiveWords.filter(word => messageLower.includes(word)).length
  const negativeCount = negativeWords.filter(word => messageLower.includes(word)).length
  
  if (positiveCount > negativeCount) return 'positive'
  if (negativeCount > positiveCount) return 'negative'
  return 'neutral'
}

function extractIntent(message: string): string {
  const messageLower = message.toLowerCase()
  
  if (messageLower.includes('buy') || messageLower.includes('purchase') || messageLower.includes('order')) {
    return 'purchase'
  }
  if (messageLower.includes('help') || messageLower.includes('how') || messageLower.includes('what')) {
    return 'help_request'
  }
  if (messageLower.includes('recommend') || messageLower.includes('suggest')) {
    return 'recommendation_request'
  }
  if (messageLower.includes('price') || messageLower.includes('cost')) {
    return 'pricing_inquiry'
  }
  if (messageLower.includes('filter') || messageLower.includes('search')) {
    return 'search_request'
  }
  
  return 'general_inquiry'
}

function extractTopics(message: string, response: string): string[] {
  const topics: string[] = []
  const text = (message + ' ' + response).toLowerCase()
  
  // SEO topics
  if (text.includes('seo') || text.includes('search engine')) topics.push('seo')
  if (text.includes('link building') || text.includes('backlink')) topics.push('link_building')
  if (text.includes('da') || text.includes('domain authority')) topics.push('domain_authority')
  if (text.includes('publisher') || text.includes('site')) topics.push('publishers')
  
  // General topics
  if (text.includes('cart') || text.includes('checkout')) topics.push('cart')
  if (text.includes('price') || text.includes('cost')) topics.push('pricing')
  if (text.includes('filter') || text.includes('search')) topics.push('search')
  if (text.includes('recommend') || text.includes('suggest')) topics.push('recommendations')
  
  return topics
}

// Import the background processing function (assuming it exists)
async function processContextInBackground(
  userId: string,
  message: string,
  response: string,
  messages: any[],
  currentUrl: string,
  userContext: any
): Promise<void> {
  // This would call the existing background processing function
  // Implementation depends on your existing ai-context-manager
  console.log('Background context processing completed')
}
