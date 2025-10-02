import { NextRequest, NextResponse } from 'next/server'
import { streamText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getUserContextWithMigration, createUnifiedUserContext } from '@/lib/user-context-migration'
import { processUserContext, getComprehensiveUserContext, extractMetadataFromMessage, refreshUserContextAfterUpdate } from '@/lib/ai-context-manager'

export async function POST(request: NextRequest) {
  try {
    const { message, messages, config: clientConfig, currentUrl, cartState, autoMessage } = await request.json()
    const isStream = request.nextUrl?.searchParams?.get('stream') === '1'
    
    // Debug cart state received from client
    console.log('🛒 DEBUG: Received cart state in AI API:', {
      cartState: cartState,
      cartStateType: typeof cartState,
      cartStateKeys: cartState ? Object.keys(cartState) : 'null',
      cartItems: cartState?.items,
      cartItemsLength: cartState?.items?.length,
      totalItems: cartState?.totalItems,
      totalPrice: cartState?.totalPrice,
      cartStateStringified: JSON.stringify(cartState, null, 2)
    })

    if (!process.env.OPEN_AI_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Get session for user context
    const session = await getServerSession(authOptions)

    // Helper: soft-timeout wrapper so we don't block first-token streaming
    const withTimeout = async <T>(promise: Promise<T>, ms: number): Promise<T | null> => {
      return await Promise.race([
        promise.then((v) => v as T).catch(() => null),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
      ])
    }

    // Get comprehensive user context (timeboxed) so we can start streaming quickly
    let finalUserContext: any = null
    if (session?.user?.id) {
      try {
        const comprehensiveContext = await withTimeout(getComprehensiveUserContext(session.user.id), 200)
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
        console.warn('Failed to fetch comprehensive user context (database may be unavailable):', error)
        // Create a minimal user context when database is unavailable
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
    }

    // Prefer config supplied by client (preloaded on app startup) to avoid DB hits
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

Be concise, direct, and helpful. Use markdown formatting to maximize impact in minimal space.

EXAMPLES OF CONCISE MARKDOWN USAGE:
- Product details: "## Product: **Site Name** - \`$99\` *High DA site*"
- Features: "**Key features:** *Fast delivery*, \`24/7 support\`"
- Instructions: "1. **Select** your site 2. **Add** to cart 3. **Checkout**"
- Success: "# ✅ Success! Order \`#123\` confirmed"
- Help: "> **Need help?** I'm here to assist!"`

    let navigationData: any[] = Array.isArray(clientConfig?.navigationData) ? clientConfig.navigationData : []

    // If not supplied by client, fall back to DB (with error handling)
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
        console.warn('Failed to fetch AI chatbot config from database (database may be unavailable), using defaults:', error)
        // Use default system prompt and navigation data when database is unavailable
        systemPrompt = `You are a helpful AI assistant for this application.

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

Be concise, direct, and helpful. Use markdown formatting to maximize impact in minimal space.`
        navigationData = []
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

When users ask to navigate to a specific page, respond with a special format: [NAVIGATE:ROUTE] where ROUTE is the actual route from the navigation data above. The frontend will handle the navigation.

CRITICAL: When users ask to filter, search, or find items with specific criteria (price, niche, quality metrics, etc.), you MUST use the [FILTER:...] tool tag. Do not give generic responses about not having access - you have full filtering capabilities through the tool system.

Examples of when to use [FILTER:...]:
- "Filter websites with price between 500-2000" → [FILTER:priceMin=500&priceMax=2000]
- "Find tech sites with high DA" → [FILTER:niche=technology&daMin=50]
- "Show me sites under $1000" → [FILTER:priceMax=1000]
- "Filter by country and language" → [FILTER:country=US&language=english]

ALWAYS use tool tags for filtering requests. Never say you don't have access to filtering.`

    // Add comprehensive e-commerce flow context
    const ecommerceFlowContext = `

SMART E-COMMERCE FLOW CONTEXT:
You are an intelligent AI assistant that can guide users through the complete e-commerce journey from discovery to purchase completion. You have access to advanced tools and can orchestrate the entire flow seamlessly.

RESPONSE FORMATTING:
Keep responses concise (3-4 lines max) and use markdown formatting to make them visually appealing and professional:
- Use **bold text** for important information, prices, and key features
- Use *italic text* for subtle emphasis and product descriptions
- Use \`inline code\` for technical terms, product IDs, and specific values
- Use # Headers for main sections like "Product Details" or "Order Summary"
- Use ## Subheaders for subsections like "Features" or "Pricing"
- Use bullet points (-) for lists of features, benefits, or steps
- Use > blockquotes for important notes, warnings, or special offers
- Use tables for comparing products or showing order details
- Use **links** with [descriptive text](url) for external resources

Be direct and helpful - maximize impact in minimal space.

AVAILABLE TOOLS & ACTIONS:

1. FILTERING & DISCOVERY:
   - [FILTER:param=value] - Apply specific filters to publishers/products
   - [NAVIGATE:/publishers?filters] - Navigate with pre-applied filters
   - [SEARCH:query] - Perform intelligent search across the platform

2. CART MANAGEMENT:
   - [ADD_TO_CART:itemId] - Add specific item to cart
   - [REMOVE_FROM_CART:itemId] - Remove item from cart
   - [VIEW_CART] - Show current cart contents
   - [CLEAR_CART] - Clear all items from cart
   - [CART_SUMMARY] - Get detailed cart summary with pricing

3. CHECKOUT & PAYMENT:
   - [PROCEED_TO_CHECKOUT] - Navigate to checkout page
   - [PAYMENT_STATUS:orderId] - Check payment status
   - [PAYMENT_SUCCESS:orderId] - Confirm successful payment
   - [PAYMENT_FAILED:reason] - Handle payment failure

4. ORDER MANAGEMENT:
   - [VIEW_ORDERS] - Navigate to orders page
   - [ORDER_DETAILS:orderId] - Get specific order details
   - [TRACK_ORDER:orderId] - Track order status

5. SMART RECOMMENDATIONS:
   - [RECOMMEND:criteria] - Suggest items based on criteria
   - [SIMILAR_ITEMS:itemId] - Find similar items
   - [BEST_DEALS] - Show current best deals

INTELLIGENT FLOW ORCHESTRATION:

PRIORITY OF ACTIONS:
When a tool action is applicable (e.g., filtering or navigation), OUTPUT THE TOOL TAG FIRST on its own line before any natural language. This allows the UI to apply the action immediately. Then provide a short confirmation line.

When users express interest in items or ask about purchasing:

1. FILTERING PHASE:
   - Understand their requirements (price, niche, quality metrics)
   - Apply appropriate filters using [FILTER:...] commands
   - Show them relevant results with explanations

2. CART ENGAGEMENT PHASE:
   - After showing filtered results, proactively suggest adding items to cart
   - Use friendly, encouraging language: "I found some great options for you! Would you like me to add the best matches to your cart?"
   - Show cart summary with [CART_SUMMARY] before proceeding

3. CHECKOUT GUIDANCE PHASE:
   - Once items are in cart, guide them to checkout: "Perfect! I've added those to your cart. Ready to proceed to checkout?"
   - Use [PROCEED_TO_CHECKOUT] to navigate to payment page
   - Provide reassurance about the payment process

4. PAYMENT CONFIRMATION PHASE:
   - After payment completion, automatically send confirmation message
   - Use [PAYMENT_SUCCESS:orderId] to show success message
   - Navigate to orders page with [VIEW_ORDERS]
   - Provide next steps and support information

5. POST-PURCHASE SUPPORT:
   - Check order status with [ORDER_DETAILS:orderId]
   - Offer additional recommendations
   - Provide customer support guidance

CONVERSATION FLOW EXAMPLES:

Example 1 - Complete Purchase Flow:
User: "I need high DA sites for tech content"
AI: "I'll find high Domain Authority sites perfect for tech content! Let me filter those for you."
[FILTER:daMin=50&niche=technology]
"Great! I found 15 high-quality tech sites with DA 50+. The top options are [list]. Would you like me to add the best matches to your cart?"
[ADD_TO_CART:site1,site2,site3]
"Perfect! I've added 3 excellent tech sites to your cart. Ready to proceed to checkout?"
[PROCEED_TO_CHECKOUT]
[After payment] "🎉 Payment successful! Your order has been confirmed. Let me show you your orders."
[VIEW_ORDERS]

Example 2 - Cart Management:
User: "What's in my cart?"
AI: [CART_SUMMARY]
"Your cart has 2 items totaling $1,200. Would you like to proceed to checkout or add more items?"

Example 3 - Order Tracking:
User: "Where's my order?"
AI: [VIEW_ORDERS]
"I can see your recent orders. Let me get the details for your latest order."
[ORDER_DETAILS:orderId]

Example 4 - Direct Filtering:
User: "Filter websites with minimum price of 500 dollars and maximum budget of 2000 dollars"
AI: "I'll filter the websites to show those between $500-$2000 for you."
[FILTER:priceMin=500&priceMax=2000]
"Perfect! I've applied the price filter. You should now see websites in your specified budget range."

SMART PROMPTING STRATEGY:
- Always be proactive in suggesting next steps
- Use encouraging and helpful language
- Provide clear value propositions
- Handle objections gracefully
- Guide users through the complete journey
- Celebrate successful purchases
- Offer additional value after purchase

CURRENT CONTEXT:
${isOnPublishersPage ? `You are on the publishers page with these current filters:
${Object.entries(currentFilters).filter(([_, v]) => v !== undefined && v !== '' && v !== null).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

Available filters: q, niche, language, country, priceMin/priceMax, daMin/daMax, paMin/paMax, drMin/drMax, spamMin/spamMax, availability, tool, backlinkNature, linkPlacement, permanence, remarkIncludes, lastPublishedAfter, outboundLinkLimitMax, disclaimerIncludes, trend` : 'You can help users discover, filter, and purchase items from anywhere on the platform.'}

CURRENT CART STATE:
${cartState ? `
- Total Items: ${cartState.totalItems || 0}
- Total Price: $${(cartState.totalPrice || 0).toFixed(2)}
- Items in Cart: ${cartState.items?.length || 0}
${cartState.items && cartState.items.length > 0 ? `
Cart Contents:
${cartState.items.map((item: any, index: number) => `  ${index + 1}. ${item.kind === 'site' ? item.site?.name : item.product?.name} - $${item.kind === 'site' ? (item.site?.publishing?.price || 0) : (item.product?.priceDollars || 0)} x${item.quantity || 1}`).join('\n')}` : 'Cart is empty'}
` : 'Cart state not available'}

Remember: Your goal is to create a smooth, intelligent shopping experience that guides users from discovery to purchase completion with minimal friction.`

    // Skip payment success DB checks on the critical path; this will be handled in background later
    let paymentSuccessNotification = ''

    // Handle automatic payment success message
    if (autoMessage && message.includes('payment successfully') && message.includes('show me my orders')) {
      // Force a payment success notification for automatic messages
      if (session?.user?.id) {
        try {
          const recentPayment = await prisma.order.findFirst({
            where: {
              userId: session.user.id,
              status: 'PAID',
              createdAt: {
                gte: new Date(Date.now() - 10 * 60 * 1000) // Last 10 minutes for auto messages
              }
            },
            orderBy: { createdAt: 'desc' },
            include: { items: true }
          })

          if (recentPayment) {
            const itemNames = recentPayment.items.map(item => item.siteName).join(', ')
            paymentSuccessNotification = `

# 🎉 CONGRATULATIONS! PAYMENT SUCCESSFUL! 🎉

## Order Details
- **Order ID:** \`${recentPayment.id}\`
- **Amount:** **$${(recentPayment.totalAmount / 100).toFixed(2)}**
- **Items:** ${itemNames}
- **Status:** ✅ Payment completed successfully

---

Fantastic! Your payment has been processed successfully. I can see your order details above. 

You're now on your **orders page** where you can view all your purchases. Your new order should appear in the list below.

### Next Steps
1. **View your order details** - See complete order information
2. **Track your order status** - Monitor delivery progress
3. **Download receipts** - Get your purchase documentation

> **💡 Need help?** I'm here to assist with any questions about your order or other inquiries!

Use [VIEW_ORDERS] to show detailed order information.`
          }
        } catch (error) {
          console.warn('Failed to check for recent payment success for auto message:', error)
        }
      }
    }

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

    const fullSystemPrompt = baseSystem + ecommerceFlowContext + userContextSection + paymentSuccessNotification

    const chatMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: fullSystemPrompt },
      ...messages.map((m: any) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
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
      // Buffer for detecting tool tags reliably across chunk boundaries
      let detectionBuffer = ''

      // Tool patterns (tolerant to whitespace/newlines)
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

              // Detect and emit tool events as soon as tags are complete in buffer
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
                // Remove emitted matches from buffer to avoid duplicate emissions
                for (const m of matches) {
                  detectionBuffer = detectionBuffer.replace(m.full, '')
                }
              }

              // Keep detection buffer from growing unbounded. Keep last 2k chars
              if (detectionBuffer.length > 2000) {
                detectionBuffer = detectionBuffer.slice(-2000)
              }
            }
          } catch (err) {
            console.error('Streaming error:', err)
            controller.error(err)
            return
          }
          // After stream ends, perform logging and background processing
          try {
            if (session?.user?.id) {
              prisma.userInteraction.create({
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
                    } : null
                  }
                }
              }).catch(error => console.warn('Failed to log user interaction (database may be unavailable):', error))

              processContextInBackground(session.user.id, message, fullText, messages || [], currentUrl, finalUserContext).catch(error => 
                console.warn('Background context processing failed (database may be unavailable):', error)
              )
            }
          } finally {
            controller.close()
          }
        }
      })

      return new NextResponse(stream as any, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          'X-Accel-Buffering': 'no',
          'Connection': 'keep-alive',
          'Content-Encoding': 'identity'
        }
      })
    } else {
      // Non-streaming branch (existing behavior)
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
        }).catch(error => console.warn('Failed to log user interaction (database may be unavailable):', error))

        processContextInBackground(session.user.id, message, text, messages || [], currentUrl, finalUserContext).catch(error => 
          console.warn('Background context processing failed (database may be unavailable):', error)
        )
      }

      return NextResponse.json({ 
        response: text,
        cartState: cartState
      })
    }
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

