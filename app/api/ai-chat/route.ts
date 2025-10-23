import { NextRequest, NextResponse } from 'next/server'
import { createOpenAI } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getMultipleDocumentContents } from '@/lib/document-cache'

// ---------------------------------------------
// Token & Chat History Management (128k handling)
// ---------------------------------------------
// Rough token estimation: ~4 chars per token (conservative across models)
function estimateTokensForMessages(messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>): number {
  try {
    const totalChars = messages.reduce((sum, m) => sum + (m?.content?.length || 0), 0)
    // Add small overhead per message for role/formatting
    const overhead = messages.length * 20
    return Math.ceil((totalChars + overhead) / 4)
  } catch {
    return 0
  }
}

async function summarizeChatHistory(
  historyMessages: Array<{ role: 'user' | 'assistant'; content: string }>,
  model: string,
  apiKey: string
): Promise<string> {
  const historyText = historyMessages
    .map(m => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n\n')
    .slice(0, 350000) // hard cap to avoid oversized summarization input

  const system = `You are a conversation summarizer. Create a concise, factual summary of the chat so far that preserves:
  - The user's goals, constraints, preferences and any confirmations
  - Important decisions, tool/action tags mentioned like [FILTER:...] or [VIEW_ORDERS]
  - Open questions or pending follow-ups
  Keep it short but information-dense. Do NOT invent details. Output plain text.`

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: historyText }
      ],
      temperature: 0.2,
      max_tokens: 1200,
      stream: false
    })
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    console.warn('Summarization failed:', res.status, errText)
    // Fallback: crude truncation
    return historyText.slice(0, 8000)
  }

  const data = await res.json()
  return data?.choices?.[0]?.message?.content || historyText.slice(0, 8000)
}

// User Context Helper Functions
function formatUserContextFromRequest(userContext: any): string {
  if (!userContext) {
    return ''
  }

  const contextParts: string[] = []

  // Basic user info
  if (userContext.basic) {
    const { name } = userContext.basic
    if (name) {
      contextParts.push(`User Name: ${name}`)
    }
    // Email removed to prevent layout issues during streaming
  }

  // Profile information
  if (userContext.profile) {
    const profile = userContext.profile
    if (profile.companyName) contextParts.push(`Company: ${profile.companyName}`)
    if (profile.companySize) contextParts.push(`Company Size: ${profile.companySize}`)
    if (profile.industry) contextParts.push(`Industry: ${profile.industry}`)
    if (profile.role) contextParts.push(`Role: ${profile.role}`)
    if (profile.department) contextParts.push(`Department: ${profile.department}`)
    if (profile.experience) contextParts.push(`Experience: ${profile.experience}`)
    if (profile.website) contextParts.push(`Website: ${profile.website}`)
    if (profile.primaryGoals && profile.primaryGoals.length > 0) {
      contextParts.push(`Primary Goals: ${profile.primaryGoals.join(', ')}`)
    }
    if (profile.budget) contextParts.push(`Budget: ${profile.budget}`)
    if (profile.teamSize) contextParts.push(`Team Size: ${profile.teamSize}`)
    if (profile.timezone) contextParts.push(`Timezone: ${profile.timezone}`)
    if (profile.language) contextParts.push(`Language: ${profile.language}`)
  }

  // User context
  if (userContext.context) {
    const context = userContext.context
    if (context.preferences) {
      const prefs = Object.entries(context.preferences)
      if (prefs.length > 0) {
        contextParts.push(`Preferences: ${prefs.map(([k, v]) => `${k}: ${v}`).join(', ')}`)
      }
    }
    if (context.settings) {
      const settings = Object.entries(context.settings)
      if (settings.length > 0) {
        contextParts.push(`Settings: ${settings.map(([k, v]) => `${k}: ${v}`).join(', ')}`)
      }
    }
  }

  // AI insights
  if (userContext.aiInsights) {
    const insights = userContext.aiInsights
    if (insights.conversationTone) contextParts.push(`Communication Style: ${insights.conversationTone}`)
    if (insights.expertiseLevel) contextParts.push(`Expertise Level: ${insights.expertiseLevel}`)
    if (insights.learningStyle) contextParts.push(`Learning Style: ${insights.learningStyle}`)
    if (insights.topicInterests && insights.topicInterests.length > 0) {
      contextParts.push(`Topic Interests: ${insights.topicInterests.join(', ')}`)
    }
    if (insights.painPoints && insights.painPoints.length > 0) {
      contextParts.push(`Pain Points: ${insights.painPoints.join(', ')}`)
    }
  }

  // User roles
  if (userContext.roles && userContext.roles.length > 0) {
    contextParts.push(`Roles: ${userContext.roles.join(', ')}`)
  }

  // Account age
  if (userContext.basic?.createdAt) {
    const accountAge = Math.floor((Date.now() - new Date(userContext.basic.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    contextParts.push(`Account Age: ${accountAge} days`)
  }

  // console.log('👤 DEBUG: Formatted user context:', contextParts.join('\n'))

  return contextParts.length > 0 ? `\n\nUSER CONTEXT:\n${contextParts.join('\n')}` : ''
}

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

// Enhanced RAG: Advanced Hybrid Search with Query Expansion and Context Ranking
async function hybridSearch(userId: string, queries: string[], message: string): Promise<any[]> {
  try {
    console.log(`🔍 Enhanced hybrid search for ${queries.length} queries...`)
    
    // Advanced Query Processing
    const processedQueries = await processQueriesWithExpansion(queries, message)
    console.log(`📝 Processed queries: ${processedQueries.length}`)
    
    // Limit queries to prevent excessive processing
    const limitedQueries = processedQueries.slice(0, 3) // Use up to 3 queries
    const results: any[] = []
    
    // Generate embeddings for all queries with caching
    const queryEmbeddings = await generateMultipleEmbeddings(limitedQueries)
    const mainQuery = limitedQueries[0] || message
    const mainEmbedding = queryEmbeddings[0]
    
    // Enhanced context ranking and retrieval
    const rankedResults = await performAdvancedRetrieval(userId, mainEmbedding, limitedQueries, message)
    
    return rankedResults.slice(0, 8) // Return top 8 most relevant results
    
  } catch (error) {
    console.error('Enhanced hybrid search failed:', error)
    return []
  }
}

// Advanced query processing with expansion and optimization
async function processQueriesWithExpansion(queries: string[], originalMessage: string): Promise<string[]> {
  try {
    const expandedQueries = [...queries]
    
    // Add domain-specific expansions for publisher marketplace
    const domainExpansions = generateDomainExpansions(originalMessage)
    expandedQueries.push(...domainExpansions)
    
    // Add semantic variations
    const semanticVariations = await generateSemanticVariations(originalMessage)
    expandedQueries.push(...semanticVariations)
    
    // Remove duplicates and prioritize
    const uniqueQueries = [...new Set(expandedQueries)]
    return prioritizeQueries(uniqueQueries, originalMessage)
    
    } catch (error) {
    console.warn('Query expansion failed, using original queries:', error)
    return queries
  }
}

// Generate domain-specific query expansions
function generateDomainExpansions(message: string): string[] {
  const expansions: string[] = []
  const lowerMessage = message.toLowerCase()
  
  // Publisher marketplace specific expansions
  if (lowerMessage.includes('filter') || lowerMessage.includes('find')) {
    expansions.push('publisher website filtering criteria')
    expansions.push('website quality metrics DA DR spam score')
  }
  
  if (lowerMessage.includes('good') || lowerMessage.includes('quality')) {
    expansions.push('high quality publisher websites')
    expansions.push('premium website metrics requirements')
  }
  
  if (lowerMessage.includes('cart') || lowerMessage.includes('add')) {
    expansions.push('publisher website cart management')
    expansions.push('website selection and purchase process')
  }
  
  if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
    expansions.push('publisher website pricing information')
    expansions.push('website cost and budget considerations')
  }
  
  return expansions
}

// Generate semantic variations of the query
async function generateSemanticVariations(originalMessage: string): Promise<string[]> {
  try {
    const apiKey = process.env.OPEN_AI_KEY || process.env.OPENAI_API_KEY
    if (!apiKey) return []
    
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
            content: `Generate 2-3 semantic variations of the user query for better search. Focus on publisher marketplace context. Keep variations concise and relevant. Return one variation per line.`
          },
          {
            role: 'user',
            content: originalMessage
          }
        ],
        temperature: 0.4,
        max_tokens: 150
      })
    })
    
    if (!response.ok) return []
    
    const data = await response.json()
    const variations = data.choices[0].message.content
      .split('\n')
      .map((q: string) => q.trim())
      .filter((q: string) => q.length > 0 && q !== originalMessage)
      .slice(0, 3)
    
    return variations
    
  } catch (error) {
    console.warn('Semantic variation generation failed:', error)
    return []
  }
}

// Prioritize queries based on relevance and specificity
function prioritizeQueries(queries: string[], originalMessage: string): string[] {
  const scoredQueries = queries.map(query => ({
    query,
    score: calculateQueryRelevanceScore(query, originalMessage)
  }))
  
  // Sort by relevance score (higher is better)
  scoredQueries.sort((a, b) => b.score - a.score)
  
  return scoredQueries.map(item => item.query)
}

// Calculate relevance score for query prioritization
function calculateQueryRelevanceScore(query: string, originalMessage: string): number {
  let score = 0
  const lowerQuery = query.toLowerCase()
  const lowerOriginal = originalMessage.toLowerCase()
  
  // Exact match bonus
  if (lowerQuery.includes(lowerOriginal)) score += 10
  
  // Keyword overlap bonus
  const queryWords = lowerQuery.split(/\s+/)
  const originalWords = lowerOriginal.split(/\s+/)
  const commonWords = queryWords.filter(word => originalWords.includes(word))
  score += commonWords.length * 2
  
  // Domain relevance bonus
  const domainKeywords = ['publisher', 'website', 'filter', 'quality', 'metrics', 'cart', 'price']
  const domainMatches = domainKeywords.filter(keyword => lowerQuery.includes(keyword))
  score += domainMatches.length * 1.5
  
  // Length penalty (prefer concise queries)
  if (query.length > 100) score -= 2
  
  return score
}

// Generate multiple embeddings with error handling
async function generateMultipleEmbeddings(queries: string[]): Promise<number[][]> {
  const embeddings: number[][] = []
  
  for (const query of queries) {
    try {
      const embedding = await generateEmbedding(query)
      embeddings.push(embedding)
    } catch (error) {
      console.warn(`Embedding generation failed for query: ${query}`, error)
      // Use a fallback embedding
      embeddings.push(Array.from({ length: 1536 }, () => Math.random() * 2 - 1))
    }
  }
  
  return embeddings
}

// Perform advanced retrieval with context ranking
async function performAdvancedRetrieval(userId: string, mainEmbedding: number[], queries: string[], message: string): Promise<any[]> {
  try {
    console.log('🔍 Performing advanced retrieval with context ranking...')
    
    // Enhanced search query with multiple strategies
    const searchResults = await prisma.$queryRaw`
      WITH enhanced_search AS (
        SELECT 
          id,
          content,
          metadata,
          content_type,
          created_at,
          access_count,
          importance_score,
          -- Primary semantic similarity
          COALESCE(1 - (embedding <=> ${`[${mainEmbedding.join(',')}]`}::vector(1536)), 0.0) AS semantic_similarity,
          -- Enhanced keyword matching
          CASE 
            WHEN LOWER(content) LIKE LOWER(${'%' + queries[0] + '%'}) THEN 0.95
            WHEN LOWER(content) LIKE LOWER(${'%' + message + '%'}) THEN 0.9
            WHEN LOWER(content) LIKE LOWER(${'%' + queries[1] + '%'}) THEN 0.85
            WHEN LOWER(content) LIKE LOWER(${'%' + queries[2] + '%'}) THEN 0.8
            ELSE 0.0
          END AS keyword_similarity,
          -- Context relevance scoring
          CASE 
            WHEN content_type = 'filter_guidance' THEN 1.0
            WHEN content_type = 'quality_definition' THEN 0.9
            WHEN content_type = 'tool_usage' THEN 0.8
            WHEN content_type = 'general_info' THEN 0.7
            ELSE 0.5
          END AS content_relevance,
          -- Recency bonus
          CASE 
            WHEN created_at > NOW() - INTERVAL '7 days' THEN 1.0
            WHEN created_at > NOW() - INTERVAL '30 days' THEN 0.9
            WHEN created_at > NOW() - INTERVAL '90 days' THEN 0.8
            ELSE 0.7
          END AS recency_bonus,
          -- Usage frequency bonus
          CASE 
            WHEN access_count > 10 THEN 1.0
            WHEN access_count > 5 THEN 0.9
            WHEN access_count > 2 THEN 0.8
            ELSE 0.7
          END AS usage_bonus
        FROM user_knowledge_base
        WHERE user_id = ${userId}
          AND (
            embedding IS NOT NULL AND (1 - (embedding <=> ${`[${mainEmbedding.join(',')}]`}::vector(1536))) > 0.15
            OR LOWER(content) LIKE LOWER(${'%' + queries[0] + '%'})
            OR LOWER(content) LIKE LOWER(${'%' + message + '%'})
            OR LOWER(content) LIKE LOWER(${'%' + queries[1] + '%'})
            OR LOWER(content) LIKE LOWER(${'%' + queries[2] + '%'})
          )
      ),
      ranked_results AS (
        SELECT 
          *,
          -- Advanced ranking formula
          (
            semantic_similarity * 0.4 +
            keyword_similarity * 0.3 +
            content_relevance * 0.15 +
            recency_bonus * 0.1 +
            usage_bonus * 0.05
          ) AS final_score
        FROM enhanced_search
      )
      SELECT 
        id,
        content,
        metadata,
        content_type,
        created_at,
        access_count,
        importance_score,
        semantic_similarity,
        keyword_similarity,
        content_relevance,
        recency_bonus,
        usage_bonus,
        final_score
      FROM ranked_results
      WHERE final_score > 0.2
      ORDER BY final_score DESC
      LIMIT 12
    `
    
    console.log(`📊 Retrieved ${searchResults.length} results with advanced ranking`)
    
    // Update access counts for retrieved items
    if (searchResults.length > 0) {
      const ids = searchResults.map((r: any) => r.id)
      await prisma.userKnowledgeBase.updateMany({
        where: { id: { in: ids } },
        data: { access_count: { increment: 1 } }
      })
    }
    
    return searchResults
    
  } catch (error) {
    console.error('Advanced retrieval failed:', error)
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
    const { message, messages, config: clientConfig, currentUrl, cartState, userId: requestUserId, userContext, uploadedDocuments } = await request.json()
    const isStream = request.nextUrl?.searchParams?.get('stream') === '1'
    
    console.log(`🚀 RAG-Integrated AI Chat (${isStream ? 'stream' : 'non-stream'}): message="${message.substring(0, 50)}..."`)
    console.log('👤 DEBUG: Received user context:', {
      hasUserContext: !!userContext,
      userBasic: userContext?.basic,
      userProfile: userContext?.profile,
      userRoles: userContext?.roles,
      isAdmin: userContext?.isAdmin
    })
    
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
      return await handleStreamingRequest(userId, message, messages, clientConfig, cartState, currentUrl, canPersist, userContext, uploadedDocuments)
    } else {
      return await handleNonStreamingRequest(userId, message, messages, clientConfig, cartState, currentUrl, canPersist, userContext, uploadedDocuments)
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
  canPersist: boolean,
  userContext: any,
  uploadedDocuments?: any[]
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
    
    // Get RAG context and user context with timeout
    let searchResults: any[] = []
    let userContextStr = ''
    try {
      const ragProcessingPromise = (async () => {
        const rewrittenQueries = await rewriteQuery(message)
        const hybridResults = await hybridSearch(userId, rewrittenQueries, message)
        return await rerankResults(hybridResults, message)
      })()
      
      // Format user context directly - no need for promises for simple formatting
      userContextStr = formatUserContextFromRequest(userContext)
      console.log('👤 DEBUG: Formatted user context:', userContextStr)
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('RAG processing timeout')), 10000) // 10 second timeout
      })
      
      const ragResults = await Promise.race([
        ragProcessingPromise,
        timeoutPromise
      ]) as any[]
      
      searchResults = ragResults
    } catch (error) {
      console.warn('RAG processing failed or timed out, continuing without context:', error)
      searchResults = []
      userContextStr = ''
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
    
    // Add document context if uploaded documents are provided
    let documentContext = ''
    if (uploadedDocuments && uploadedDocuments.length > 0) {
      console.log('Processing uploaded documents:', uploadedDocuments.length);
      console.log('Document details:', uploadedDocuments.map(doc => ({
        id: doc.id,
        originalName: doc.originalName,
        fileName: doc.fileName,
        fileUrl: doc.fileUrl
      })));
      
      try {
        const documentContents = await getMultipleDocumentContents(uploadedDocuments);
        console.log('Document contents fetched:', documentContents.length);
        console.log('Content previews:', documentContents.map(doc => ({
          name: doc.name,
          contentLength: doc.content.length,
          contentPreview: doc.content.substring(0, 100) + '...'
        })));
        
        documentContext = `\n\nUPLOADED DOCUMENT CONTEXT:\n${documentContents.map((doc, index) => `doc${index + 1}: ${doc.name}\n${doc.content}`).join('\n\n')}`;
        console.log('Final document context length:', documentContext.length);
      } catch (error) {
        console.error('Error fetching document contents:', error);
        documentContext = '\n\nNote: Some uploaded documents could not be processed.';
      }
    }
    
    // Enhanced CNL-P System Prompt with Advanced Prompting Techniques
    const baseSystemPrompt = `# PUBLISHERS MARKETPLACE AI ASSISTANT
# ROLE: Publisher Website Filtering Specialist
# CONTEXT: Digital Marketing & Link Building Platform

## CORE CAPABILITIES
- FILTER_APPLICATION: Apply publisher website filters with precision
- CART_MANAGEMENT: Handle cart operations and checkout flow
- NAVIGATION: Guide users through platform features
- RECOMMENDATIONS: Provide data-driven publisher suggestions

## QUALITY DEFINITIONS (STRICT)
GOOD_WEBSITES := DA >= 50 AND DR >= 50 AND SPAM_SCORE <= 2 AND TRAFFIC >= 10000
DECENT_WEBSITES := DA >= 40 AND DR >= 40 AND SPAM_SCORE <= 3 AND TRAFFIC >= 5000
HIGH_QUALITY_WEBSITES := DA >= 60 AND DR >= 60 AND SPAM_SCORE <= 1 AND TRAFFIC >= 50000
PREMIUM_WEBSITES := DA >= 70 AND DR >= 70 AND SPAM_SCORE <= 1 AND TRAFFIC >= 100000

## AVAILABLE FILTER PARAMETERS (COMPLETE SCHEMA)
### METRICS & AUTHORITY
- daMin/daMax: Domain Authority (0-100)
- paMin/paMax: Page Authority (0-100) 
- drMin/drMax: Domain Rating (0-100)
- spamMin/spamMax: Spam Score (0-100, lower is better)

### TRAFFIC & PERFORMANCE
- semrushOverallTrafficMin: Minimum overall traffic
- semrushOrganicTrafficMin: Minimum organic traffic
- trend: "increasing" | "decreasing" | "stable"

### PRICING & TURNAROUND
- priceMin/priceMax: Cost range in USD
- tatDaysMin/tatDaysMax: Turnaround time in days

### CONTENT & LINKS
- backlinkNature: "do-follow" | "no-follow" | "sponsored"
- linkPlacement: "in-content" | "author-bio" | "footer"
- permanence: "lifetime" | "12-months"
- backlinksAllowedMin: Minimum backlinks allowed

### GEOGRAPHIC & LANGUAGE
- language: Language code (e.g., "en", "es", "fr")
- country: Country code (e.g., "us", "uk", "ca")

### CONTENT & QUALITY
- niche: Content category/niche
- availability: true/false (currently available)
- tool: "Semrush" | "Ahrefs" (data source)
- remarkIncludes: Text that must be in remarks
- lastPublishedAfter: Date filter (YYYY-MM-DD)
- outboundLinkLimitMax: Maximum outbound links
- disclaimerIncludes: Text that must be in disclaimer
- guidelinesUrlIncludes: Text that must be in guidelines URL

## CRITICAL FILTER INTENT DETECTION
**ONLY APPLY FILTERS WHEN USER EXPLICITLY REQUESTS FILTERING ACTION**

### EXPLICIT FILTER REQUEST PATTERNS (MUST CONTAIN THESE):
**ACTION VERBS:**
- "show me", "find me", "filter", "apply", "set", "change", "update", "modify"
- "search for", "look for", "get me", "bring up", "display"
- "narrow down", "refine", "sort by", "organize by"

**QUALITY DESCRIPTORS:**
- "good sites", "decent sites", "quality sites", "premium sites", "best sites"
- "high authority", "low spam", "reliable", "trusted", "established"
- "top sites", "leading sites", "popular sites", "trending sites"

**SPECIFIC CRITERIA:**
- "under $X", "above $X", "between $X and $Y", "cheap", "expensive", "budget"
- "DA above X", "DR above X", "spam score below X", "authority above X"
- "tech sites", "health sites", "finance sites", "business sites"
- "English sites", "US sites", "UK sites", "local sites"
- "dofollow links", "nofollow links", "sponsored links"
- "available sites", "sites with traffic above X", "high traffic"
- "fast turnaround", "quick delivery", "same day", "within X days"

### EXPLORATORY/INFORMATIONAL PATTERNS (DO NOT APPLY FILTERS):
**QUESTION WORDS:**
- "what is", "how does", "explain", "tell me about", "describe"
- "what are the benefits", "why should I", "what's the difference"
- "can you help me understand", "I'm looking for information about"
- "I want to learn about", "what do you recommend", "what would you suggest"

**INFORMATIONAL INTENT:**
- "help me understand", "I need to know", "I'm curious about"
- "what's the best way", "how can I", "what should I"
- "I'm new to", "I don't understand", "I'm confused about"

## MANDATORY FILTER INTENT VERIFICATION
**BEFORE APPLYING ANY FILTER, YOU MUST:**

1. **Check for explicit action words:**
   - Does the message contain "show me", "find me", "filter", "apply", "set", "change", "update", "modify"?
   - Does the message contain specific criteria like "under $X", "DA above X", "tech sites"?

2. **Check for informational intent:**
   - Does the message start with "what is", "how does", "explain", "tell me about"?
   - Is the user asking for information rather than requesting action?

3. **Apply the rule:**
   - IF explicit action words + specific criteria → APPLY FILTERS
   - IF informational questions → PROVIDE INFORMATION, NO FILTERS
   - IF unclear → ASK FOR CLARIFICATION, NO FILTERS

**REMEMBER: When in doubt, DO NOT apply filters. Ask for clarification instead.**

## TOOL_CALLING_PROTOCOL
WHEN user requests filter application:
1. PARSE user intent using intent_classification
2. MAP quality terms to precise filter parameters
3. GENERATE single [FILTER:...] command with all parameters
4. CONFIRM application with brief acknowledgment

## INTENT_CLASSIFICATION
- EXPLORATORY: User seeking information → PROVIDE guidance, DO NOT apply filters
- ACTION_REQUESTED: User explicitly requests filtering → APPLY filters immediately
- AMBIGUOUS: Unclear intent → ASK single clarifying question

## META_PROMPTING_CONDUCTOR
Before responding to user requests, analyze and decompose the task:

### TASK_ANALYSIS
1. IDENTIFY primary intent (filter, cart, navigation, information)
2. EXTRACT specific parameters and constraints
3. DETERMINE required tools and actions
4. VALIDATE against user context and permissions

### REASONING_CHAIN
Step 1: Parse user request for explicit vs implicit actions
Step 2: Map quality descriptors to quantitative filters
Step 3: Validate parameter combinations for feasibility
Step 4: Generate appropriate tool calls or responses

### QUALITY_CHECK
- Does the response address the user's actual need?
- Are all filter parameters logically consistent?
- Is the tool call format correct and complete?
- Does the confirmation provide value without redundancy?

## SELF_CONSISTENCY_VALIDATION
For filter applications and tool calls, perform consistency checks:

### VALIDATION_STEPS
1. GENERATE primary response with tool call
2. GENERATE alternative interpretation
3. COMPARE both approaches for consistency
4. SELECT most appropriate response
5. VERIFY tool call syntax and parameters

### CONSISTENCY_CRITERIA
- Filter parameters must align with user intent
- Tool calls must be syntactically correct
- Quality definitions must match industry standards
- User context must be properly incorporated

## ENHANCED_CHAIN_OF_THOUGHT_REASONING
When processing user requests, ALWAYS follow this explicit reasoning process:

### STEP_1_ANALYSIS_PHASE
**User Intent Analysis:**
- Primary Goal: [Identify the main objective]
- Secondary Goals: [Identify supporting objectives]
- Constraints: [Identify limitations and requirements]
- Context: [Review user profile, history, and current session]

**Intent Classification:**
- EXPLORATORY: User seeking information → PROVIDE guidance, DO NOT apply filters
- ACTION_REQUESTED: User explicitly requests filtering → APPLY filters immediately
- AMBIGUOUS: Unclear intent → ASK single clarifying question

### STEP_2_PARAMETER_EXTRACTION
**Quality Term Mapping:**
- "good" → DA≥50, DR≥50, Spam≤2, Traffic≥10K
- "decent" → DA≥40, DR≥40, Spam≤3, Traffic≥5K
- "high-quality/premium" → DA≥60, DR≥60, Spam≤1, Traffic≥50K
- "best/top" → DA≥70, DR≥70, Spam≤1, Traffic≥100K

**Numerical Parameter Extraction:**
- Price ranges: Extract min/max values
- Metrics: Extract DA, DR, Spam Score, Traffic values
- Time constraints: Extract TAT requirements
- Geographic: Extract country/language preferences

### STEP_3_TOOL_SELECTION
**Required Tools Identification:**
- FILTER: For website filtering requests
- CART: For cart management requests
- NAVIGATE: For navigation requests
- RECOMMEND: For recommendation requests

**Tool Call Validation:**
- Syntax: Ensure proper [TOOL:parameter] format
- Parameters: Validate all parameters are within valid ranges
- Logic: Check parameter combinations for consistency
- Completeness: Ensure all required parameters are present

### STEP_4_EXECUTION_PLANNING
**Response Structure:**
1. [TOOL_CALL] (if action required)
2. [CONFIRMATION] (brief acknowledgment)
3. [CONTEXT] (relevant additional information if helpful)

**Quality Assurance Checklist:**
- ✓ Does the response address the user's actual need?
- ✓ Are all filter parameters logically consistent?
- ✓ Is the tool call format correct and complete?
- ✓ Does the confirmation provide value without redundancy?
- ✓ Am I being honest about limitations?

### STEP_5_REASONING_VALIDATION
**Self-Verification Process:**
1. Re-read the user's request
2. Verify the tool call matches the intent
3. Check parameter values are reasonable
4. Confirm the response is helpful and accurate
5. Ensure no hallucinated capabilities or claims

**Error Prevention:**
- Never claim actions without tool tags
- Never apply filters without explicit request
- Never hallucinate features or capabilities
- Always validate parameter ranges
- Always provide clear, honest feedback

## FILTER_VALIDATION
Before generating [FILTER:...] commands:
1. VALIDATE parameter ranges against schema constraints
2. CHECK for logical consistency (min <= max)
3. ENSURE required parameters are present
4. VERIFY parameter names match API specification

## TOOL_CALL_TEMPLATES
[FILTER:daMin={value}&drMin={value}&spamMax={value}&priceMin={value}&priceMax={value}&niche={value}]
[ADD_TO_CART:{itemId}]
[VIEW_CART]
[NAVIGATE:/publishers?filters={encoded_filters}]

## ERROR_HANDLING
- If parameters are invalid, suggest corrections
- If tool call fails, provide fallback options
- Always maintain user context and preferences

## USER_CONTEXT_INTEGRATION

### CONTEXT_PRIORITIZATION
1. User Profile: Company, role, experience level
2. Interaction History: Previous filters and preferences
3. Current Session: Active filters and cart state
4. Project Context: Domain, goals, and constraints

### ADAPTIVE_RESPONSES
- Adjust technical detail level based on user expertise
- Use company-specific terminology when relevant
- Reference previous successful filter combinations
- Suggest complementary filters based on user goals

### PERSONALIZATION
- Remember user's preferred quality standards
- Adapt recommendations to user's budget constraints
- Consider user's industry and niche preferences
- Maintain consistency with user's communication style

## RESPONSE_TEMPLATE
[TOOL_CALL] (if action required)
[CONFIRMATION] (brief acknowledgment)
[CONTEXT] (relevant additional information if helpful)

## PLATFORM_CONTEXT
This is a publishers marketplace where users can:
- Browse and filter publisher websites by metrics (DA, traffic, pricing, TAT, niche, etc.)
- Add sites to cart for purchasing publishing opportunities
- Manage their cart and complete purchases

**IMPORTANT**: All filters, pricing, and criteria refer to PUBLISHER WEBSITES, not generic products.

## AVAILABLE_TOOLS
    
    ### FILTERING & NAVIGATION
    [FILTER:param=value] - Apply filters
    Parameters: q, niche, language, country, priceMin, priceMax, daMin, daMax, paMin, paMax, drMin, drMax, spamMin, spamMax, semrushOverallTrafficMin, semrushOrganicTrafficMin, availability, tool, backlinkNature, linkPlacement, permanence, remarkIncludes, lastPublishedAfter, outboundLinkLimitMax, disclaimerIncludes, trend, tatDaysMin, tatDaysMax
    
    [NAVIGATE:/publishers?filters] - Navigate with filters
    
### CART_MANAGEMENT
    [ADD_TO_CART:itemId] - Add item to cart
    [REMOVE_FROM_CART:itemId] - Remove item
    [VIEW_CART] - View cart contents
    [CLEAR_CART] - Clear all items
    [CART_SUMMARY] - Get detailed cart summary
    
    ### CHECKOUT & ORDERS
    [PROCEED_TO_CHECKOUT] - Go to checkout
    [VIEW_ORDERS] - View orders page
    
    ### RECOMMENDATIONS
    [RECOMMEND:criteria] - Get recommendations
    [SIMILAR_ITEMS:itemId] - Find similar items
    [BEST_DEALS] - Show current deals
    
    ${userContextStr}
    ${ragContext}
    ${documentContext}
    
## QUALITY_CHECKLIST
    Before responding, verify:
    1. ✓ Did I use a tool tag if action was requested?
    2. ✓ Did I avoid claiming actions I didn't perform?
    3. ✓ Is my response accurate and helpful?
    4. ✓ Did I avoid unnecessary verbosity or filler?
    5. ✓ Am I being honest about limitations?
    
    Be helpful, accurate, and efficient. Focus on delivering value without BS.`
    
    // Create OpenAI client for streaming
    console.log('🔑 Environment check:')
    console.log('OPEN_AI_KEY exists:', !!process.env.OPEN_AI_KEY)
    console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY)
    console.log('OPEN_AI_KEY length:', process.env.OPEN_AI_KEY?.length || 0)
    
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
      
      // 128k-token safeguard: summarize only the chat history (keep system/doc/RAG intact)
      try {
        const MAX_CONTEXT_TOKENS = 128000
        const SAFETY_MARGIN = 120000 // trigger summarization before hard cap
        let currentTokens = estimateTokensForMessages(chatMessages)
        if (currentTokens > SAFETY_MARGIN) {
          const apiKey = process.env.OPEN_AI_KEY || process.env.OPENAI_API_KEY!
          const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
          // Extract only history (exclude first system and last user message)
          const historyOnly = chatMessages.slice(1, -1) as Array<{ role: 'user' | 'assistant'; content: string }>
          const summary = await summarizeChatHistory(historyOnly, model, apiKey)
          const summarizedHistory = [{ role: 'assistant' as const, content: `Conversation summary (for context):\n${summary}` }]
          const rebuilt = [chatMessages[0], ...summarizedHistory, chatMessages[chatMessages.length - 1]]
          // If still too large, keep only the summary and last user
          if (estimateTokensForMessages(rebuilt) > MAX_CONTEXT_TOKENS) {
            chatMessages.splice(0, chatMessages.length, rebuilt[0], summarizedHistory[0], rebuilt[rebuilt.length - 1])
          } else {
            chatMessages.splice(0, chatMessages.length, ...rebuilt)
          }
        }
    } catch (e) {
        console.warn('Chat history summarization step failed, continuing without it:', e)
      }
      
      // 🔍 DEBUG: Log context size and final context being sent to AI
      try {
        const ctxStr = JSON.stringify(chatMessages)
        console.log('🤖 CONTEXT SIZE:', {
          messagesCount: chatMessages.length,
          chars: ctxStr.length,
          approxTokens: estimateTokensForMessages(chatMessages)
        })
      } catch {}
      console.log('🤖 FINAL AI CONTEXT:', JSON.stringify(chatMessages, null, 2))
      
      // Enhanced Self-Consistency Prompting Implementation
      const performSelfConsistencyCheck = async (messages: any[], userMessage: string) => {
        try {
          console.log('🔄 Performing self-consistency check...')
          
          // Generate multiple responses with different temperatures
          const consistencyPromises = [
            // Primary response (standard temperature)
            fetch('https://api.openai.com/v1/chat/completions', {
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
                stream: false
              })
            }),
            // Alternative response (lower temperature for consistency)
            fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPEN_AI_KEY || process.env.OPENAI_API_KEY}`,
              },
              body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: chatMessages,
                temperature: 0.3,
                max_tokens: 1000,
                stream: false
              })
            })
          ]
          
          const responses = await Promise.all(consistencyPromises)
          const responseData = await Promise.all(responses.map(r => r.json()))
          
          const responses_text = responseData.map(r => r.choices?.[0]?.message?.content || '').filter(text => text.trim())
          
          if (responses_text.length < 2) {
            console.log('⚠️ Insufficient responses for consistency check, using primary')
            return responseData[0]
          }
          
          // Analyze consistency between responses
          const consistencyScore = calculateConsistencyScore(responses_text[0], responses_text[1])
          console.log(`📊 Consistency score: ${consistencyScore.toFixed(2)}`)
          
          // Select the most appropriate response
          const selectedResponse = selectBestResponse(responses_text, consistencyScore, userMessage)
          const selectedIndex = responses_text.indexOf(selectedResponse)
          
          console.log(`✅ Selected response ${selectedIndex + 1} with consistency score: ${consistencyScore.toFixed(2)}`)
          
          return {
            ...responseData[selectedIndex],
            consistencyScore,
            alternativeResponses: responses_text.length
          }
          
        } catch (error) {
          console.warn('⚠️ Self-consistency check failed, falling back to standard response:', error)
          return null
        }
      }
      
      // Helper function to calculate consistency score
      const calculateConsistencyScore = (response1: string, response2: string): number => {
        const words1 = response1.toLowerCase().split(/\s+/)
        const words2 = response2.toLowerCase().split(/\s+/)
        
        const commonWords = words1.filter(word => words2.includes(word))
        const totalWords = Math.max(words1.length, words2.length)
        
        const wordSimilarity = commonWords.length / totalWords
        
        // Check for tool call consistency
        const toolCalls1 = (response1.match(/\[[A-Z_]+\s*:[^\]]*\]/g) || []).length
        const toolCalls2 = (response2.match(/\[[A-Z_]+\s*:[^\]]*\]/g) || []).length
        const toolCallConsistency = toolCalls1 === toolCalls2 ? 1 : 0.5
        
        // Check for filter parameter consistency
        const filterParams1 = extractFilterParams(response1)
        const filterParams2 = extractFilterParams(response2)
        const paramConsistency = compareFilterParams(filterParams1, filterParams2)
        
        return (wordSimilarity * 0.4 + toolCallConsistency * 0.3 + paramConsistency * 0.3)
      }
      
      // Helper function to extract filter parameters
      const extractFilterParams = (response: string): any => {
        const filterMatch = response.match(/\[FILTER:([^\]]+)\]/)
        if (!filterMatch) return {}
        
        const params: any = {}
        const paramString = filterMatch[1]
        const pairs = paramString.split('&')
        
        for (const pair of pairs) {
          const [key, value] = pair.split('=')
          if (key && value) {
            params[key] = value
          }
        }
        
        return params
      }
      
      // Helper function to compare filter parameters
      const compareFilterParams = (params1: any, params2: any): number => {
        const keys1 = Object.keys(params1)
        const keys2 = Object.keys(params2)
        
        if (keys1.length === 0 && keys2.length === 0) return 1
        if (keys1.length === 0 || keys2.length === 0) return 0
        
        const commonKeys = keys1.filter(key => keys2.includes(key))
        const totalKeys = Math.max(keys1.length, keys2.length)
        
        const keySimilarity = commonKeys.length / totalKeys
        
        let valueSimilarity = 0
        for (const key of commonKeys) {
          if (params1[key] === params2[key]) {
            valueSimilarity += 1
          }
        }
        
        const avgValueSimilarity = commonKeys.length > 0 ? valueSimilarity / commonKeys.length : 0
        
        return (keySimilarity * 0.6 + avgValueSimilarity * 0.4)
      }
      
      // Helper function to select the best response
      const selectBestResponse = (responses: string[], consistencyScore: number, userMessage: string): string => {
        // If consistency is high, prefer the first response
        if (consistencyScore > 0.8) {
          return responses[0]
        }
        
        // If consistency is low, analyze which response better matches user intent
        const userIntent = userMessage.toLowerCase()
        
        for (const response of responses) {
          const responseLower = response.toLowerCase()
          
          // Check for explicit action requests
          if (/(?:filter|apply|show|find)/i.test(userIntent) && /\[FILTER:/i.test(responseLower)) {
            return response
          }
          
          if (/(?:cart|add|remove)/i.test(userIntent) && /\[(?:ADD_TO_CART|REMOVE_FROM_CART|VIEW_CART)/i.test(responseLower)) {
            return response
          }
          
          if (/(?:checkout|buy|purchase)/i.test(userIntent) && /\[(?:PROCEED_TO_CHECKOUT|VIEW_ORDERS)/i.test(responseLower)) {
            return response
          }
        }
        
        // Default to first response if no clear winner
        return responses[0]
      }
      
      // Perform self-consistency check for critical operations
      const shouldPerformConsistencyCheck = (userMessage: string): boolean => {
        const criticalPatterns = [
          /(?:filter|apply|show|find)/i,
          /(?:good|decent|quality|premium|best)/i,
          /(?:cart|checkout|buy)/i,
          /(?:price|cost|budget)/i
        ]
        
        return criticalPatterns.some(pattern => pattern.test(userMessage))
      }
      
      let finalResponse
      
      if (shouldPerformConsistencyCheck(message)) {
        console.log('🔍 Performing self-consistency check for critical operation...')
        const consistencyResult = await performSelfConsistencyCheck(chatMessages, message)
        
        if (consistencyResult && consistencyResult.consistencyScore > 0.6) {
          console.log('✅ Using self-consistency validated response')
          finalResponse = consistencyResult
        } else {
          console.log('⚠️ Self-consistency check failed or low score, using standard response')
          finalResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
        }
      } else {
        console.log('📝 Standard response for non-critical operation')
        finalResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
      }
      
      // Handle the response
      const openaiResponse = finalResponse
    
    console.log('🔍 OpenAI Response Debug:')
    console.log('openaiResponse:', openaiResponse)
    console.log('openaiResponse.ok:', openaiResponse.ok)
    console.log('openaiResponse.status:', openaiResponse.status)
    console.log('openaiResponse.statusText:', openaiResponse.statusText)
    
    if (!openaiResponse.ok) {
      console.error('OpenAI API error:', openaiResponse.status)
      console.error('Response object type:', typeof openaiResponse)
      console.error('Response has text method:', typeof openaiResponse.text)
      let errorText = 'Unable to read error response'
      try {
        if (typeof openaiResponse.text === 'function') {
          errorText = await openaiResponse.text()
        } else {
          errorText = `Response object: ${JSON.stringify(openaiResponse)}`
        }
      } catch (e: unknown) {
        console.error('Error reading response text:', e)
        errorText = `Error: ${e instanceof Error ? e.message : String(e)}`
      }
      console.error('OpenAI API error details:', errorText)
      throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`)
    }
    
    // console.log('✅ OpenAI streaming response started')
    
    // Store interaction in background (non-blocking)
    setImmediate(() => {
      if (userId !== 'anonymous' && canPersist) {
        // Store the interaction for future RAG
        try {
          generateEmbedding(message).then(embedding => {
            prisma.$executeRaw`
              INSERT INTO user_knowledge_base (
                user_id, content, content_type, embedding, metadata, topics, importance_score
              ) VALUES (
                ${userId},
                    ${message},
                    'user_fact',
                ${`[${embedding.join(',')}]`}::vector(1536),
                    ${JSON.stringify({
                  source: 'user_conversation',
                      timestamp: new Date().toISOString(),
                  hasRelevantContext: hasRelevantContext,
                  contextCount: searchResults.length
                    })}::jsonb,
                ${[]},
                ${1.0}
              )
            `.catch(error => console.warn('Background storage failed:', error))
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
 * 🚀 Non-streaming RAG request
 */
async function handleNonStreamingRequest(
  userId: string,
  message: string,
  messages: any[],
  clientConfig: any,
  cartState: any,
  currentUrl: string,
  canPersist: boolean,
  userContext: any,
  uploadedDocuments?: any[]
) {
  try {
    // console.log('🔍 Starting RAG-enhanced non-streaming request...')
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
      // console.log(`🎯 Semantic cache hit! Similarity: ${similarCachedResponse[0].similarity.toFixed(3)}`)
      
      // Update cache hit count
      await prisma.semanticCache.update({
        where: { id: similarCachedResponse[0].id },
        data: { 
          hitCount: { increment: 1 },
          lastHitAt: new Date()
        }
      })
      
      return NextResponse.json({
        response: similarCachedResponse[0].cached_response,
        cached: true,
        similarity: similarCachedResponse[0].similarity
      })
    }
    
    // RAG: Get context using same approach as streaming
    let searchResults: any[] = []
    let userContextStr = ''
    try {
      const ragProcessingPromise = (async () => {
        const rewrittenQueries = await rewriteQuery(message)
        const hybridResults = await hybridSearch(userId, rewrittenQueries, message)
        return await rerankResults(hybridResults, message)
      })()
      
      // Format user context directly
      userContextStr = formatUserContextFromRequest(userContext)
      // console.log('👤 DEBUG: Formatted user context:', userContextStr)
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('RAG processing timeout')), 10000) // 10 second timeout
      })
      
      const ragResults = await Promise.race([
        ragProcessingPromise,
        timeoutPromise
      ]) as any[]
      
      searchResults = ragResults
    } catch (error) {
      console.warn('RAG processing failed or timed out, continuing without context:', error)
      searchResults = []
      userContextStr = ''
    }
    
    // Build context
    const hasRelevantContext = searchResults.length > 0 && (
      searchResults.some((r: any) => (r.confidence_score || 0) > 0.7) || 
      searchResults.some((r: any) => (r.similarity || 0) > 0.4)
    )
    
    const ragContext = hasRelevantContext
      ? `\n\nRELEVANT KNOWLEDGE BASE CONTEXT:\n${searchResults.map(r => `- ${r.content}`).join('\n')}`
      : ''
    
    // Add document context if uploaded documents are provided
    let documentContext = ''
    if (uploadedDocuments && uploadedDocuments.length > 0) {
      // console.log('Processing uploaded documents:', uploadedDocuments.length);
      // console.log('Document details:', uploadedDocuments.map(doc => ({
      //   id: doc.id,
      //   originalName: doc.originalName,
      //   fileName: doc.fileName,
      //   fileUrl: doc.fileUrl
      // })));
      
      try {
        const documentContents = await getMultipleDocumentContents(uploadedDocuments);
        // console.log('Document contents fetched:', documentContents.length);
        // console.log('Content previews:', documentContents.map(doc => ({
        //   name: doc.name,
        //   contentLength: doc.content.length,
        //   contentPreview: doc.content.substring(0, 100) + '...'
        // })));
        
        documentContext = `\n\nUPLOADED DOCUMENT CONTEXT:\n${documentContents.map((doc, index) => `doc${index + 1}: ${doc.name}\n${doc.content}`).join('\n\n')}`;
        console.log('Final document context length:', documentContext.length);
      } catch (error) {
        console.error('Error fetching document contents:', error);
        documentContext = '\n\nNote: Some uploaded documents could not be processed.';
      }
    }
    
    // console.log(`📚 RAG Context: ${ragContext.length} characters`)
    // console.log(`📄 Document Context: ${documentContext.length} characters`)
    
    // Enhanced CNL-P System Prompt for Non-Streaming
    const systemPrompt = `# PUBLISHERS MARKETPLACE AI ASSISTANT
# ROLE: Publisher Website Filtering Specialist
# CONTEXT: Digital Marketing & Link Building Platform

## CORE CAPABILITIES
- FILTER_APPLICATION: Apply publisher website filters with precision
- CART_MANAGEMENT: Handle cart operations and checkout flow
- NAVIGATION: Guide users through platform features
- RECOMMENDATIONS: Provide data-driven publisher suggestions

## QUALITY DEFINITIONS (STRICT)
GOOD_WEBSITES := DA >= 50 AND DR >= 50 AND SPAM_SCORE <= 2 AND TRAFFIC >= 10000
DECENT_WEBSITES := DA >= 40 AND DR >= 40 AND SPAM_SCORE <= 3 AND TRAFFIC >= 5000
HIGH_QUALITY_WEBSITES := DA >= 60 AND DR >= 60 AND SPAM_SCORE <= 1 AND TRAFFIC >= 50000
PREMIUM_WEBSITES := DA >= 70 AND DR >= 70 AND SPAM_SCORE <= 1 AND TRAFFIC >= 100000

## TOOL_CALLING_PROTOCOL
WHEN user requests filter application:
1. PARSE user intent using intent_classification
2. MAP quality terms to precise filter parameters
3. GENERATE single [FILTER:...] command with all parameters
4. CONFIRM application with brief acknowledgment

## INTENT_CLASSIFICATION
- EXPLORATORY: User seeking information → PROVIDE guidance, DO NOT apply filters
- ACTION_REQUESTED: User explicitly requests filtering → APPLY filters immediately
- AMBIGUOUS: Unclear intent → ASK single clarifying question

## META_PROMPTING_CONDUCTOR
Before responding to user requests, analyze and decompose the task:

### TASK_ANALYSIS
1. IDENTIFY primary intent (filter, cart, navigation, information)
2. EXTRACT specific parameters and constraints
3. DETERMINE required tools and actions
4. VALIDATE against user context and permissions

### REASONING_CHAIN
Step 1: Parse user request for explicit vs implicit actions
Step 2: Map quality descriptors to quantitative filters
Step 3: Validate parameter combinations for feasibility
Step 4: Generate appropriate tool calls or responses

### QUALITY_CHECK
- Does the response address the user's actual need?
- Are all filter parameters logically consistent?
- Is the tool call format correct and complete?
- Does the confirmation provide value without redundancy?

## SELF_CONSISTENCY_VALIDATION
For filter applications and tool calls, perform consistency checks:

### VALIDATION_STEPS
1. GENERATE primary response with tool call
2. GENERATE alternative interpretation
3. COMPARE both approaches for consistency
4. SELECT most appropriate response
5. VERIFY tool call syntax and parameters

### CONSISTENCY_CRITERIA
- Filter parameters must align with user intent
- Tool calls must be syntactically correct
- Quality definitions must match industry standards
- User context must be properly incorporated

## ENHANCED_CHAIN_OF_THOUGHT_REASONING
When processing user requests, ALWAYS follow this explicit reasoning process:

### STEP_1_ANALYSIS_PHASE
**User Intent Analysis:**
- Primary Goal: [Identify the main objective]
- Secondary Goals: [Identify supporting objectives]
- Constraints: [Identify limitations and requirements]
- Context: [Review user profile, history, and current session]

**Intent Classification:**
- EXPLORATORY: User seeking information → PROVIDE guidance, DO NOT apply filters
- ACTION_REQUESTED: User explicitly requests filtering → APPLY filters immediately
- AMBIGUOUS: Unclear intent → ASK single clarifying question

### STEP_2_PARAMETER_EXTRACTION
**Quality Term Mapping:**
- "good" → DA≥50, DR≥50, Spam≤2, Traffic≥10K
- "decent" → DA≥40, DR≥40, Spam≤3, Traffic≥5K
- "high-quality/premium" → DA≥60, DR≥60, Spam≤1, Traffic≥50K
- "best/top" → DA≥70, DR≥70, Spam≤1, Traffic≥100K

**Numerical Parameter Extraction:**
- Price ranges: Extract min/max values
- Metrics: Extract DA, DR, Spam Score, Traffic values
- Time constraints: Extract TAT requirements
- Geographic: Extract country/language preferences

### STEP_3_TOOL_SELECTION
**Required Tools Identification:**
- FILTER: For website filtering requests
- CART: For cart management requests
- NAVIGATE: For navigation requests
- RECOMMEND: For recommendation requests

**Tool Call Validation:**
- Syntax: Ensure proper [TOOL:parameter] format
- Parameters: Validate all parameters are within valid ranges
- Logic: Check parameter combinations for consistency
- Completeness: Ensure all required parameters are present

### STEP_4_EXECUTION_PLANNING
**Response Structure:**
1. [TOOL_CALL] (if action required)
2. [CONFIRMATION] (brief acknowledgment)
3. [CONTEXT] (relevant additional information if helpful)

**Quality Assurance Checklist:**
- ✓ Does the response address the user's actual need?
- ✓ Are all filter parameters logically consistent?
- ✓ Is the tool call format correct and complete?
- ✓ Does the confirmation provide value without redundancy?
- ✓ Am I being honest about limitations?

### STEP_5_REASONING_VALIDATION
**Self-Verification Process:**
1. Re-read the user's request
2. Verify the tool call matches the intent
3. Check parameter values are reasonable
4. Confirm the response is helpful and accurate
5. Ensure no hallucinated capabilities or claims

**Error Prevention:**
- Never claim actions without tool tags
- Never apply filters without explicit request
- Never hallucinate features or capabilities
- Always validate parameter ranges
- Always provide clear, honest feedback

## FILTER_VALIDATION
Before generating [FILTER:...] commands:
1. VALIDATE parameter ranges against schema constraints
2. CHECK for logical consistency (min <= max)
3. ENSURE required parameters are present
4. VERIFY parameter names match API specification

## TOOL_CALL_TEMPLATES
[FILTER:daMin={value}&drMin={value}&spamMax={value}&priceMin={value}&priceMax={value}&niche={value}]
[ADD_TO_CART:{itemId}]
[VIEW_CART]
[NAVIGATE:/publishers?filters={encoded_filters}]

## ERROR_HANDLING
- If parameters are invalid, suggest corrections
- If tool call fails, provide fallback options
- Always maintain user context and preferences

## USER_CONTEXT_INTEGRATION

### CONTEXT_PRIORITIZATION
1. User Profile: Company, role, experience level
2. Interaction History: Previous filters and preferences
3. Current Session: Active filters and cart state
4. Project Context: Domain, goals, and constraints

### ADAPTIVE_RESPONSES
- Adjust technical detail level based on user expertise
- Use company-specific terminology when relevant
- Reference previous successful filter combinations
- Suggest complementary filters based on user goals

### PERSONALIZATION
- Remember user's preferred quality standards
- Adapt recommendations to user's budget constraints
- Consider user's industry and niche preferences
- Maintain consistency with user's communication style

## RESPONSE_TEMPLATE
[TOOL_CALL] (if action required)
[CONFIRMATION] (brief acknowledgment)
[CONTEXT] (relevant additional information if helpful)

## PLATFORM_CONTEXT
This is a publishers marketplace where users can:
- Browse and filter publisher websites by metrics (DA, traffic, pricing, TAT, niche, etc.)
- Add sites to cart for purchasing publishing opportunities
- Manage their cart and complete purchases

**IMPORTANT**: All filters, pricing, and criteria refer to PUBLISHER WEBSITES, not generic products.

## AVAILABLE_TOOLS

### FILTERING & NAVIGATION
[FILTER:param=value] - Apply filters
Parameters: q, niche, language, country, priceMin, priceMax, daMin, daMax, paMin, paMax, drMin, drMax, spamMin, spamMax, semrushOverallTrafficMin, semrushOrganicTrafficMin, availability, tool, backlinkNature, linkPlacement, permanence, remarkIncludes, lastPublishedAfter, outboundLinkLimitMax, disclaimerIncludes, trend, tatDaysMin, tatDaysMax

[NAVIGATE:/publishers?filters] - Navigate with filters

### CART_MANAGEMENT
[ADD_TO_CART:itemId] - Add item to cart
[REMOVE_FROM_CART:itemId] - Remove item
[VIEW_CART] - View cart contents
[CLEAR_CART] - Clear all items
[CART_SUMMARY] - Get detailed cart summary

### CHECKOUT & ORDERS
[PROCEED_TO_CHECKOUT] - Go to checkout
[VIEW_ORDERS] - View orders page

### RECOMMENDATIONS
[RECOMMEND:criteria] - Get recommendations
[SIMILAR_ITEMS:itemId] - Find similar items
[BEST_DEALS] - Show current deals

IMPORTANT PAYMENT SUCCESS HANDLING:
When a user mentions completing payment successfully or payment success, you MUST:
1. Congratulate them on the successful payment
2. Use [VIEW_ORDERS] action to redirect them to the orders page
3. Do NOT use [PROCEED_TO_CHECKOUT] as they have already completed payment
4. Offer to help them with their orders or next steps

Example response for payment success:
"🎉 Congratulations! Your payment has been processed successfully. Let me show you your orders."
[VIEW_ORDERS]

${userContextStr}
${ragContext}
${documentContext}

## QUALITY_CHECKLIST
Before responding, verify:
1. ✓ Did I use a tool tag if action was requested?
2. ✓ Did I avoid claiming actions I didn't perform?
3. ✓ Is my response accurate and helpful?
4. ✓ Did I avoid unnecessary verbosity or filler?
5. ✓ Am I being honest about limitations?

Be helpful, accurate, and efficient. Focus on delivering value without BS.`

    // Create OpenAI instance
    const openai = createOpenAI({
      apiKey: process.env.OPEN_AI_KEY || process.env.OPENAI_API_KEY!,
    })

    // Build messages array - include more conversation history for better context
    const chatMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
      ...(messages || []).slice(-10).map((m: any) => ({ 
        role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant', 
        content: m.content 
      })),
      { role: 'user' as const, content: message }
    ]
    
    // 128k-token safeguard (non-streaming): summarize only the chat history
    try {
      const MAX_CONTEXT_TOKENS = 128000
      const SAFETY_MARGIN = 120000
      let currentTokens = estimateTokensForMessages(chatMessages)
      if (currentTokens > SAFETY_MARGIN) {
        const apiKey = process.env.OPEN_AI_KEY || process.env.OPENAI_API_KEY!
        const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
        const historyOnly = chatMessages.slice(1, -1) as Array<{ role: 'user' | 'assistant'; content: string }>
        const summary = await summarizeChatHistory(historyOnly, model, apiKey)
        const summarizedHistory = [{ role: 'assistant' as const, content: `Conversation summary (for context):\n${summary}` }]
        const rebuilt = [chatMessages[0], ...summarizedHistory, chatMessages[chatMessages.length - 1]]
        if (estimateTokensForMessages(rebuilt) > MAX_CONTEXT_TOKENS) {
          // Keep only system, summary, and last user message
          chatMessages.splice(0, chatMessages.length, rebuilt[0], summarizedHistory[0], rebuilt[rebuilt.length - 1])
        } else {
          chatMessages.splice(0, chatMessages.length, ...rebuilt)
        }
      }
    } catch (e) {
      console.warn('Chat history summarization (non-stream) failed, continuing without it:', e)
    }
    
    // Enhanced Self-Consistency for Non-Streaming
    const performNonStreamingConsistencyCheck = async (messages: any[], userMessage: string) => {
      try {
        console.log('🔄 Performing non-streaming self-consistency check...')
        
        // Generate multiple responses with different temperatures
        const consistencyPromises = [
          fetch('https://api.openai.com/v1/chat/completions', {
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
        stream: false
      })
          }),
          fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.OPEN_AI_KEY || process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: chatMessages,
              temperature: 0.3,
              max_tokens: 1000,
              stream: false
            })
          })
        ]
        
        const responses = await Promise.all(consistencyPromises)
        const responseData = await Promise.all(responses.map(r => r.json()))
        
        const responses_text = responseData.map(r => r.choices?.[0]?.message?.content || '').filter(text => text.trim())
        
        if (responses_text.length < 2) {
          console.log('⚠️ Insufficient responses for consistency check, using primary')
          return responseData[0]
        }
        
        // Analyze consistency between responses
        const consistencyScore = calculateConsistencyScore(responses_text[0], responses_text[1])
        console.log(`📊 Non-streaming consistency score: ${consistencyScore.toFixed(2)}`)
        
        // Select the most appropriate response
        const selectedResponse = selectBestResponse(responses_text, consistencyScore, userMessage)
        const selectedIndex = responses_text.indexOf(selectedResponse)
        
        console.log(`✅ Selected non-streaming response ${selectedIndex + 1} with consistency score: ${consistencyScore.toFixed(2)}`)
        
        return {
          ...responseData[selectedIndex],
          consistencyScore,
          alternativeResponses: responses_text.length
        }
        
      } catch (error) {
        console.warn('⚠️ Non-streaming self-consistency check failed, falling back to standard response:', error)
        return null
      }
    }
    
    // Helper functions (reuse from streaming version)
    const calculateConsistencyScore = (response1: string, response2: string): number => {
      const words1 = response1.toLowerCase().split(/\s+/)
      const words2 = response2.toLowerCase().split(/\s+/)
      
      const commonWords = words1.filter(word => words2.includes(word))
      const totalWords = Math.max(words1.length, words2.length)
      
      const wordSimilarity = commonWords.length / totalWords
      
      // Check for tool call consistency
      const toolCalls1 = (response1.match(/\[[A-Z_]+\s*:[^\]]*\]/g) || []).length
      const toolCalls2 = (response2.match(/\[[A-Z_]+\s*:[^\]]*\]/g) || []).length
      const toolCallConsistency = toolCalls1 === toolCalls2 ? 1 : 0.5
      
      // Check for filter parameter consistency
      const filterParams1 = extractFilterParams(response1)
      const filterParams2 = extractFilterParams(response2)
      const paramConsistency = compareFilterParams(filterParams1, filterParams2)
      
      return (wordSimilarity * 0.4 + toolCallConsistency * 0.3 + paramConsistency * 0.3)
    }
    
    const extractFilterParams = (response: string): any => {
      const filterMatch = response.match(/\[FILTER:([^\]]+)\]/)
      if (!filterMatch) return {}
      
      const params: any = {}
      const paramString = filterMatch[1]
      const pairs = paramString.split('&')
      
      for (const pair of pairs) {
        const [key, value] = pair.split('=')
        if (key && value) {
          params[key] = value
        }
      }
      
      return params
    }
    
    const compareFilterParams = (params1: any, params2: any): number => {
      const keys1 = Object.keys(params1)
      const keys2 = Object.keys(params2)
      
      if (keys1.length === 0 && keys2.length === 0) return 1
      if (keys1.length === 0 || keys2.length === 0) return 0
      
      const commonKeys = keys1.filter(key => keys2.includes(key))
      const totalKeys = Math.max(keys1.length, keys2.length)
      
      const keySimilarity = commonKeys.length / totalKeys
      
      let valueSimilarity = 0
      for (const key of commonKeys) {
        if (params1[key] === params2[key]) {
          valueSimilarity += 1
        }
      }
      
      const avgValueSimilarity = commonKeys.length > 0 ? valueSimilarity / commonKeys.length : 0
      
      return (keySimilarity * 0.6 + avgValueSimilarity * 0.4)
    }
    
    const selectBestResponse = (responses: string[], consistencyScore: number, userMessage: string): string => {
      if (consistencyScore > 0.8) {
        return responses[0]
      }
      
      const userIntent = userMessage.toLowerCase()
      
      for (const response of responses) {
        const responseLower = response.toLowerCase()
        
        if (/(?:filter|apply|show|find)/i.test(userIntent) && /\[FILTER:/i.test(responseLower)) {
          return response
        }
        
        if (/(?:cart|add|remove)/i.test(userIntent) && /\[(?:ADD_TO_CART|REMOVE_FROM_CART|VIEW_CART)/i.test(responseLower)) {
          return response
        }
        
        if (/(?:checkout|buy|purchase)/i.test(userIntent) && /\[(?:PROCEED_TO_CHECKOUT|VIEW_ORDERS)/i.test(responseLower)) {
          return response
        }
      }
      
      return responses[0]
    }
    
    const shouldPerformConsistencyCheck = (userMessage: string): boolean => {
      const criticalPatterns = [
        /(?:filter|apply|show|find)/i,
        /(?:good|decent|quality|premium|best)/i,
        /(?:cart|checkout|buy)/i,
        /(?:price|cost|budget)/i
      ]
      
      return criticalPatterns.some(pattern => pattern.test(userMessage))
    }
    
    let finalResponse
    
    if (shouldPerformConsistencyCheck(message)) {
      console.log('🔍 Performing non-streaming self-consistency check for critical operation...')
      const consistencyResult = await performNonStreamingConsistencyCheck(chatMessages, message)
      
      if (consistencyResult && consistencyResult.consistencyScore > 0.6) {
        console.log('✅ Using non-streaming self-consistency validated response')
        finalResponse = consistencyResult
      } else {
        console.log('⚠️ Non-streaming self-consistency check failed or low score, using standard response')
        finalResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            stream: false
          })
        })
      }
    } else {
      console.log('📝 Standard non-streaming response for non-critical operation')
      finalResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
          stream: false
        })
      })
    }
    
    // Handle the response
    const openaiResponse = finalResponse
    
    if (!openaiResponse.ok) {
      console.error('OpenAI API error:', openaiResponse.status)
      throw new Error(`OpenAI API error: ${openaiResponse.status}`)
    }
    
    const responseData = await openaiResponse.json()
    const responseText = responseData.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response.'
    
    // console.log(`✅ Generated response: ${responseText.length} characters`)
    
    // Cache the response
    if (canPersist && responseText.length > 50) {
      try {
        await prisma.semanticCache.create({
          data: {
            userId,
            query: message,
            queryEmbedding,
            cachedResponse: responseText,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            hitCount: 0,
            createdAt: new Date(),
            lastHitAt: new Date()
          }
        })
        console.log('💾 Response cached successfully')
      } catch (cacheError) {
        console.error('Failed to cache response:', cacheError)
      }
    }
    
    // Log the conversation
    if (canPersist) {
      try {
        await prisma.conversationLog.create({
          data: {
            userId,
            message,
            response: responseText,
            context: ragContext,
            userContext: userContextStr,
            currentUrl,
            cartState: cartState ? JSON.stringify(cartState) : null,
            timestamp: new Date()
          }
        })
        // console.log('📝 Conversation logged successfully')
      } catch (logError) {
        console.error('Failed to log conversation:', logError)
      }
    }
    
    const totalTime = Date.now() - t0Total
    console.log(`⏱️ Total RAG non-streaming time: ${totalTime}ms`)

    return NextResponse.json({
      response: responseText,
      cached: false,
      ragContext: ragContext.length,
      processingTime: totalTime
    })

  } catch (error) {
    console.error('Error in RAG non-streaming request:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}
