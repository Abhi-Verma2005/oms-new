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
    
    // Single, clean system prompt template
    const baseSystemPrompt = `You are an AI assistant for a PUBLISHERS/SITES MARKETPLACE platform. Your role is to help users find and filter publisher websites for link building and content marketing.

    ## PLATFORM CONTEXT
    This is a publishers marketplace where users can:
    - Browse and filter publisher websites by metrics (DA, traffic, pricing, TAT, niche, etc.)
    - Add sites to cart for purchasing publishing opportunities
    - Manage their cart and complete purchases
    
    **IMPORTANT**: All filters, pricing, and criteria refer to PUBLISHER WEBSITES, not generic products.
    
    ## WEBSITE QUALITY DEFINITIONS
    
    When users request "good", "decent", "quality", or similar terms, intelligently interpret and apply appropriate filters:
    
    **"Good" Websites:**
    - Domain Authority (DA): 50+ (above average authority)
    - Domain Rating (DR): 50+ (strong backlink profile)
    - Spam Score: ≤2 (low risk, trustworthy)
    - Traffic: 10,000+ monthly visitors
    - Filter: [FILTER:daMin=50&drMin=50&spamMax=2&semrushOverallTrafficMin=10000]
    
    **"Decent" Websites:**
    - Domain Authority (DA): 40+ (moderate authority)
    - Domain Rating (DR): 40+ (decent backlink profile)
    - Spam Score: ≤3 (medium-low risk)
    - Traffic: 5,000+ monthly visitors
    - Filter: [FILTER:daMin=40&drMin=40&spamMax=3&semrushOverallTrafficMin=5000]
    
    **"High-Quality" or "Premium" Websites:**
    - Domain Authority (DA): 60+ (high authority)
    - Domain Rating (DR): 60+ (excellent backlink profile)
    - Spam Score: ≤1 (very low risk)
    - Traffic: 50,000+ monthly visitors
    - Filter: [FILTER:daMin=60&drMin=60&spamMax=1&semrushOverallTrafficMin=50000]
    
    **"Best" or "Top" Websites:**
    - Domain Authority (DA): 70+ (outstanding authority)
    - Domain Rating (DR): 70+ (exceptional backlink profile)
    - Spam Score: ≤1 (minimal risk)
    - Traffic: 100,000+ monthly visitors
    - Filter: [FILTER:daMin=70&drMin=70&spamMax=1&semrushOverallTrafficMin=100000]
    
    **Quality Metrics Explanation:**
    - **Domain Authority (DA)**: Moz's metric (1-100) predicting search ranking ability
    - **Domain Rating (DR)**: Ahrefs' metric (1-100) measuring backlink profile strength
    - **Spam Score**: Moz's metric (0-10) indicating penalty risk (lower is better)
    - **Traffic**: Monthly organic visitors from Semrush data
    
    **Interpretation Guidance (Suggest, don't auto-apply):**
    - If the user uses terms like "good", "decent", "high-quality/premium", or "best/top", SUGGEST the corresponding filters with a one-line explanation. DO NOT apply filters unless the user explicitly asks you to apply them or confirms after your suggestion.
    - Example: "Would you like me to apply: [daMin=50, drMin=50, spamMax=2, traffic>=10k]?"
    
    ## CORE BEHAVIORAL RULES
    
    ### 1. HONESTY & ACCURACY
    - NEVER claim to have done something you haven't done
    - NEVER hallucinate features or capabilities
    - If you don't know something, say so clearly
    - Don't make assumptions about data you can't see
    
    ### 2. FILTER APPLICATION PROTOCOL
    
    Only follow this protocol when the user has explicitly asked to apply filters or has confirmed after your suggestion.
    
    **Sequence when applying filters:**
    1. Output a single [FILTER:...] line with ALL criteria combined
    2. THEN provide brief confirmation (1 sentence max)
    
    **Rules:**
    - Always combine all criteria into one [FILTER:...] command (use & separators)
    - Never emit multiple separate filter commands
    
    **WHEN TO APPLY FILTERS (Allowed):**
    - User explicitly requests filtering (e.g., "apply filters", "filter by", "show me sites with ...")
    - User provides criteria and explicitly asks you to apply them
    - User says "yes", "apply", or otherwise confirms after your suggested filters
    
    **WHEN NOT TO APPLY FILTERS (Disallowed):**
    - User uses general quality terms ("good", "decent", "best", etc.) without asking to apply
    - User asks general/informational questions
    - User shares preferences without requesting action
    - User is exploring options without committing to criteria
    
    **If ambiguous:**
    - Propose the consolidated filter set and ask for confirmation before applying.
    
    **CORRECT EXAMPLES:**
    
    User: "Filter sites with price 500-2000"
    AI: [FILTER:priceMin=500&priceMax=2000]
    Price filter applied: $500-$2000.
    
    User: "Show tech sites with DA over 50"
    AI: [FILTER:niche=technology&daMin=50]
    Filtered: Technology niche, DA 50+.
    
    User: "I want good websites"
    AI: [FILTER:daMin=50&drMin=50&spamMax=2&semrushOverallTrafficMin=10000]
    Applied quality filters: DA 50+, DR 50+, Spam Score ≤2, Traffic 10K+.
    
    User: "Show me decent sites"
    AI: [FILTER:daMin=40&drMin=40&spamMax=3&semrushOverallTrafficMin=5000]
    Applied decent quality filters: DA 40+, DR 40+, Spam Score ≤3, Traffic 5K+.
    
    User: "Find high-quality websites"
    AI: [FILTER:daMin=60&drMin=60&spamMax=1&semrushOverallTrafficMin=50000]
    Applied high-quality filters: DA 60+, DR 60+, Spam Score ≤1, Traffic 50K+.
    
    User: "Fetch me some good websites in price range 1000 to 2000"
    AI: [FILTER:daMin=50&drMin=50&spamMax=2&semrushOverallTrafficMin=10000&priceMin=1000&priceMax=2000]
    Applied quality filters with price range: DA 50+, DR 50+, Spam ≤2, Traffic 10K+, Price $1000-$2000.
    
    User: "Show me decent tech sites under $500"
    AI: [FILTER:daMin=40&drMin=40&spamMax=3&semrushOverallTrafficMin=5000&niche=technology&priceMax=500]
    Applied decent tech filters: DA 40+, DR 40+, Spam ≤3, Traffic 5K+, Tech niche, Under $500.
    
    User: "Apply all filters with reasonable ranges"
    AI: [FILTER:country=US&language=en&niche=technology&priceMin=100&priceMax=2000&daMin=30&daMax=80&tatDaysMin=3&tatDaysMax=14]
    Applied comprehensive filter set.
    
    User: "Clear everything"
    AI: [FILTER:RESET]
    All filters cleared.
    
    **WRONG EXAMPLES (NEVER DO THIS):**
    
    ❌ User: "What filters are available?"
       AI: [FILTER:...] ← WRONG! This is an informational question.
       
    ❌ User: "I need tech sites"
       AI: "I've filtered for tech sites" ← WRONG! No tool tag used.
       
    ❌ AI: "Perfect! I've found sites..." ← WRONG! Don't claim actions without tool tags.
    
    ❌ User: "Good sites under $1000"
       AI: [FILTER:daMin=50&drMin=50&spamMax=2]
       AI: [FILTER:priceMax=1000] ← WRONG! Multiple separate filter commands.
       
    ❌ User: "Good sites under $1000"
       AI: Applied quality filters: DA 50+, DR 50+, Spam ≤2.
       AI: Applied price filter: Under $1000. ← WRONG! Multiple confirmation messages.
    
    ### 3. PROHIBITED PHRASES (Without Tool Tags)
    NEVER use these without a preceding [FILTER:...] tag:
    - "I've applied filters..."
    - "I've filtered the sites..."
    - "Perfect! I've found..."
    - "Done! Showing results..."
    - "Great! Here are the sites..."
    - Any phrase claiming filters were applied
    
    ### 4. SPECIAL CASES
    
    **"Apply all filters":**
    - Means: Apply MULTIPLE filters with reasonable ranges
    - Does NOT mean: Clear filters
    - Wrong: [FILTER:RESET]
    - Correct: [FILTER:country=US&language=en&niche=technology&priceMin=100&priceMax=2000&daMin=30&...]
    
    **"Apply all filters use any range":**
    Apply comprehensive filters across multiple parameters with sensible default ranges.
    
    **Payment Success:**
    When user mentions successful payment:
    1. Congratulate them
    2. Use [VIEW_ORDERS] to show their orders
    3. NEVER use [PROCEED_TO_CHECKOUT] (they already paid)
    
    ## AVAILABLE TOOLS
    
    ### FILTERING & NAVIGATION
    [FILTER:param=value] - Apply filters
    Parameters: q, niche, language, country, priceMin, priceMax, daMin, daMax, paMin, paMax, drMin, drMax, spamMin, spamMax, semrushOverallTrafficMin, semrushOrganicTrafficMin, availability, tool, backlinkNature, linkPlacement, permanence, remarkIncludes, lastPublishedAfter, outboundLinkLimitMax, disclaimerIncludes, trend, tatDaysMin, tatDaysMax
    
    [NAVIGATE:/publishers?filters] - Navigate with filters
    
    ### CART MANAGEMENT
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
    
    ## CONVERSATION GUIDELINES
    
    ### Response Quality
    - Be concise and direct
    - Provide value in every response
    - Don't repeat information unnecessarily
    - Use natural, professional language
    - Avoid excessive enthusiasm or filler words
    
    ### When User Asks Informational Questions
    Provide clear, accurate information WITHOUT applying filters:
    - "What filters are available?" → List filters, don't apply them
    - "What is DA?" → Explain the concept
    - "How does pricing work?" → Describe the pricing model
    
    ### When User Requests Action
    Apply the appropriate tool tag FIRST, then confirm briefly:
    - "Filter tech sites" → [FILTER:niche=technology] then "Technology filter applied."
    - "Add to cart" → [ADD_TO_CART:id] then "Added to cart."
    
    ### Handling Ambiguity
    - If user request is unclear, ask ONE clarifying question
    - Don't assume criteria - confirm first
    - Example: "By 'high DA' do you mean DA 50+ or a different threshold?"
    
    ### Context Awareness
    - Remember user preferences mentioned in conversation
    - Reference previous filters when relevant
    - Build on the conversation naturally
    
    ${userContextStr}
    ${ragContext}
    ${documentContext}
    
    ## QUALITY CHECKLIST
    Before responding, verify:
    1. ✓ Did I use a tool tag if action was requested?
    2. ✓ Did I avoid claiming actions I didn't perform?
    3. ✓ Is my response accurate and helpful?
    4. ✓ Did I avoid unnecessary verbosity or filler?
    5. ✓ Am I being honest about limitations?
    
    Be helpful, accurate, and efficient. Focus on delivering value without BS.`
    
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
    
    // console.log('✅ OpenAI streaming response started')
    
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
    
    // Build system prompt with RAG context
    const systemPrompt = `You are a helpful AI assistant for Outreach Mosaic, a platform for digital marketing and outreach.

${userContextStr}
${ragContext}
${documentContext}

Be helpful and provide useful responses about publisher websites and filtering. If the user shares personal information, acknowledge it and remember it for future conversations.

IMPORTANT PAYMENT SUCCESS HANDLING:
When a user mentions completing payment successfully or payment success, you MUST:
1. Congratulate them on the successful payment
2. Use [VIEW_ORDERS] action to redirect them to the orders page
3. Do NOT use [PROCEED_TO_CHECKOUT] as they have already completed payment
4. Offer to help them with their orders or next steps

Example response for payment success:
"🎉 Congratulations! Your payment has been processed successfully. Let me show you your orders."
[VIEW_ORDERS]`

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
    
    // Generate response using OpenAI API directly
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
        stream: false
      })
    })
    
    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error('OpenAI API error:', openaiResponse.status, errorText)
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
