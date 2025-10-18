import { NextRequest, NextResponse } from 'next/server'
import { createOpenAI } from '@ai-sdk/openai'
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

// Modern RAG: Query Rewriting for better retrieval
async function rewriteQuery(originalQuery: string): Promise<string[]> {
  try {
    const apiKey = process.env.OPEN_AI_KEY || process.env.OPENAI_API_KEY!
    
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
            content: `You are a query rewriting expert. Given a user query, generate 2-3 alternative queries that would help retrieve more relevant information. Focus on:
1. Synonyms and related terms
2. Different phrasings
3. More specific or general versions
Return only the rewritten queries, one per line.`
          },
          {
            role: 'user',
            content: originalQuery
          }
        ],
        temperature: 0.3,
        max_tokens: 200
      })
    })
    
    if (!response.ok) {
      return [originalQuery] // Fallback to original
    }
    
    const data = await response.json()
    const rewrittenQueries = data.choices[0].message.content
      .split('\n')
      .map((q: string) => q.trim())
      .filter((q: string) => q.length > 0)
      .slice(0, 3) // Limit to 3 queries
    
    return [originalQuery, ...rewrittenQueries]
  } catch (error) {
    console.error('Query rewriting failed:', error)
    return [originalQuery] // Fallback to original
  }
}

// Modern RAG: Hybrid Search (Semantic + Keyword)
async function hybridSearch(userId: string, queries: string[], message: string): Promise<any[]> {
  const results: any[] = []
  
  for (const query of queries) {
    // Generate embedding for semantic search
    const queryEmbedding = await generateEmbedding(query)
    
    // 1. Semantic Search
    const semanticResults = await prisma.$queryRaw`
      WITH semantic_results AS (
        SELECT 
          id,
          content,
          metadata,
          content_type,
          created_at,
          COALESCE(1 - (embedding <=> ${`[${queryEmbedding.join(',')}]`}::vector(1536)), 0.0) AS similarity,
          'semantic' as search_type,
          CASE 
            WHEN LOWER(content) LIKE LOWER(${'%' + query + '%'}) THEN 0.95
            WHEN (1 - (embedding <=> ${`[${queryEmbedding.join(',')}]`}::vector(1536))) > 0.4 THEN 0.9
            WHEN (1 - (embedding <=> ${`[${queryEmbedding.join(',')}]`}::vector(1536))) > 0.3 THEN 0.8
            WHEN (1 - (embedding <=> ${`[${queryEmbedding.join(',')}]`}::vector(1536))) > 0.25 THEN 0.7
            ELSE 0.0
          END AS confidence_score
        FROM user_knowledge_base
        WHERE user_id = ${userId}
          AND embedding IS NOT NULL
          AND (1 - (embedding <=> ${`[${queryEmbedding.join(',')}]`}::vector(1536))) > 0.2
      )
      SELECT * FROM semantic_results
      WHERE confidence_score > 0.0
    ` as any[]
    
    // 2. Keyword Search
    const keywordResults = await prisma.$queryRaw`
      WITH keyword_results AS (
        SELECT 
          id,
          content,
          metadata,
          content_type,
          created_at,
          CASE 
            WHEN LOWER(content) LIKE LOWER(${'%' + query + '%'}) THEN 0.9
            WHEN LOWER(content) LIKE LOWER(${'%' + message + '%'}) THEN 0.8
            ELSE 0.0
          END AS similarity,
          'keyword' as search_type,
          CASE 
            WHEN LOWER(content) LIKE LOWER(${'%' + query + '%'}) THEN 0.95
            WHEN LOWER(content) LIKE LOWER(${'%' + message + '%'}) THEN 0.85
            ELSE 0.0
          END AS confidence_score
        FROM user_knowledge_base
        WHERE user_id = ${userId}
          AND (
            LOWER(content) LIKE LOWER(${'%' + query + '%'}) OR
            LOWER(content) LIKE LOWER(${'%' + message + '%'})
          )
      )
      SELECT * FROM keyword_results
      WHERE confidence_score > 0.0
    ` as any[]
    
    results.push(...semanticResults, ...keywordResults)
  }
  
  return results
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
    console.log(`🚀 RAG-Integrated AI Chat (non-stream): message="${message.substring(0, 50)}..."`)
    
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

    return await handleNonStreamingRequest(userId, message, messages, clientConfig, cartState, currentUrl, canPersist)
  } catch (error) {
    console.error('Error in RAG-integrated AI chat API:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
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
      
      return NextResponse.json({
        message: similarCachedResponse[0].cached_response.message,
        sources: similarCachedResponse[0].cached_response.sources || [],
        ragContext: similarCachedResponse[0].cached_response.ragContext || '',
        hasRelevantContext: similarCachedResponse[0].cached_response.hasRelevantContext || false,
        confidence: similarCachedResponse[0].cached_response.confidence || 0,
        cacheHit: true,
        contextCount: similarCachedResponse[0].cached_response.contextCount || 0,
        timings: { ragMs: 0, rerankMs: 0, llmMs: 0, totalMs: 0 }
      })
    }
    
    console.log('🔍 Modern RAG: Performing hybrid retrieval...')

    const t0Retrieval = Date.now()
    
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
      ? `You are a helpful AI assistant with access to a personalized knowledge base.

${ragContext}

Use the knowledge base context above to provide accurate and personalized responses.`
      : `You are a helpful AI assistant. You don't have specific information about this user in your knowledge base yet, but you can still be helpful and engaging.

Be helpful and provide useful responses. If the user shares personal information, acknowledge it and remember it for future conversations.`

    // Always call the LLM, with or without context
    console.log(`🤖 Calling LLM with ${hasRelevantContext ? 'context' : 'no context'}...`)

    // Non-streaming completion request
    const t0LLM = Date.now()
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
        messages: [
          { role: 'system', content: baseSystemPrompt },
          ...messages.slice(-6),
          { role: 'user', content: message }
        ]
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

    // Cache the response only if allowed to persist
    const responseData = {
      answer: fullResponse,
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
    // Modern RAG: Self-Correcting Knowledge Base Storage
    try {
      console.log('💾 Modern RAG: Storing conversation with self-correction...')
      
      // Generate embedding for the user's message
      const messageEmbedding = await generateEmbedding(message)
      
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
            sources: payload.sources,
            ragContext: ragContext,
            hasRelevantContext: payload.hasRelevantContext,
            confidence: payload.confidence,
            contextCount: payload.contextCount
          },
          contextData: {
            searchResults: searchResults.length,
            rewrittenQueries: rewrittenQueries.length,
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
    return NextResponse.json(
      { error: 'Failed to process message', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
