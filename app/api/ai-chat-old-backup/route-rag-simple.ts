import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

export const runtime = 'edge'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { message, messages } = await request.json()
    
    console.log(`🚀 RAG-Optimized AI Chat: message="${message.substring(0, 30)}..."`)
    
    if (!process.env.OPEN_AI_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Get session for user context
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id || 'anonymous'

    // Step 1: Check semantic cache
    const queryHash = require('crypto').createHash('sha256').update(message).digest('hex')
    const cacheResult = await prisma.$queryRaw`
      SELECT id, cached_response, hit_count
      FROM semantic_cache 
      WHERE user_id = ${userId} AND query_hash = ${queryHash}
    `
    
    if (cacheResult.length > 0) {
      console.log('✅ Cache hit - returning cached response')
      const cachedData = typeof cacheResult[0].cached_response === 'string' 
        ? JSON.parse(cacheResult[0].cached_response) 
        : cacheResult[0].cached_response
      
      // Update hit count
      await prisma.$executeRaw`
        UPDATE semantic_cache 
        SET hit_count = hit_count + 1, last_hit = NOW()
        WHERE id = ${cacheResult[0].id}::uuid
      `
      
      return NextResponse.json({
        message: cachedData.answer,
        sources: cachedData.sources || [],
        confidence: cachedData.confidence || 0.8,
        cacheHit: true
      })
    }

    console.log('❌ Cache miss - performing retrieval')

    // Step 2: Generate query embedding (mock for now)
    const queryEmbedding = Array.from({ length: 1536 }, () => Math.random() * 2 - 1)

    // Step 3: Hybrid Search
    const searchResults = await prisma.$queryRaw`
      SELECT 
        id,
        content,
        metadata,
        topics,
        1 - (embedding <=> ${`[${queryEmbedding.join(',')}]`}::vector(1536)) as similarity,
        'semantic' as match_type
      FROM user_knowledge_base
      WHERE user_id = ${userId}
        AND embedding IS NOT NULL
      ORDER BY embedding <=> ${`[${queryEmbedding.join(',')}]`}::vector(1536)
      LIMIT 5
    `

    console.log(`✅ Retrieved ${searchResults.length} relevant documents`)

    // Step 4: Build context
    const context = searchResults.map(r => r.content).join('\n\n')
    const sources = searchResults.map(r => r.metadata?.source || 'Knowledge Base').filter((v, i, a) => a.indexOf(v) === i)

    // Step 5: Generate response using OpenAI
    const openai = require('openai')
    const client = new openai.OpenAI({
      apiKey: process.env.OPEN_AI_KEY,
    })

    const completion = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a helpful AI assistant. Use the following context to answer the user's question. If the context doesn't contain relevant information, say so politely.

Context:
${context}

Answer the user's question based on the context above.`
        },
        {
          role: 'user',
          content: message
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    })

    const response = completion.choices[0].message.content

    // Step 6: Cache the response
    const mockResponse = {
      answer: response,
      sources: sources,
      confidence: 0.85,
      context: searchResults.map(r => ({ content: r.content, score: r.similarity }))
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    await prisma.$executeRaw`
      INSERT INTO semantic_cache (user_id, query_hash, query_embedding, cached_response, expires_at)
      VALUES (${userId}, ${queryHash}, ${`[${queryEmbedding.join(',')}]`}::vector(1536), ${JSON.stringify(mockResponse)}::jsonb, ${expiresAt})
    `

    console.log('✅ Response generated and cached')

    return NextResponse.json({
      message: response,
      sources: sources,
      confidence: 0.85,
      cacheHit: false,
      contextCount: searchResults.length
    })

  } catch (error) {
    console.error('Error in RAG-optimized AI chat API:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
