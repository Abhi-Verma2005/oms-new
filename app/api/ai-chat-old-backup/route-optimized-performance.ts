import { NextRequest, NextResponse } from 'next/server'
import { streamText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { AIPerformanceOptimizer, PerformanceMonitor } from '@/lib/ai-performance-optimizer'

export async function POST(request: NextRequest) {
  try {
    const { message, messages, config: clientConfig, currentUrl, cartState, userId: requestUserId } = await request.json()
    const isStream = request.nextUrl?.searchParams?.get('stream') === '1'
    
    console.log(`🚀 Optimized AI Chat: stream=${isStream}, message="${message.substring(0, 50)}..."`)
    
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
      return await handleOptimizedStreamingRequest(userId, message, messages, clientConfig, cartState, currentUrl)
    } else {
      return await handleOptimizedNonStreamingRequest(userId, message, messages, clientConfig, cartState, currentUrl)
    }
  } catch (error) {
    console.error('Error in optimized AI chat API:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}

/**
 * 🚀 Optimized Streaming Request with Performance Monitoring
 */
async function handleOptimizedStreamingRequest(
  userId: string,
  message: string,
  messages: any[],
  clientConfig: any,
  cartState: any,
  currentUrl: string
) {
  return await PerformanceMonitor.measureOperation(
    'optimized_streaming_request',
    async () => {
      console.log('🔍 Starting optimized streaming request...')
      
      // Step 1: Generate cached embedding
      const queryEmbedding = await AIPerformanceOptimizer.getCachedEmbedding(message)
      console.log('✅ Generated cached query embedding')

      // Step 2: Perform optimized RAG query
      const searchResults = await AIPerformanceOptimizer.performOptimizedRAGQuery(
        userId,
        queryEmbedding,
        message,
        6 // Reduced from 8 for faster processing
      )
      
      console.log(`✅ Retrieved ${searchResults.length} relevant documents`)

      // Step 3: Build optimized context
      const ragContext = searchResults.length > 0 
        ? `\n\nRELEVANT KNOWLEDGE BASE CONTEXT:\n${searchResults.map((r: any) => `- ${r.content}`).join('\n')}`
        : ''

      const sources = searchResults.map((r: any) => r.metadata?.source || 'Knowledge Base').filter((v, i, a) => a.indexOf(v) === i)

      // Step 4: Create optimized system prompt
      const baseSystemPrompt = `You are a helpful AI assistant with access to a personalized knowledge base.

${ragContext}

CRITICAL INSTRUCTIONS:
1. **USE CONTEXT**: If context is provided, use it to answer questions accurately
2. **BE SPECIFIC**: Use exact details from the context when available
3. **BE CONCISE**: Keep responses focused (2-3 lines maximum)
4. **FORMAT WELL**: Use **bold** for emphasis, *italics* for subtle emphasis

RESPONSE GUIDELINES:
- Use the knowledge base context when relevant
- Be direct and helpful
- Keep responses concise and actionable

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

      // Step 5: Generate response using OpenAI with optimized settings
      const openai = createOpenAI({
        apiKey: process.env.OPEN_AI_KEY || process.env.OPENAI_API_KEY!,
      })

      const result = await streamText({
        model: openai('gpt-3.5-turbo'),
        system: baseSystemPrompt,
        messages: [
          ...messages.slice(-3), // Keep only last 3 messages for context
          { role: 'user', content: message }
        ],
        maxTokens: 200, // Reduced for faster responses
        temperature: 0.7,
      })

      // Step 6: Create optimized streaming response
      let fullResponse = ''
      const encoder = new TextEncoder()
      const textStream = result.textStream
      
      const stream = new ReadableStream({
        async start(controller) {
          try {
            let detectionBuffer = ''
            
            // Simplified tool patterns for better performance
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
              
              // Simplified tool detection
              for (const { pattern, type } of actionPatterns) {
                let match: RegExpExecArray | null
                pattern.lastIndex = 0
                
                while ((match = pattern.exec(detectionBuffer)) !== null) {
                  const raw = match[1]
                  const data = typeof raw === 'string' ? raw.replace(/\n/g, '').trim() : true
                  const json = JSON.stringify({ type, data })
                  const event = `\n[[TOOL]]${json}\n`
                  controller.enqueue(encoder.encode(event))
                }
                
                // Remove processed matches from buffer
                detectionBuffer = detectionBuffer.replace(pattern, '')
              }
              
              // Limit buffer size
              if (detectionBuffer.length > 500) {
                detectionBuffer = detectionBuffer.slice(-250)
              }
            }
            controller.close()
            
            // Store conversation asynchronously (don't block response)
            setImmediate(async () => {
              try {
                await AIPerformanceOptimizer.batchStoreConversations(userId, [
                  {
                    content: `User: ${message}\nAssistant: ${fullResponse}`,
                    contentType: 'conversation',
                    embedding: queryEmbedding,
                    metadata: {
                      query: message,
                      response: fullResponse,
                      timestamp: new Date().toISOString(),
                      source: 'chat_conversation'
                    }
                  },
                  {
                    content: message,
                    contentType: 'user_fact',
                    embedding: queryEmbedding,
                    metadata: {
                      query: message,
                      timestamp: new Date().toISOString(),
                      source: 'user_fact'
                    }
                  }
                ])
                console.log('✅ Stored conversation and user_fact entries')
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
    },
    userId
  )
}

/**
 * 📝 Optimized Non-streaming Request
 */
async function handleOptimizedNonStreamingRequest(
  userId: string,
  message: string,
  messages: any[],
  clientConfig: any,
  cartState: any,
  currentUrl: string
) {
  return await PerformanceMonitor.measureOperation(
    'optimized_non_streaming_request',
    async () => {
      console.log('🔍 Starting optimized non-streaming request...')
      
      // Similar logic to streaming but return complete response
      const queryEmbedding = await AIPerformanceOptimizer.getCachedEmbedding(message)
      
      const searchResults = await AIPerformanceOptimizer.performOptimizedRAGQuery(
        userId,
        queryEmbedding,
        message,
        5
      )

      const ragContext = searchResults.length > 0 
        ? `\n\nRELEVANT KNOWLEDGE BASE CONTEXT:\n${searchResults.map((r: any) => `- ${r.content}`).join('\n')}`
        : ''

      const sources = searchResults.map((r: any) => r.metadata?.source || 'Knowledge Base').filter((v, i, a) => a.indexOf(v) === i)

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
          ...messages.slice(-3),
          { role: 'user', content: message }
        ],
        maxTokens: 200,
        temperature: 0.7,
      })

      // Collect the complete response
      let fullResponse = ''
      for await (const chunk of result.textStream) {
        fullResponse += chunk
      }

      // Store conversation asynchronously
      setImmediate(async () => {
        try {
          await AIPerformanceOptimizer.batchStoreConversations(userId, [
            {
              content: `User: ${message}\nAssistant: ${fullResponse}`,
              contentType: 'conversation',
              embedding: queryEmbedding,
              metadata: {
                query: message,
                response: fullResponse,
                timestamp: new Date().toISOString(),
                source: 'chat_conversation'
              }
            }
          ])
        } catch (error) {
          console.error('Failed to store conversation:', error)
        }
      })

      return NextResponse.json({
        message: fullResponse,
        sources: sources,
        confidence: 0.85,
        cacheHit: false,
        contextCount: searchResults.length
      })
    },
    userId
  )
}


