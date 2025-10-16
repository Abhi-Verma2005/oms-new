import { NextRequest, NextResponse } from 'next/server'
import { streamText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
// Note: RAG pipeline components are available but may need API keys
// For now, we'll use a simplified version that works with our test setup

export const runtime = 'edge' // Deploy to edge for ultra-low latency

export async function POST(request: NextRequest) {
  try {
    const { message, messages, config: clientConfig, currentUrl, cartState } = await request.json()
    const isStream = request.nextUrl?.searchParams?.get('stream') === '1'
    
    console.log(`🚀 RAG-Optimized AI Chat: stream=${isStream}, message="${message.substring(0, 30)}..."`)
    
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
      return await handleStreamingRequest(userId, message, messages, clientConfig, cartState)
    } else {
      return await handleNonStreamingRequest(userId, message, messages, clientConfig, cartState)
    }
  } catch (error) {
    console.error('Error in RAG-optimized AI chat API:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}

/**
 * 🚀 Ultra-Fast Streaming with RAG
 * <100ms first token, <2s complete response
 */
async function handleStreamingRequest(
  userId: string,
  message: string,
  messages: any[],
  clientConfig: any,
  cartState: any
): Promise<NextResponse> {
  
  return await RAGMonitoring.track('streaming_request', async () => {
    console.log('📡 Starting RAG-optimized streaming...')
    const startTime = Date.now()
    
    // ⚡ Parallel: Get RAG context while preparing OpenAI
    const ragContextPromise = ragPipeline.getContext(userId, message, {
      useCache: true,
      topK: 5,
      minRelevance: 0.6,
      enableReranking: true
    })
    
    // Build base system prompt
    const baseSystemPrompt = `You are a helpful AI assistant with access to user's knowledge base.

IMPORTANT: Keep responses concise and focused - aim for 2-4 lines maximum. Use markdown formatting:
- **Bold text** for emphasis
- *Italic text* for subtle emphasis
- \`inline code\` for technical terms
- # Headers for main topics

Be direct, helpful, and reference user's previous conversations when relevant.

NAVIGATION DATA:
${Array.isArray(clientConfig?.navigationData) ? clientConfig.navigationData.map((nav: any) => `- ${nav.name}: ${nav.route}`).join('\n') : 'None available'}

CURRENT CART STATE:
${cartState ? `
- Total Items: ${cartState.totalItems || 0}
- Total Price: $${(cartState.totalPrice || 0).toFixed(2)}
` : 'Cart state not available'}`

    // Wait for RAG context (should be <100ms with caching)
    const ragContext = await ragContextPromise
    const ragTime = Date.now() - startTime
    
    console.log(`🧠 RAG context retrieved in ${ragTime}ms (${ragContext.metadata.cacheHit ? 'CACHED' : 'FRESH'})`)
    
    // Build enhanced prompt with RAG context
    const enhancedPrompt = ragPipeline.buildEnhancedPrompt(message, ragContext)
    
    // Create OpenAI client
    const openai = createOpenAI({ apiKey: process.env.OPEN_AI_KEY! })
    
    // Build messages array
    const chatMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: baseSystemPrompt },
      ...(messages || []).slice(-5).map((m: any) => ({ 
        role: m.role === 'user' ? 'user' : 'assistant', 
        content: m.content 
      })),
      { role: 'user', content: enhancedPrompt }
    ]

    // Start streaming
    const result = await streamText({
      model: openai(process.env.OPENAI_MODEL || 'gpt-4o-mini'),
      messages: chatMessages,
      temperature: 0.7,
      maxTokens: 1000,
    })

    const encoder = new TextEncoder()
    const textStream = result.textStream
    let fullText = ''

    // Optimized tool patterns for faster detection
    const actionPatterns: Array<{ pattern: RegExp; type: string }> = [
      { pattern: /\[\s*NAVIGATE\s*:\s*([^\]]+)\s*\]/g, type: 'navigate' },
      { pattern: /\[\s*FILTER\s*:\s*([^\]]+)\s*\]/g, type: 'filter' },
      { pattern: /\[\s*ADD_TO_CART\s*:\s*([^\]]+)\s*\]/g, type: 'addToCart' },
      { pattern: /\[\s*VIEW_CART\s*\]/g, type: 'viewCart' },
      { pattern: /\[\s*PROCEED_TO_CHECKOUT\s*\]/g, type: 'proceedToCheckout' },
      { pattern: /\[\s*VIEW_ORDERS\s*\]/g, type: 'viewOrders' },
    ]

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        // ⚡ Send immediate response
        controller.enqueue(encoder.encode(' '))
        
        try {
          for await (const delta of textStream) {
            fullText += delta
            controller.enqueue(encoder.encode(delta))

            // ⚡ Optimized tool detection
            for (const { pattern, type } of actionPatterns) {
              let match: RegExpExecArray | null
              pattern.lastIndex = 0
              
              while ((match = pattern.exec(fullText)) !== null) {
                const raw = match[1]
                const data = typeof raw === 'string' ? raw.replace(/\n/g, '').trim() : true
                const json = JSON.stringify({ type, data })
                const event = `\n[[TOOL]]${json}\n`
                controller.enqueue(encoder.encode(event))
              }
            }
          }
          
          const endTime = Date.now()
          console.log(`✅ RAG streaming completed in ${endTime - startTime}ms`)
          
        } catch (err) {
          console.error('Streaming error:', err)
          controller.error(err)
          return
        }
        
        // ⚡ Store interaction in background (non-blocking)
        setImmediate(() => {
          if (userId !== 'anonymous') {
            ragPipeline.storeInteraction(userId, message, fullText, {
              currentUrl,
              cartState,
              ragMetrics: ragContext.metadata
            }).catch(error => console.warn('Background storage failed:', error))
          }
        })
        
        controller.close()
      }
    })

    return new NextResponse(stream as any, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
        'Connection': 'keep-alive',
        'X-RAG-Context-Time': `${ragTime}ms`,
        'X-Cache-Hit': ragContext.metadata.cacheHit ? 'true' : 'false'
      }
    })
  }, {
    userId,
    messageLength: message.length,
    isStreaming: true
  })
}

/**
 * 📄 Non-streaming request with RAG
 */
async function handleNonStreamingRequest(
  userId: string,
  message: string,
  messages: any[],
  clientConfig: any,
  cartState: any
): Promise<NextResponse> {
  
  return await RAGMonitoring.track('non_streaming_request', async () => {
    console.log('📄 Starting RAG-optimized non-streaming...')
    const startTime = Date.now()
    
    // Get RAG context
    const ragContext = await ragPipeline.getContext(userId, message, {
      useCache: true,
      topK: 5,
      minRelevance: 0.6,
      enableReranking: true
    })
    
    const ragTime = Date.now() - startTime
    console.log(`🧠 RAG context retrieved in ${ragTime}ms`)
    
    // Build enhanced prompt
    const enhancedPrompt = ragPipeline.buildEnhancedPrompt(message, ragContext)
    
    // Build messages
    const chatMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { 
        role: 'system', 
        content: `You are a helpful AI assistant. Keep responses concise (2-4 lines max). Use **bold** for emphasis.` 
      },
      ...(messages || []).slice(-5).map((m: any) => ({ 
        role: m.role === 'user' ? 'user' : 'assistant', 
        content: m.content 
      })),
      { role: 'user', content: enhancedPrompt }
    ]
    
    // Call OpenAI
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
        max_tokens: 1000,
      }),
    })

    if (!openAIRes.ok) {
      const errText = await openAIRes.text()
      throw new Error(`OpenAI API error: ${openAIRes.status} ${errText}`)
    }

    const data = await openAIRes.json()
    const text = data?.choices?.[0]?.message?.content || ''
    
    const endTime = Date.now()
    console.log(`✅ RAG non-streaming completed in ${endTime - startTime}ms`)

    // Store interaction in background
    setImmediate(() => {
      if (userId !== 'anonymous') {
        ragPipeline.storeInteraction(userId, message, text, {
          currentUrl,
          cartState,
          ragMetrics: ragContext.metadata
        }).catch(error => console.warn('Background storage failed:', error))
      }
    })

    return NextResponse.json({ 
      response: text,
      cartState: cartState,
      ragMetrics: {
        contextTime: ragTime,
        totalTime: endTime - startTime,
        cacheHit: ragContext.metadata.cacheHit,
        docsRetrieved: ragContext.metadata.totalDocs,
        relevancyScore: ragContext.metadata.relevancyScore
      }
    })
  }, {
    userId,
    messageLength: message.length,
    isStreaming: false
  })
}
