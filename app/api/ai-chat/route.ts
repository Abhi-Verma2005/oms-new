import { NextRequest, NextResponse } from 'next/server'
import { createOpenAI } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Modern RAG Helper Functions
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const apiKey = process.env.OPEN_AI_KEY || process.env.OPENAI_API_KEY!
    
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
      }),
    })
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }
    
    const data = await response.json()
    return data.data[0].embedding
  } catch (error) {
    console.error('Failed to generate embedding:', error)
    // Return mock embedding as fallback
    return Array.from({ length: 1536 }, () => Math.random() * 2 - 1)
  }
}

// Modern RAG: Optimized Query Rewriting with timeout
async function rewriteQuery(originalQuery: string): Promise<string[]> {
  try {
    // Skip query rewriting for very short queries to avoid unnecessary processing
    if (originalQuery.length < 10) {
      return [originalQuery]
    }
    
    const apiKey = process.env.OPEN_AI_KEY || process.env.OPENAI_API_KEY!
    
    // Add timeout to prevent hanging
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Generate 1-2 alternative queries for better search. Keep them concise and focused. Return one per line.`
          },
          {
            role: 'user',
            content: originalQuery
          }
        ],
        temperature: 0.3,
        max_tokens: 100
      }),
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      console.warn('Query rewriting failed, using original query')
      return [originalQuery] // Fallback to original
    }
    
    const data = await response.json()
    const rewrittenQueries = data.choices[0].message.content
      .split('\n')
      .map((q: string) => q.trim())
      .filter((q: string) => q.length > 0 && q !== originalQuery)
      .slice(0, 2) // Limit to 2 additional queries
    
    return [originalQuery, ...rewrittenQueries]
  } catch (error) {
    console.warn('Query rewriting failed, using original query:', error)
    return [originalQuery] // Fallback to original
  }
}

// Modern RAG: Optimized Hybrid Search (Semantic + Keyword)
async function hybridSearch(userId: string, queries: string[], message: string): Promise<any[]> {
  try {
    console.log(`🔍 Hybrid search for ${queries.length} queries...`)
    
    // Limit queries to prevent excessive processing
    const limitedQueries = queries.slice(0, 2) // Only use first 2 queries
    const results: any[] = []
    
    // Generate embedding once for the main query (most important)
    const mainQuery = limitedQueries[0] || message
    let queryEmbedding: number[]
    
    try {
      queryEmbedding = await generateEmbedding(mainQuery)
    } catch (error) {
      console.error('Embedding generation failed, using fallback:', error)
      queryEmbedding = Array.from({ length: 1536 }, () => Math.random() * 2 - 1)
    }
    
    // Single optimized query combining semantic and keyword search
    const searchResults = await prisma.$queryRaw`
      WITH combined_search AS (
        SELECT 
          id,
          content,
          metadata,
          content_type,
          created_at,
          access_count,
          importance_score,
          COALESCE(1 - (embedding <=> ${`[${queryEmbedding.join(',')}]`}::vector(1536)), 0.0) AS semantic_similarity,
          CASE 
            WHEN LOWER(content) LIKE LOWER(${'%' + mainQuery + '%'}) THEN 0.9
            WHEN LOWER(content) LIKE LOWER(${'%' + message + '%'}) THEN 0.8
            ELSE 0.0
          END AS keyword_similarity,
          CASE 
            WHEN LOWER(content) LIKE LOWER(${'%' + mainQuery + '%'}) THEN 0.95
            WHEN (1 - (embedding <=> ${`[${queryEmbedding.join(',')}]`}::vector(1536))) > 0.4 THEN 0.9
            WHEN (1 - (embedding <=> ${`[${queryEmbedding.join(',')}]`}::vector(1536))) > 0.3 THEN 0.8
            WHEN LOWER(content) LIKE LOWER(${'%' + message + '%'}) THEN 0.7
            ELSE 0.0
          END AS confidence_score
        FROM user_knowledge_base
        WHERE user_id = ${userId}
          AND (
            embedding IS NOT NULL AND (1 - (embedding <=> ${`[${queryEmbedding.join(',')}]`}::vector(1536))) > 0.2
            OR LOWER(content) LIKE LOWER(${'%' + mainQuery + '%'})
            OR LOWER(content) LIKE LOWER(${'%' + message + '%'})
          )
      )
      SELECT 
        id,
        content,
        metadata,
        content_type,
        created_at,
        access_count,
        importance_score,
        GREATEST(semantic_similarity, keyword_similarity) AS similarity,
        'hybrid' as search_type,
        confidence_score
      FROM combined_search
      WHERE confidence_score > 0.0
      ORDER BY confidence_score DESC, similarity DESC
      LIMIT 10
    ` as any[]
    
    console.log(`✅ Found ${searchResults.length} results from hybrid search`)
    return searchResults
    
  } catch (error) {
    console.error('Hybrid search failed:', error)
    // Return empty results instead of failing
    return []
  }
}

// Modern RAG: Re-ranking with ML-based scoring
async function rerankResults(results: any[], query: string): Promise<any[]> {
  if (results.length === 0) return results
  
  try {
    // Calculate advanced relevance scores
    const rerankedResults = results.map(result => {
      let relevanceScore = 0
      
      // 1. Similarity score (0-1)
      const similarityScore = result.similarity || 0
      relevanceScore += similarityScore * 0.4
      
      // 2. Confidence score (0-1)
      const confidenceScore = result.confidence_score || 0
      relevanceScore += confidenceScore * 0.3
      
      // 3. Recency score (0-1)
      const daysSinceCreated = (Date.now() - new Date(result.created_at).getTime()) / (1000 * 60 * 60 * 24)
      const recencyScore = Math.max(0, 1 - (daysSinceCreated / 30)) // Decay over 30 days
      relevanceScore += recencyScore * 0.2
      
      // 4. Content type priority
      const typeScore = result.content_type === 'user_fact' ? 0.1 : 0.05
      relevanceScore += typeScore
      
      // 5. Access count (popularity)
      const accessScore = Math.min(0.1, (result.access_count || 0) * 0.01)
      relevanceScore += accessScore
      
      return {
        ...result,
        relevanceScore: Math.min(1, relevanceScore)
      }
    })
    
    // Sort by relevance score
    return rerankedResults
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 6) // Limit to top 6 results
      
  } catch (error) {
    console.error('Re-ranking failed:', error)
    return results.slice(0, 6) // Fallback to original order
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, messages, config: clientConfig, currentUrl, cartState, userId: requestUserId } = await request.json()
    const isStream = request.nextUrl?.searchParams?.get('stream') === '1'
    
    console.log(`🚀 RAG-Integrated AI Chat (${isStream ? 'stream' : 'non-stream'}): message="${message.substring(0, 50)}..."`)
    
    if (!process.env.OPEN_AI_KEY && !process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Auth-only RAG: require authenticated user and existing account
    const session = await getServerSession(authOptions)
    const userId = requestUserId || session?.user?.id
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    const existingUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }
    const canPersist = true
    console.log(`👤 Using userId: ${userId} | persist=${canPersist}`)

    if (isStream) {
      return await handleStreamingRequest(userId, message, messages, clientConfig, cartState, currentUrl, canPersist)
    } else {
      return await handleNonStreamingRequest(userId, message, messages, clientConfig, cartState, currentUrl, canPersist)
    }
  } catch (error) {
    console.error('Error in RAG-integrated AI chat API:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}

/**
 * 🚀 Streaming RAG request
 */
async function handleStreamingRequest(
  userId: string,
  message: string,
  messages: any[],
  clientConfig: any,
  cartState: any,
  currentUrl: string,
  canPersist: boolean
) {
  try {
    console.log('🔍 Starting RAG-enhanced streaming request...')
    const t0Total = Date.now()
    
    // Check semantic cache first
    const queryHash = Buffer.from(message).toString('base64').slice(0, 64)
    let queryEmbedding: number[]
    try {
      queryEmbedding = await generateEmbedding(message)
    } catch {
      queryEmbedding = Array.from({ length: 1536 }, () => Math.random() * 2 - 1)
    }
    
    // Check for semantically similar cached responses
    const similarCachedResponse = await prisma.$queryRaw`
      SELECT 
        id,
        cached_response,
        COALESCE(1 - (query_embedding <=> ${`[${queryEmbedding.join(',')}]`}::vector(1536)), 0.0) AS similarity
      FROM semantic_cache
      WHERE user_id = ${userId}
        AND expires_at > NOW()
        AND (1 - (query_embedding <=> ${`[${queryEmbedding.join(',')}]`}::vector(1536))) > 0.85
      ORDER BY similarity DESC
      LIMIT 1
    `
    
    if (similarCachedResponse.length > 0 && similarCachedResponse[0].similarity > 0.9) {
      console.log(`🎯 Semantic cache hit! Similarity: ${similarCachedResponse[0].similarity.toFixed(3)}`)
      
      // Update cache hit count
      await prisma.semanticCache.update({
        where: { id: similarCachedResponse[0].id },
        data: { 
          hitCount: { increment: 1 },
          lastHit: new Date()
        }
      })
      
      const cachedData = similarCachedResponse[0].cached_response
      let message = ''
      
      if (cachedData?.message) {
        message = cachedData.message
      } else if (cachedData?.answer) {
        message = cachedData.answer
      } else {
        message = 'I apologize, but I encountered an issue with the cached response. Please try again.'
      }
      
      // Return cached response as stream
      const stream = new ReadableStream({
        start(controller) {
          const chunks = message.split(' ')
          let index = 0
          
          const pushChunk = () => {
            if (index < chunks.length) {
              controller.enqueue(new TextEncoder().encode(chunks[index] + ' '))
              index++
              setTimeout(pushChunk, 50) // Simulate streaming
            } else {
              controller.close()
            }
          }
          
          pushChunk()
        }
      })
      
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
        },
      })
    }
    
    console.log('🔍 Modern RAG: Performing hybrid retrieval...')
    const t0Retrieval = Date.now()
    
    // Get RAG context with timeout
    let searchResults: any[] = []
    try {
      const ragProcessingPromise = (async () => {
        const rewrittenQueries = await rewriteQuery(message)
        const hybridResults = await hybridSearch(userId, rewrittenQueries, message)
        return await rerankResults(hybridResults, message)
      })()
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('RAG processing timeout')), 10000) // 10 second timeout
      })
      
      searchResults = await Promise.race([ragProcessingPromise, timeoutPromise]) as any[]
    } catch (error) {
      console.warn('RAG processing failed or timed out, continuing without context:', error)
      searchResults = []
    }
    
    const ragMs = Date.now() - t0Retrieval
    console.log(`✅ Retrieved ${searchResults.length} relevant documents in ${ragMs}ms`)
    
    // Build context
    const hasRelevantContext = searchResults.length > 0 && (
      searchResults.some((r: any) => (r.confidence_score || 0) > 0.7) || 
      searchResults.some((r: any) => (r.similarity || 0) > 0.4)
    )
    
    const ragContext = hasRelevantContext
      ? `\n\nRELEVANT KNOWLEDGE BASE CONTEXT:\n${searchResults.map(r => `- ${r.content}`).join('\n')}`
      : ''
    
    const baseSystemPrompt = hasRelevantContext 
      ? `You are an AI assistant for a PUBLISHERS/SITES MARKETPLACE platform. Your primary role is to help users find and filter publisher websites for link building and content marketing.

## CRITICAL CONTEXT
You are working within a publishers marketplace where users can:
- Browse and filter publisher websites by various criteria (niche, authority, traffic, pricing, etc.)
- Add publisher sites to their cart for purchasing publishing opportunities
- Filter sites by technical metrics like Domain Authority, Page Authority, traffic, pricing, turnaround time (TAT), etc.

When users mention filters, pricing, TAT (turnaround time), or site criteria, they are referring to filtering publisher websites, not generic products or services.

## CRITICAL FILTER INSTRUCTIONS
When users request filter changes, you MUST use the [FILTER:...] tool tag. Do not give generic responses about not having access - you have full filtering capabilities through the tool system.

Examples of when to use [FILTER:...]:
- "Filter websites with price between 500-2000" → [FILTER:priceMin=500&priceMax=2000]
- "Find tech sites with high DA" → [FILTER:niche=technology&daMin=50]
- "Show me sites under $1000" → [FILTER:priceMax=1000]
- "Filter by country and language" → [FILTER:country=US&language=en]
- "TAT min I want 6" → [FILTER:tatDaysMin=6]
- "Clear filters" → [FILTER:RESET]

Available filters: q, niche, language, country, priceMin/priceMax, daMin/daMax, paMin/paMax, drMin/drMax, spamMin/spamMax, availability, tool, backlinkNature, linkPlacement, permanence, remarkIncludes, lastPublishedAfter, outboundLinkLimitMax, disclaimerIncludes, trend, tatDaysMin/tatDaysMax

ALWAYS use tool tags for filtering requests. Never say you don't have access to filtering.

## AVAILABLE TOOLS & ACTIONS
1. FILTERING & DISCOVERY:
   - [FILTER:param=value] - Apply specific filters to publishers/products
   - [NAVIGATE:/publishers?filters] - Navigate with pre-applied filters

2. CART MANAGEMENT:
   - [ADD_TO_CART:itemId] - Add specific item to cart
   - [REMOVE_FROM_CART:itemId] - Remove item from cart
   - [VIEW_CART] - Show current cart contents
   - [CLEAR_CART] - Clear all items from cart
   - [CART_SUMMARY] - Get detailed cart summary with pricing

3. CHECKOUT & PAYMENT:
   - [PROCEED_TO_CHECKOUT] - Navigate to checkout page
   - [VIEW_ORDERS] - Navigate to orders page

4. SMART RECOMMENDATIONS:
   - [RECOMMEND:criteria] - Suggest items based on criteria
   - [SIMILAR_ITEMS:itemId] - Find similar items
   - [BEST_DEALS] - Show current best deals

## INTELLIGENT FLOW ORCHESTRATION
When a tool action is applicable (e.g., filtering or navigation), OUTPUT THE TOOL TAG FIRST on its own line before any natural language. This allows the UI to apply the action immediately. Then provide a short confirmation line.

CONVERSATION FLOW EXAMPLES:
Example 1 - Complete Purchase Flow:
User: "I need high DA sites for tech content"
AI: "I'll find high Domain Authority sites perfect for tech content! Let me filter those for you."
[FILTER:daMin=50&niche=technology]
"Great! I found 15 high-quality tech sites with DA 50+. Would you like me to add the best matches to your cart?"

Example 2 - Direct Filtering:
User: "Filter websites with minimum price of 500 dollars and maximum budget of 2000 dollars"
AI: "I'll filter the websites to show those between $500-$2000 for you."
[FILTER:priceMin=500&priceMax=2000]
"Perfect! I've applied the price filter. You should now see websites in your specified budget range."

Example 3 - TAT Filtering:
User: "I want min tat days to be 6"
AI: "I'll set the minimum turnaround time to 6 days for you."
[FILTER:tatDaysMin=6]
"Done! I've filtered the sites to show only those with a minimum turnaround time of 6 days."

${ragContext}

Use the knowledge base context above to provide accurate and personalized responses about publisher websites and filtering.`
      : `You are an AI assistant for a PUBLISHERS/SITES MARKETPLACE platform. Your primary role is to help users find and filter publisher websites for link building and content marketing.

## CRITICAL CONTEXT
You are working within a publishers marketplace where users can:
- Browse and filter publisher websites by various criteria (niche, authority, traffic, pricing, etc.)
- Add publisher sites to their cart for purchasing publishing opportunities
- Filter sites by technical metrics like Domain Authority, Page Authority, traffic, pricing, turnaround time (TAT), etc.

When users mention filters, pricing, TAT (turnaround time), or site criteria, they are referring to filtering publisher websites, not generic products or services.

## CRITICAL FILTER INSTRUCTIONS
When users request filter changes, you MUST use the [FILTER:...] tool tag. Do not give generic responses about not having access - you have full filtering capabilities through the tool system.

Examples of when to use [FILTER:...]:
- "Filter websites with price between 500-2000" → [FILTER:priceMin=500&priceMax=2000]
- "Find tech sites with high DA" → [FILTER:niche=technology&daMin=50]
- "Show me sites under $1000" → [FILTER:priceMax=1000]
- "Filter by country and language" → [FILTER:country=US&language=en]
- "TAT min I want 6" → [FILTER:tatDaysMin=6]
- "Clear filters" → [FILTER:RESET]

Available filters: q, niche, language, country, priceMin/priceMax, daMin/daMax, paMin/paMax, drMin/drMax, spamMin/spamMax, availability, tool, backlinkNature, linkPlacement, permanence, remarkIncludes, lastPublishedAfter, outboundLinkLimitMax, disclaimerIncludes, trend, tatDaysMin/tatDaysMax

ALWAYS use tool tags for filtering requests. Never say you don't have access to filtering.

## AVAILABLE TOOLS & ACTIONS
1. FILTERING & DISCOVERY:
   - [FILTER:param=value] - Apply specific filters to publishers/products
   - [NAVIGATE:/publishers?filters] - Navigate with pre-applied filters

2. CART MANAGEMENT:
   - [ADD_TO_CART:itemId] - Add specific item to cart
   - [REMOVE_FROM_CART:itemId] - Remove item from cart
   - [VIEW_CART] - Show current cart contents
   - [CLEAR_CART] - Clear all items from cart
   - [CART_SUMMARY] - Get detailed cart summary with pricing

3. CHECKOUT & PAYMENT:
   - [PROCEED_TO_CHECKOUT] - Navigate to checkout page
   - [VIEW_ORDERS] - Navigate to orders page

4. SMART RECOMMENDATIONS:
   - [RECOMMEND:criteria] - Suggest items based on criteria
   - [SIMILAR_ITEMS:itemId] - Find similar items
   - [BEST_DEALS] - Show current best deals

## INTELLIGENT FLOW ORCHESTRATION
When a tool action is applicable (e.g., filtering or navigation), OUTPUT THE TOOL TAG FIRST on its own line before any natural language. This allows the UI to apply the action immediately. Then provide a short confirmation line.

CONVERSATION FLOW EXAMPLES:
Example 1 - Complete Purchase Flow:
User: "I need high DA sites for tech content"
AI: "I'll find high Domain Authority sites perfect for tech content! Let me filter those for you."
[FILTER:daMin=50&niche=technology]
"Great! I found 15 high-quality tech sites with DA 50+. Would you like me to add the best matches to your cart?"

Example 2 - Direct Filtering:
User: "Filter websites with minimum price of 500 dollars and maximum budget of 2000 dollars"
AI: "I'll filter the websites to show those between $500-$2000 for you."
[FILTER:priceMin=500&priceMax=2000]
"Perfect! I've applied the price filter. You should now see websites in your specified budget range."

Example 3 - TAT Filtering:
User: "I want min tat days to be 6"
AI: "I'll set the minimum turnaround time to 6 days for you."
[FILTER:tatDaysMin=6]
"Done! I've filtered the sites to show only those with a minimum turnaround time of 6 days."

Be helpful and provide useful responses about publisher websites and filtering. If the user shares personal information, acknowledge it and remember it for future conversations.`
    
    // Create OpenAI client for streaming
    const openai = createOpenAI({ apiKey: process.env.OPEN_AI_KEY || process.env.OPENAI_API_KEY! })
    
      // Build messages array - include more conversation history for better context
      const chatMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        { role: 'system', content: baseSystemPrompt },
        ...(messages || []).slice(-10).map((m: any) => ({ 
          role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant', 
          content: m.content 
        })),
        { role: 'user' as const, content: message }
      ]
      
      // 🔍 DEBUG: Log final context being sent to AI
      console.log('🤖 FINAL AI CONTEXT:', JSON.stringify(chatMessages, null, 2))
      
      // Create streaming response using OpenAI API directly
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPEN_AI_KEY || process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: chatMessages,
        temperature: 0.7,
        max_tokens: 1000,
        stream: true
      })
    })
    
    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error('OpenAI API error:', openaiResponse.status, errorText)
      throw new Error(`OpenAI API error: ${openaiResponse.status}`)
    }
    
    console.log('✅ OpenAI streaming response started')
    
    // Store interaction in background (non-blocking)
    setImmediate(() => {
      if (userId !== 'anonymous' && canPersist) {
        // Store the interaction for future RAG
        try {
          generateEmbedding(message).then(embedding => {
            prisma.userKnowledgeBase.create({
              data: {
                userId: userId,
                content: message,
                contentType: 'user_fact',
                embedding: `[${embedding.join(',')}]`,
                metadata: {
                  source: 'user_conversation',
                  timestamp: new Date().toISOString(),
                  hasRelevantContext: hasRelevantContext,
                  contextCount: searchResults.length
                },
                topics: [],
                importance: 1.0
              }
            }).catch(error => console.warn('Background storage failed:', error))
          }).catch(error => console.warn('Background embedding failed:', error))
        } catch (error) {
          console.warn('Background storage setup failed:', error)
        }
      }
    })
    
    // Return the streaming response
    return new Response(openaiResponse.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
    
  } catch (error) {
    console.error('Error in RAG streaming request:', error)
    
    // Fallback: Return a simple error message as stream
    const errorStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('I apologize, but I encountered an error processing your request. Please try again.'))
        controller.close()
      }
    })
    
    return new Response(errorStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    })
  }
}

/**
 * 📝 Non-streaming RAG request
 */
async function handleNonStreamingRequest(
  userId: string,
  message: string,
  messages: any[],
  clientConfig: any,
  cartState: any,
  currentUrl: string,
  canPersist: boolean
) {
  try {
    console.log('🔍 Starting RAG-enhanced non-streaming request...')
    const t0Total = Date.now()
    
    // Respect persistence flag; never auto-create
    const validUserId = userId
    
    // Modern RAG: Enhanced Semantic Caching with Query Similarity
    console.log('🔍 Modern RAG: Checking semantic cache...')
    const queryHash = Buffer.from(message).toString('base64').slice(0, 64)
    let queryEmbedding: number[]
    try {
      queryEmbedding = await generateEmbedding(message)
    } catch {
      queryEmbedding = Array.from({ length: 1536 }, () => Math.random() * 2 - 1)
    }
    
    // Check for semantically similar cached responses
    const similarCachedResponse = await prisma.$queryRaw`
      SELECT 
        id,
        cached_response,
        COALESCE(1 - (query_embedding <=> ${`[${queryEmbedding.join(',')}]`}::vector(1536)), 0.0) AS similarity
      FROM semantic_cache
      WHERE user_id = ${validUserId}
        AND expires_at > NOW()
        AND (1 - (query_embedding <=> ${`[${queryEmbedding.join(',')}]`}::vector(1536))) > 0.85
      ORDER BY similarity DESC
      LIMIT 1
    `
    
    if (similarCachedResponse.length > 0 && similarCachedResponse[0].similarity > 0.9) {
      console.log(`🎯 Semantic cache hit! Similarity: ${similarCachedResponse[0].similarity.toFixed(3)}`)
      
      // Update cache hit count
      await prisma.semanticCache.update({
        where: { id: similarCachedResponse[0].id },
        data: { 
          hitCount: { increment: 1 },
          lastHit: new Date()
        }
      })
      
      const cachedData = similarCachedResponse[0].cached_response
      console.log(`🔍 [API] Cached response data:`, {
        hasMessage: !!cachedData?.message,
        messageLength: cachedData?.message?.length || 0,
        messagePreview: cachedData?.message?.substring(0, 100) || 'NO MESSAGE',
        fullCachedData: cachedData
      })
      
      // Handle different cache response formats
      let message = ''
      let sources = []
      let ragContext = ''
      let hasRelevantContext = false
      let confidence = 0
      let contextCount = 0
      
      if (cachedData) {
        // Check if it's the new format with direct message field
        if (cachedData.message) {
          message = cachedData.message
          sources = cachedData.sources || []
          ragContext = cachedData.ragContext || ''
          hasRelevantContext = cachedData.hasRelevantContext || false
          confidence = cachedData.confidence || 0
          contextCount = cachedData.contextCount || 0
        }
        // Check if it's the old format with answer field
        else if (cachedData.answer) {
          message = cachedData.answer
          sources = cachedData.sources || []
          ragContext = cachedData.ragContext || ''
          hasRelevantContext = cachedData.hasRelevantContext || false
          confidence = cachedData.confidence || 0
          contextCount = cachedData.contextCount || 0
        }
        // Fallback for any other format
        else {
          message = 'I apologize, but I encountered an issue with the cached response format.'
        }
      }
      
      // Final safety check
      if (!message || message.trim() === '') {
        message = 'I apologize, but I encountered an issue with the cached response. Please try again.'
      }
      
      return NextResponse.json({
        message: message,
        sources: sources,
        ragContext: ragContext,
        hasRelevantContext: hasRelevantContext,
        confidence: confidence,
        cacheHit: true,
        contextCount: contextCount,
        timings: { ragMs: 0, rerankMs: 0, llmMs: 0, totalMs: 0 }
      })
    }
    
    console.log('🔍 Modern RAG: Performing hybrid retrieval...')

    const t0Retrieval = Date.now()
    
    // Add timeout wrapper for RAG processing
    const ragProcessingPromise = (async () => {
      // Modern RAG: Query Rewriting + Hybrid Search + Re-ranking
      console.log('🔄 Modern RAG: Query rewriting...')
      const rewrittenQueries = await rewriteQuery(message)
      console.log(`✅ Generated ${rewrittenQueries.length} query variations`)
      
      console.log('🔍 Modern RAG: Hybrid search (semantic + keyword)...')
      const hybridResults = await hybridSearch(validUserId, rewrittenQueries, message)
      console.log(`✅ Hybrid search found ${hybridResults.length} results`)
      
      console.log('📊 Modern RAG: Re-ranking results...')
      const searchResults = await rerankResults(hybridResults, message)
      console.log(`✅ Re-ranked to ${searchResults.length} final results`)
      
      return searchResults
    })()
    
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('RAG processing timeout')), 15000) // 15 second timeout
    })
    
    let searchResults: any[] = []
    try {
      searchResults = await Promise.race([ragProcessingPromise, timeoutPromise]) as any[]
    } catch (error) {
      console.warn('RAG processing failed or timed out, continuing without context:', error)
      searchResults = []
    }
    
    const ragMs = Date.now() - t0Retrieval
    console.log(`✅ Retrieved ${searchResults.length} relevant documents in ${ragMs}ms`)

    // Fast similarity-based ranking (no LLM reranking for performance)
    const t0Rerank = Date.now()
    const reranked = searchResults.sort((a, b) => {
      // Sort by confidence score first, then by similarity
      const aConf = a.confidence_score || 0
      const bConf = b.confidence_score || 0
      if (aConf !== bConf) return bConf - aConf
      return (b.similarity || 0) - (a.similarity || 0)
    })
    const rerankMs = Date.now() - t0Rerank
    console.log(`🧮 Sort time: ${rerankMs}ms`)

    // Check if we have sufficient relevant context with improved logic
    const hasRelevantContext = reranked.length > 0 && (
      reranked.some((r: any) => (r.confidence_score || 0) > 0.7) || 
      reranked.some((r: any) => (r.similarity || 0) > 0.4)
    )
    
    const ragContext = hasRelevantContext
      ? `\n\nRELEVANT KNOWLEDGE BASE CONTEXT:\n${reranked.map(r => `- ${r.content}`).join('\n')}`
      : ''

    const sources = reranked.map(r => r.metadata?.source || 'Knowledge Base').filter((v, i, a) => a.indexOf(v) === i)

    const baseSystemPrompt = hasRelevantContext 
      ? `You are an AI assistant for a PUBLISHERS/SITES MARKETPLACE platform. Your primary role is to help users find and filter publisher websites for link building and content marketing.

## CRITICAL CONTEXT
You are working within a publishers marketplace where users can:
- Browse and filter publisher websites by various criteria (niche, authority, traffic, pricing, etc.)
- Add publisher sites to their cart for purchasing publishing opportunities
- Filter sites by technical metrics like Domain Authority, Page Authority, traffic, pricing, turnaround time (TAT), etc.

When users mention filters, pricing, TAT (turnaround time), or site criteria, they are referring to filtering publisher websites, not generic products or services.

${ragContext}

Use the knowledge base context above to provide accurate and personalized responses about publisher websites and filtering.`
      : `You are an AI assistant for a PUBLISHERS/SITES MARKETPLACE platform. Your primary role is to help users find and filter publisher websites for link building and content marketing.

## CRITICAL CONTEXT
You are working within a publishers marketplace where users can:
- Browse and filter publisher websites by various criteria (niche, authority, traffic, pricing, etc.)
- Add publisher sites to their cart for purchasing publishing opportunities
- Filter sites by technical metrics like Domain Authority, Page Authority, traffic, pricing, turnaround time (TAT), etc.

When users mention filters, pricing, TAT (turnaround time), or site criteria, they are referring to filtering publisher websites, not generic products or services.

## CRITICAL FILTER INSTRUCTIONS
When users request filter changes, you MUST use the [FILTER:...] tool tag. Do not give generic responses about not having access - you have full filtering capabilities through the tool system.

Examples of when to use [FILTER:...]:
- "Filter websites with price between 500-2000" → [FILTER:priceMin=500&priceMax=2000]
- "Find tech sites with high DA" → [FILTER:niche=technology&daMin=50]
- "Show me sites under $1000" → [FILTER:priceMax=1000]
- "Filter by country and language" → [FILTER:country=US&language=en]
- "TAT min I want 6" → [FILTER:tatDaysMin=6]
- "Clear filters" → [FILTER:RESET]

Available filters: q, niche, language, country, priceMin/priceMax, daMin/daMax, paMin/paMax, drMin/drMax, spamMin/spamMax, availability, tool, backlinkNature, linkPlacement, permanence, remarkIncludes, lastPublishedAfter, outboundLinkLimitMax, disclaimerIncludes, trend, tatDaysMin/tatDaysMax

ALWAYS use tool tags for filtering requests. Never say you don't have access to filtering.

## AVAILABLE TOOLS & ACTIONS
1. FILTERING & DISCOVERY:
   - [FILTER:param=value] - Apply specific filters to publishers/products
   - [NAVIGATE:/publishers?filters] - Navigate with pre-applied filters

2. CART MANAGEMENT:
   - [ADD_TO_CART:itemId] - Add specific item to cart
   - [REMOVE_FROM_CART:itemId] - Remove item from cart
   - [VIEW_CART] - Show current cart contents
   - [CLEAR_CART] - Clear all items from cart
   - [CART_SUMMARY] - Get detailed cart summary with pricing

3. CHECKOUT & PAYMENT:
   - [PROCEED_TO_CHECKOUT] - Navigate to checkout page
   - [VIEW_ORDERS] - Navigate to orders page

4. SMART RECOMMENDATIONS:
   - [RECOMMEND:criteria] - Suggest items based on criteria
   - [SIMILAR_ITEMS:itemId] - Find similar items
   - [BEST_DEALS] - Show current best deals

## INTELLIGENT FLOW ORCHESTRATION
When a tool action is applicable (e.g., filtering or navigation), OUTPUT THE TOOL TAG FIRST on its own line before any natural language. This allows the UI to apply the action immediately. Then provide a short confirmation line.

CONVERSATION FLOW EXAMPLES:
Example 1 - Complete Purchase Flow:
User: "I need high DA sites for tech content"
AI: "I'll find high Domain Authority sites perfect for tech content! Let me filter those for you."
[FILTER:daMin=50&niche=technology]
"Great! I found 15 high-quality tech sites with DA 50+. Would you like me to add the best matches to your cart?"

Example 2 - Direct Filtering:
User: "Filter websites with minimum price of 500 dollars and maximum budget of 2000 dollars"
AI: "I'll filter the websites to show those between $500-$2000 for you."
[FILTER:priceMin=500&priceMax=2000]
"Perfect! I've applied the price filter. You should now see websites in your specified budget range."

Example 3 - TAT Filtering:
User: "I want min tat days to be 6"
AI: "I'll set the minimum turnaround time to 6 days for you."
[FILTER:tatDaysMin=6]
"Done! I've filtered the sites to show only those with a minimum turnaround time of 6 days."

Be helpful and provide useful responses about publisher websites and filtering. If the user shares personal information, acknowledge it and remember it for future conversations.`

    // Always call the LLM, with or without context
    console.log(`🤖 Calling LLM with ${hasRelevantContext ? 'context' : 'no context'}...`)

    // Non-streaming completion request
    const t0LLM = Date.now()
    const nonStreamingMessages = [
      { role: 'system', content: baseSystemPrompt },
      ...messages.slice(-10),
      { role: 'user', content: message }
    ]
    
    // 🔍 DEBUG: Log final context being sent to AI
    console.log('🤖 FINAL AI CONTEXT (non-streaming):', JSON.stringify(nonStreamingMessages, null, 2))
    
    const completionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPEN_AI_KEY || process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0,
        max_tokens: 256,
        messages: nonStreamingMessages
      })
    })
    if (!completionResponse.ok) {
      const errText = await completionResponse.text().catch(() => 'Failed to call OpenAI')
      throw new Error(`OpenAI error: ${completionResponse.status} ${errText}`)
    }
    const completionJson = await completionResponse.json()
    const fullResponse: string = completionJson?.choices?.[0]?.message?.content || ''
    const llmMs = Date.now() - t0LLM
    const totalMs = Date.now() - t0Total
    console.log(`🤖 LLM time: ${llmMs}ms | ⏱️ Total time: ${totalMs}ms`)
    console.log(`🔍 [API] OpenAI response:`, {
      hasChoices: !!completionJson?.choices,
      choicesLength: completionJson?.choices?.length || 0,
      hasMessage: !!completionJson?.choices?.[0]?.message,
      hasContent: !!completionJson?.choices?.[0]?.message?.content,
      contentLength: completionJson?.choices?.[0]?.message?.content?.length || 0,
      contentPreview: completionJson?.choices?.[0]?.message?.content?.substring(0, 100) || 'NO CONTENT',
      fullResponse: fullResponse
    })

    // Cache the response only if allowed to persist
    const responseData = {
      message: fullResponse, // Use 'message' field for consistency
      answer: fullResponse,  // Keep 'answer' for backward compatibility
      sources: sources,
      confidence: 0.85,
      context: reranked.map(r => ({ content: r.content, score: r.similarity }))
    }

    if (canPersist) {
      const queryHash = require('crypto').createHash('sha256').update(message).digest('hex')
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
      await prisma.$executeRaw`
        INSERT INTO semantic_cache (user_id, query_hash, query_embedding, cached_response, expires_at)
        VALUES (${validUserId}, ${queryHash}, ${`[${queryEmbedding.join(',')}]`}::vector(1536), ${JSON.stringify(responseData)}::jsonb, ${expiresAt})
        ON CONFLICT (user_id, query_hash) 
        DO UPDATE SET 
          cached_response = EXCLUDED.cached_response,
          expires_at = EXCLUDED.expires_at,
          hit_count = 0,
          last_hit = NULL
      `
    }

    const payload = {
      message: fullResponse,
      sources: sources,
      confidence: hasRelevantContext ? 0.85 : 0.3,
      cacheHit: false,
      contextCount: searchResults.length,
      hasRelevantContext,
      timings: { ragMs, rerankMs, llmMs, totalMs }
    }
    
    console.log(`🔍 [API] Final payload:`, {
      messageLength: payload.message?.length || 0,
      messagePreview: payload.message?.substring(0, 100) || 'NO MESSAGE',
      sourcesCount: payload.sources?.length || 0,
      hasRelevantContext: payload.hasRelevantContext,
      contextCount: payload.contextCount
    })
    // Modern RAG: Self-Correcting Knowledge Base Storage (with timeout)
    try {
      console.log('💾 Modern RAG: Storing conversation with self-correction...')
      
      // Generate embedding for the user's message with timeout
      const embeddingPromise = generateEmbedding(message)
      const embeddingTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Embedding generation timeout')), 5000)
      })
      
      const messageEmbedding = await Promise.race([embeddingPromise, embeddingTimeout]) as number[]
      
      // Check for similar existing entries to avoid duplicates
      const existingSimilar = await prisma.$queryRaw`
        SELECT id, content, similarity
        FROM (
          SELECT 
            id,
            content,
            COALESCE(1 - (embedding <=> ${`[${messageEmbedding.join(',')}]`}::vector(1536)), 0.0) AS similarity
          FROM user_knowledge_base
          WHERE user_id = ${validUserId}
            AND embedding IS NOT NULL
        ) ranked
        WHERE similarity > 0.8
        ORDER BY similarity DESC
        LIMIT 1
      `
      
      if (existingSimilar.length > 0 && existingSimilar[0].similarity > 0.9) {
        console.log('🔄 Self-correction: Updating existing similar entry')
        // Update existing entry instead of creating duplicate
        await prisma.$executeRaw`
          UPDATE user_knowledge_base 
          SET 
            content = ${message},
            embedding = ${`[${messageEmbedding.join(',')}]`}::vector(1536),
            updated_at = NOW(),
            access_count = access_count + 1,
            importance_score = GREATEST(importance_score, 1.0)
          WHERE id = ${existingSimilar[0].id}
        `
      } else {
        // Store new user message as a fact
        await prisma.$executeRaw`
          INSERT INTO user_knowledge_base (
            user_id, 
            content, 
            content_type, 
            embedding, 
            metadata, 
            topics,
            sentiment,
            intent,
            created_at,
            updated_at,
            last_accessed,
            access_count,
            importance_score
          )
          VALUES (
            ${validUserId},
            ${message},
            'user_fact',
            ${`[${messageEmbedding.join(',')}]`}::vector(1536),
            ${JSON.stringify({
              source: 'user_conversation',
              timestamp: new Date().toISOString(),
              sessionId: 'current_session',
              hasRelevantContext: hasRelevantContext,
              contextCount: searchResults.length
            })}::jsonb,
            ARRAY[]::text[],
            NULL,
            NULL,
            NOW(),
            NOW(),
            NOW(),
            0,
            1.0
          )
        `
      }
      
      console.log('✅ Stored/updated user message in knowledge base')
    } catch (storageError) {
      console.error('⚠️ Failed to store in knowledge base:', storageError)
      // Don't fail the request if storage fails
    }
    
    // Modern RAG: Store response in semantic cache
    try {
      console.log('💾 Modern RAG: Storing response in semantic cache...')
      await prisma.semanticCache.create({
        data: {
          userId: validUserId,
          queryHash,
          queryEmbedding: `[${queryEmbedding.join(',')}]`,
          cachedResponse: {
            message: payload.message,
            answer: payload.message, // Keep for backward compatibility
            sources: payload.sources,
            ragContext: ragContext,
            hasRelevantContext: payload.hasRelevantContext,
            confidence: payload.confidence,
            contextCount: payload.contextCount
          },
          contextData: {
            searchResults: searchResults.length,
            rewrittenQueries: 0, // Not available in this scope
            timings: { ragMs, rerankMs, llmMs, totalMs }
          },
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          hitCount: 0
        }
      })
      console.log('✅ Stored response in semantic cache')
    } catch (cacheError) {
      console.error('⚠️ Failed to store in semantic cache:', cacheError)
      // Don't fail the request if cache storage fails
    }

    // Final safety check - ensure we always have a message
    if (!payload.message || payload.message.trim() === '') {
      console.warn('⚠️ [API] Empty message in payload, using fallback')
      payload.message = 'I apologize, but I encountered an issue generating a response. Please try again.'
    }
    
    try {
      console.log('📦 Response meta:', {
        messagePreview: (payload.message || '').slice(0, 80),
        sources: payload.sources,
        timings: payload.timings,
      })
    } catch {}
    return NextResponse.json(payload)

  } catch (error) {
    console.error('Error in RAG non-streaming request:', error)
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error')
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    // Fallback: Return a simple response even if RAG fails
    try {
      const fallbackResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPEN_AI_KEY || process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          temperature: 0.7,
          max_tokens: 200,
          messages: [
            { role: 'system', content: 'You are a helpful AI assistant.' },
            { role: 'user', content: message }
          ]
        })
      })
      
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json()
        const fallbackMessage = fallbackData?.choices?.[0]?.message?.content || 'I apologize, but I encountered an error processing your request.'
        
        return NextResponse.json({
          message: fallbackMessage,
          sources: [],
          confidence: 0.3,
          cacheHit: false,
          contextCount: 0,
          hasRelevantContext: false,
          timings: { ragMs: 0, rerankMs: 0, llmMs: 0, totalMs: 0 },
          fallback: true
        })
      }
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError)
    }
    
    return NextResponse.json(
      { error: 'Failed to process message', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
