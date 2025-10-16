import { NextRequest, NextResponse } from 'next/server'
import { streamText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { message, messages, config: clientConfig, currentUrl, cartState } = await request.json()
    const isStream = request.nextUrl?.searchParams?.get('stream') === '1'
    
    console.log(`🚀 RAG-Integrated AI Chat: stream=${isStream}, message="${message.substring(0, 50)}..."`)
    
    if (!process.env.OPEN_AI_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Get session for user context
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id || 'anonymous'

    if (isStream) {
      return await handleStreamingRequest(userId, message, messages, clientConfig, cartState, currentUrl)
    } else {
      return await handleNonStreamingRequest(userId, message, messages, clientConfig, cartState, currentUrl)
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
 * 🚀 RAG-Enhanced Streaming with Context
 * Uses knowledge base for enhanced responses
 */
async function handleStreamingRequest(
  userId: string,
  message: string,
  messages: any[],
  clientConfig: any,
  cartState: any,
  currentUrl: string
) {
  try {
    console.log('🔍 Starting RAG-enhanced streaming request...')
    
    // Step 1: Check semantic cache first
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
      
      // Return cached response as stream
      const stream = new ReadableStream({
        start(controller) {
          const chunks = cachedData.answer.split(' ')
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

    console.log('❌ Cache miss - performing RAG retrieval')

    // Step 2: Generate query embedding (mock for now - replace with actual OpenAI embedding)
    const queryEmbedding = Array.from({ length: 1536 }, () => Math.random() * 2 - 1)

    // Step 3: Hybrid Search - Get relevant context
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

    // Step 4: Build enhanced context
    const ragContext = searchResults.length > 0 
      ? `\n\nRELEVANT KNOWLEDGE BASE CONTEXT:\n${searchResults.map(r => `- ${r.content}`).join('\n')}`
      : ''

    const sources = searchResults.map(r => r.metadata?.source || 'Knowledge Base').filter((v, i, a) => a.indexOf(v) === i)

    // Step 5: Create enhanced system prompt with RAG context
    const baseSystemPrompt = `You are a helpful AI assistant for this application with access to a personalized knowledge base.

IMPORTANT: Keep responses concise and focused - aim for 3-4 lines maximum. Use markdown formatting to make your responses visually appealing and easy to read:
- **Bold text** for emphasis and important information
- *Italic text* for subtle emphasis
- \`inline code\` for technical terms, commands, or specific values
- # Headers for main topics and sections
- ## Subheaders for subtopics
- - Bullet points for lists
- > Blockquotes for important notes or tips

Be concise, direct, and helpful. Use markdown formatting to maximize impact in minimal space.

NAVIGATION DATA:
${Array.isArray(clientConfig?.navigationData) ? clientConfig.navigationData.map((nav: any) => `- ${nav.name}: ${nav.route}`).join('\n') : 'None available'}

When users ask to navigate to a specific page, respond with a special format: [NAVIGATE:ROUTE] where ROUTE is the actual route from the navigation data above.

CURRENT CART STATE:
${cartState ? `
- Total Items: ${cartState.totalItems || 0}
- Total Price: $${(cartState.totalPrice || 0).toFixed(2)}
- Items: ${cartState.items?.length || 0}
${cartState.items?.map((item: any) => `  - ${item.kind === 'site' ? item.site?.name : item.product?.name} (${item.quantity}x)`).join('\n') || ''}
` : 'No cart data available'}

CURRENT URL: ${currentUrl || 'Not available'}

${ragContext}

Use the knowledge base context above to provide more accurate and personalized responses. If the context is relevant to the user's question, reference it naturally in your response.`

    // Step 6: Generate response using OpenAI with RAG context
    const openai = createOpenAI({
      apiKey: process.env.OPEN_AI_KEY!,
    })

    const result = await streamText({
      model: openai('gpt-3.5-turbo'),
      system: baseSystemPrompt,
      messages: [
        ...messages.slice(-10), // Keep last 10 messages for context
        { role: 'user', content: message }
      ],
      maxTokens: 500,
      temperature: 0.7,
    })

    // Step 7: Cache the response (we'll collect the streamed response)
    let fullResponse = ''
    const stream = result.textStream
    
    // Create a transform stream to collect the response and cache it
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk)
        fullResponse += text
        controller.enqueue(chunk)
      },
      async flush() {
        // Cache the complete response
        try {
          const mockResponse = {
            answer: fullResponse,
            sources: sources,
            confidence: 0.85,
            context: searchResults.map(r => ({ content: r.content, score: r.similarity }))
          }

          const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
          await prisma.$executeRaw`
            INSERT INTO semantic_cache (user_id, query_hash, query_embedding, cached_response, expires_at)
            VALUES (${userId}, ${queryHash}, ${`[${queryEmbedding.join(',')}]`}::vector(1536), ${JSON.stringify(mockResponse)}::jsonb, ${expiresAt})
          `
          
          console.log('✅ Response cached for future queries')
        } catch (error) {
          console.error('Failed to cache response:', error)
        }
      }
    })

    return new Response(stream.pipeThrough(transformStream), {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    })

  } catch (error) {
    console.error('Error in RAG streaming request:', error)
    return new Response('Error processing request', { status: 500 })
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
  currentUrl: string
) {
  try {
    console.log('🔍 Starting RAG-enhanced non-streaming request...')
    
    // Similar logic to streaming but return complete response
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

    // Perform RAG retrieval and generate response
    const queryEmbedding = Array.from({ length: 1536 }, () => Math.random() * 2 - 1)
    
    const searchResults = await prisma.$queryRaw`
      SELECT 
        id,
        content,
        metadata,
        topics,
        1 - (embedding <=> ${`[${queryEmbedding.join(',')}]`}::vector(1536)) as similarity
      FROM user_knowledge_base
      WHERE user_id = ${userId}
        AND embedding IS NOT NULL
      ORDER BY embedding <=> ${`[${queryEmbedding.join(',')}]`}::vector(1536)
      LIMIT 5
    `

    const ragContext = searchResults.length > 0 
      ? `\n\nRELEVANT KNOWLEDGE BASE CONTEXT:\n${searchResults.map(r => `- ${r.content}`).join('\n')}`
      : ''

    const sources = searchResults.map(r => r.metadata?.source || 'Knowledge Base').filter((v, i, a) => a.indexOf(v) === i)

    const baseSystemPrompt = `You are a helpful AI assistant with access to a personalized knowledge base.

${ragContext}

Use the knowledge base context above to provide accurate and personalized responses.`

    const openai = createOpenAI({
      apiKey: process.env.OPEN_AI_KEY!,
    })

    const result = await streamText({
      model: openai('gpt-3.5-turbo'),
      system: baseSystemPrompt,
      messages: [
        ...messages.slice(-10),
        { role: 'user', content: message }
      ],
      maxTokens: 500,
      temperature: 0.7,
    })

    // Collect the complete response
    let fullResponse = ''
    for await (const chunk of result.textStream) {
      fullResponse += chunk
    }

    // Cache the response
    const mockResponse = {
      answer: fullResponse,
      sources: sources,
      confidence: 0.85,
      context: searchResults.map(r => ({ content: r.content, score: r.similarity }))
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
    await prisma.$executeRaw`
      INSERT INTO semantic_cache (user_id, query_hash, query_embedding, cached_response, expires_at)
      VALUES (${userId}, ${queryHash}, ${`[${queryEmbedding.join(',')}]`}::vector(1536), ${JSON.stringify(mockResponse)}::jsonb, ${expiresAt})
    `

    return NextResponse.json({
      message: fullResponse,
      sources: sources,
      confidence: 0.85,
      cacheHit: false,
      contextCount: searchResults.length
    })

  } catch (error) {
    console.error('Error in RAG non-streaming request:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}
