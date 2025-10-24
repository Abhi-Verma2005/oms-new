import { NextRequest, NextResponse } from 'next/server'
import { streamText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { message, messages, config: clientConfig, currentUrl, cartState } = await request.json()
    const isStream = request.nextUrl?.searchParams?.get('stream') === '1'
    
    console.log(`🚀 Ultra-Optimized AI Chat: stream=${isStream}, message="${message.substring(0, 30)}..."`)
    
    if (!process.env.OPEN_AI_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // ULTRA OPTIMIZATION 1: Minimal system prompt for maximum speed
    const systemPrompt = `You are a helpful AI assistant. Keep responses concise (2-3 lines max). Use **bold** for emphasis.`

    // ULTRA OPTIMIZATION 2: Skip session and user context for speed
    // (Can be added back later if needed)
    
    // ULTRA OPTIMIZATION 3: Build minimal messages array
    const chatMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
      ...(messages || []).slice(-5).map((m: any) => ({ 
        role: m.role === 'user' ? 'user' : 'assistant', 
        content: m.content 
      })),
      { role: 'user', content: message },
    ]

    if (isStream) {
      console.log('📡 Starting ultra-optimized streaming...')
      const startTime = Date.now()
      
      const openai = createOpenAI({ apiKey: process.env.OPEN_AI_KEY! })
      const result = await streamText({
        model: openai(process.env.OPENAI_MODEL || 'gpt-4o-mini'),
        messages: chatMessages,
        temperature: 0.7,
        maxTokens: 512, // Reduced for speed
      })

      const encoder = new TextEncoder()
      const textStream = result.textStream
      let fullText = ''

      const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
          // ULTRA OPTIMIZATION 4: Immediate response start
          controller.enqueue(encoder.encode(' '))
          
          try {
            for await (const delta of textStream) {
              fullText += delta
              controller.enqueue(encoder.encode(delta))
            }
            
            const endTime = Date.now()
            console.log(`✅ Ultra-optimized streaming completed in ${endTime - startTime}ms`)
            
          } catch (err) {
            console.error('Streaming error:', err)
            controller.error(err)
            return
          }
          
          // ULTRA OPTIMIZATION 5: No background processing - pure speed
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
          'Content-Encoding': 'identity'
        }
      })
    } else {
      // ULTRA OPTIMIZATION 6: Non-streaming with minimal overhead
      console.log('📄 Starting ultra-optimized non-streaming...')
      const startTime = Date.now()
      
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
          max_tokens: 512, // Reduced for speed
        }),
      })

      if (!openAIRes.ok) {
        const errText = await openAIRes.text()
        throw new Error(`OpenAI API error: ${openAIRes.status} ${errText}`)
      }

      const data = await openAIRes.json()
      const text = data?.choices?.[0]?.message?.content || ''
      
      const endTime = Date.now()
      console.log(`✅ Ultra-optimized non-streaming completed in ${endTime - startTime}ms`)

      return NextResponse.json({ 
        response: text,
        cartState: cartState
      })
    }
  } catch (error) {
    console.error('Error in ultra-optimized AI chat API:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}
