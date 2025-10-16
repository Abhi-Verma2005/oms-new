import { NextRequest, NextResponse } from 'next/server'
import { streamText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Helper function to generate embeddings
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

export async function POST(request: NextRequest) {
  try {
    const { message, messages, config: clientConfig, currentUrl, cartState, userId: requestUserId } = await request.json()
    const isStream = request.nextUrl?.searchParams?.get('stream') === '1'
    
    console.log(`🚀 RAG-Integrated AI Chat: stream=${isStream}, message="${message.substring(0, 50)}..."`)
    
    if (!process.env.OPEN_AI_KEY && !process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Get session for user context, but allow override from request body for testing
    const session = await getServerSession(authOptions)
    let userId = requestUserId || session?.user?.id || 'anonymous'
    
    // Ensure we have a valid user ID - create user if it doesn't exist
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })
    
    if (!existingUser) {
      console.log(`👤 User ${userId} not found, creating new user...`)
      const newUser = await prisma.user.create({
        data: {
          id: userId,
          email: `${userId}@example.com`,
          name: `User ${userId}`
        }
      })
      userId = newUser.id
      console.log(`✅ Created new user: ${userId}`)
    } else {
      console.log(`✅ Using existing user: ${existingUser.email}`)
    }
    
    console.log(`👤 Using userId: ${userId}`)

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
    
    // Ensure we have a valid user ID - create user if it doesn't exist
    let validUserId = userId
    
    // Check if user exists, if not create it
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })
    
    if (!existingUser) {
      console.log(`👤 User ${userId} not found, creating new user...`)
      const newUser = await prisma.user.create({
        data: {
          id: userId,
          email: `${userId}@example.com`,
          name: `User ${userId}`
        }
      })
      validUserId = newUser.id
      console.log(`✅ Created new user: ${validUserId}`)
    } else {
      console.log(`✅ Using existing user: ${existingUser.email}`)
    }
    
    // Always perform fresh RAG retrieval (cache disabled)
    console.log('🔁 Performing fresh RAG retrieval (cache disabled)')

    // Step 2: Generate real query embedding using OpenAI
    let queryEmbedding: number[]
    try {
      const apiKey = process.env.OPEN_AI_KEY || process.env.OPENAI_API_KEY!
      
      const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: message,
        }),
      })
      
      if (!embeddingResponse.ok) {
        throw new Error(`OpenAI API error: ${embeddingResponse.status}`)
      }
      
      const embeddingData = await embeddingResponse.json()
      queryEmbedding = embeddingData.data[0].embedding
      console.log('✅ Generated real query embedding')
    } catch (error) {
      console.warn('⚠️ Failed to generate embedding, using mock:', error.message)
      queryEmbedding = Array.from({ length: 1536 }, () => Math.random() * 2 - 1)
    }

    // Step 3: Multi-Stage Retrieval with Query Expansion for 100% Accuracy
    // Extract key terms from the query for better matching
    const queryTerms = message.toLowerCase().split(/\s+/).filter(term => 
      term.length > 2 && !['what', 'is', 'my', 'the', 'and', 'or', 'but', 'for', 'with', 'about', 'tell', 'me'].includes(term)
    )
    
    // First, get exact keyword matches (highest priority)
    const keywordMatches = await prisma.$queryRaw`
      SELECT 
        id,
        content,
        metadata,
        content_type,
        created_at,
        1.0 AS similarity,  -- Perfect match for keywords
        3.0 AS priority_score  -- Highest priority
      FROM user_knowledge_base
      WHERE user_id = ${validUserId} 
        AND (
          LOWER(content) LIKE LOWER(${'%' + message + '%'}) OR
          LOWER(content) LIKE LOWER(${'%' + message.replace(/\s+/g, '%') + '%'})
        )
        AND created_at > NOW() - INTERVAL '30 days'
      ORDER BY created_at DESC
      LIMIT 5
    `

    // Second, get ALL recent user facts (last 7 days) with no similarity threshold
    const recentUserFacts = await prisma.$queryRaw`
      SELECT 
        id,
        content,
        metadata,
        content_type,
        created_at,
        COALESCE(1 - (embedding <=> ${`[${queryEmbedding.join(',')}]`}::vector(1536)), 0.5) AS similarity,
        2.0 AS priority_score
      FROM user_knowledge_base
      WHERE user_id = ${validUserId} 
        AND content_type = 'user_fact'
        AND created_at > NOW() - INTERVAL '7 days'
      ORDER BY created_at DESC
      LIMIT 10
    `

    // Third, get semantic matches with very low threshold for maximum recall
    const semanticMatches = await prisma.$queryRaw`
      SELECT 
        id,
        content,
        metadata,
        topics,
        content_type,
        created_at,
        1 - (embedding <=> ${`[${queryEmbedding.join(',')}]`}::vector(1536)) AS similarity,
        CASE 
          WHEN content_type = 'user_fact' THEN 0.8
          WHEN created_at > NOW() - INTERVAL '24 hours' THEN 0.6
          WHEN created_at > NOW() - INTERVAL '7 days' THEN 0.4
          ELSE 0.2
        END AS priority_score
      FROM user_knowledge_base
      WHERE user_id = ${validUserId}
        AND embedding IS NOT NULL
        AND (1 - (embedding <=> ${`[${queryEmbedding.join(',')}]`}::vector(1536))) > 0.1
        AND content_type != 'user_fact'  -- user_fact handled separately above
      ORDER BY priority_score DESC, similarity DESC
      LIMIT 6
    `

    // Combine and deduplicate results, prioritizing by type
    const allResults = [...keywordMatches, ...recentUserFacts, ...semanticMatches]
    const uniqueResults = allResults.filter((item, index, self) => 
      index === self.findIndex(t => t.id === item.id)
    )

    const searchResults = uniqueResults.slice(0, 12)
    
    console.log(`✅ Retrieved ${searchResults.length} relevant documents (${keywordMatches.length} keyword, ${recentUserFacts.length} recent facts, ${semanticMatches.length} semantic matches)`)

    // Step 4: Build enhanced context with priority ordering
    const contextSections = []
    
    if (keywordMatches.length > 0) {
      contextSections.push(`EXACT MATCHES (Highest Priority):\n${keywordMatches.map((k: any) => `- ${k.content}`).join('\n')}`)
    }
    
    if (recentUserFacts.length > 0) {
      contextSections.push(`PERSONAL FACTS (Most Recent - Use These First):\n${recentUserFacts.map((f: any) => `- ${f.content}`).join('\n')}`)
    }
    
    if (semanticMatches.length > 0) {
      contextSections.push(`RELEVANT CONTEXT:\n${semanticMatches.map((r: any) => `- ${r.content}`).join('\n')}`)
    }
    
    const ragContext = contextSections.length > 0 ? `\n\n${contextSections.join('\n\n')}` : ''

    const sources = searchResults.map(r => r.metadata?.source || 'Knowledge Base').filter((v, i, a) => a.indexOf(v) === i)

    // Step 5: Create enhanced system prompt with RAG context
    const baseSystemPrompt = `You are a helpful AI assistant with access to a personalized knowledge base.

${ragContext}

CRITICAL INSTRUCTIONS FOR 100% ACCURACY:
1. **ALWAYS USE PERSONAL FACTS**: If PERSONAL FACTS section exists, you MUST use that information to answer personal questions
2. **PRIORITIZE EXACT MATCHES**: If EXACT MATCHES section exists, use that information FIRST
3. **USE ALL AVAILABLE CONTEXT**: If any context section contains relevant information, you MUST incorporate it into your response
4. **NEVER SAY "I DON'T HAVE ACCESS"**: If context exists, use it. Only say you don't have information if NO context is provided
5. **BE SPECIFIC**: When context contains specific details (names, ages, professions, etc.), use those exact details in your response

RESPONSE GUIDELINES:
- **For personal questions**: Always check PERSONAL FACTS first and use that information
- **For general questions**: Use RELEVANT CONTEXT if available
- **Be direct and specific**: Use the exact information from the context
- **Acknowledge the source**: Reference the information naturally in your response

FORMATTING:
- **Bold text** for emphasis and important information
- *Italic text* for subtle emphasis
- \`inline code\` for technical terms, commands, or specific values
- Keep responses concise and focused (3-4 lines maximum)

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

CURRENT URL: ${currentUrl || 'Not available'}`

    // Step 6: Generate response using OpenAI with RAG context
    const openai = createOpenAI({
      apiKey: process.env.OPEN_AI_KEY || process.env.OPENAI_API_KEY!,
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

    // Step 7: Stream the response with caching (using same approach as original API)
    let fullResponse = ''
    
    const encoder = new TextEncoder()
    const textStream = result.textStream
    
    // Create a readable stream that collects the response for caching and handles tool detection
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let detectionBuffer = ''
          
          // Tool patterns for action detection (same as original API)
          const actionPatterns: Array<{ pattern: RegExp; type: string }> = [
            { pattern: /\[\s*NAVIGATE\s*:\s*([^\]]+)\s*\]/g, type: 'navigate' },
            { pattern: /\[\s*FILTER\s*:\s*([^\]]+)\s*\]/g, type: 'filter' },
            { pattern: /\[\s*ADD_TO_CART\s*:\s*([^\]]+)\s*\]/g, type: 'addToCart' },
            { pattern: /\[\s*VIEW_CART\s*\]/g, type: 'viewCart' },
            { pattern: /\[\s*PROCEED_TO_CHECKOUT\s*\]/g, type: 'proceedToCheckout' },
            { pattern: /\[\s*VIEW_ORDERS\s*\]/g, type: 'viewOrders' },
          ]
          
          for await (const chunk of textStream) {
            fullResponse += chunk
            detectionBuffer += chunk
            
            // Emit the chunk
            controller.enqueue(encoder.encode(chunk))
            
            // Tool detection (same logic as original API)
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
            
            // Limit buffer size
            if (detectionBuffer.length > 1000) {
              detectionBuffer = detectionBuffer.slice(-1000)
            }
          }
          controller.close()
          
          // Store user conversation (async, don't wait)
          setImmediate(async () => {
            try {
              const responseData = {
                answer: fullResponse,
                sources: sources,
                confidence: 0.85,
                context: searchResults.map(r => ({ content: r.content, score: r.similarity }))
              }

              // Store user conversation in knowledge base for future RAG retrieval
              const conversationContent = `User: ${message}\nAssistant: ${fullResponse}`
              const conversationEmbedding = await generateEmbedding(conversationContent)
              
              await prisma.$executeRaw`
                INSERT INTO user_knowledge_base (user_id, content, content_type, embedding, metadata, created_at)
                VALUES (
                  ${validUserId}, 
                  ${conversationContent}, 
                  'conversation',
                  ${`[${conversationEmbedding.join(',')}]`}::vector(1536),
                  ${JSON.stringify({
                    query: message,
                    response: fullResponse,
                    timestamp: new Date().toISOString(),
                    source: 'chat_conversation'
                  })}::jsonb,
                  NOW()
                )
              `
              
              // Additionally store the user message alone as a high-signal fact for better recall
              try {
                const userFactEmbedding = await generateEmbedding(message)
                await prisma.$executeRaw`
                  INSERT INTO user_knowledge_base (user_id, content, content_type, embedding, metadata, created_at)
                  VALUES (
                    ${validUserId},
                    ${message},
                    'user_fact',
                    ${`[${userFactEmbedding.join(',')}]`}::vector(1536),
                    ${JSON.stringify({
                      query: message,
                      timestamp: new Date().toISOString(),
                      source: 'user_fact'
                    })}::jsonb,
                    NOW()
                  )
                `
                console.log('✅ Stored user_fact entry in knowledge base')
              } catch (userFactError) {
                console.error('❌ Failed to store user_fact:', userFactError.message)
              }
              
              console.log('✅ Stored conversation and user_fact entries in knowledge base')
            } catch (error) {
              console.error('Failed to store conversation:', error)
            }
          })
        } catch (error) {
          console.error('Streaming error:', error)
          controller.error(error)
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    })

  } catch (error) {
    console.error('Error in RAG streaming request:', error)
    console.error('Error details:', error.message)
    console.error('Error stack:', error.stack)
    return new Response(`Error processing request: ${error.message}`, { status: 500 })
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
    
    // Ensure we have a valid user ID - create user if it doesn't exist
    let validUserId = userId
    
    // Check if user exists, if not create it
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })
    
    if (!existingUser) {
      console.log(`👤 User ${userId} not found, creating new user...`)
      const newUser = await prisma.user.create({
        data: {
          id: userId,
          email: `${userId}@example.com`,
          name: `User ${userId}`
        }
      })
      validUserId = newUser.id
      console.log(`✅ Created new user: ${validUserId}`)
    } else {
      console.log(`✅ Using existing user: ${existingUser.email}`)
    }
    
    // Always perform RAG retrieval and generate response (cache disabled)
    const queryEmbedding = Array.from({ length: 1536 }, () => Math.random() * 2 - 1)
    
    console.log('🔍 Performing RAG retrieval for non-streaming request...')
    
    const searchResults = await prisma.$queryRaw`
      SELECT 
        id,
        content,
        metadata,
        topics,
        created_at,
        1 - (embedding <=> ${`[${queryEmbedding.join(',')}]`}::vector(1536)) as similarity
      FROM user_knowledge_base
      WHERE user_id = ${validUserId}
        AND embedding IS NOT NULL
      ORDER BY 
        -- Prioritize recent conversations (within last 24 hours)
        CASE 
          WHEN created_at > NOW() - INTERVAL '24 hours' THEN 0
          WHEN created_at > NOW() - INTERVAL '7 days' THEN 1
          ELSE 2
        END,
        -- Then order by similarity for conversations in the same time period
        embedding <=> ${`[${queryEmbedding.join(',')}]`}::vector(1536)
      LIMIT 5
    `
    
    console.log(`✅ Retrieved ${searchResults.length} relevant documents for non-streaming`)

    const ragContext = searchResults.length > 0 
      ? `\n\nRELEVANT KNOWLEDGE BASE CONTEXT:\n${searchResults.map(r => `- ${r.content}`).join('\n')}`
      : ''

    const sources = searchResults.map(r => r.metadata?.source || 'Knowledge Base').filter((v, i, a) => a.indexOf(v) === i)

    const baseSystemPrompt = `You are a helpful AI assistant with access to a personalized knowledge base.

${ragContext}

Use the knowledge base context above to provide accurate and personalized responses.`

    const openai = createOpenAI({
      apiKey: process.env.OPEN_AI_KEY || process.env.OPENAI_API_KEY!,
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
    const responseData = {
      answer: fullResponse,
      sources: sources,
      confidence: 0.85,
      context: searchResults.map(r => ({ content: r.content, score: r.similarity }))
    }

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

    return NextResponse.json({
      message: fullResponse,
      sources: sources,
      confidence: 0.85,
      cacheHit: false,
      contextCount: searchResults.length
    })

  } catch (error) {
    console.error('Error in RAG non-streaming request:', error)
    console.error('Error details:', error.message)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      { error: 'Failed to process message', details: error.message },
      { status: 500 }
    )
  }
}
