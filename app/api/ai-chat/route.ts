import { NextRequest, NextResponse } from 'next/server'
import { streamText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getUserContextWithMigration, createUnifiedUserContext } from '@/lib/user-context-migration'
import { processUserContext, getComprehensiveUserContext, extractMetadataFromMessage, refreshUserContextAfterUpdate } from '@/lib/ai-context-manager'

export async function POST(request: NextRequest) {
  try {
    const { message, messages, config: clientConfig, currentUrl, cartState, autoMessage } = await request.json()
    const isStream = request.nextUrl?.searchParams?.get('stream') === '1'
    
    console.log(`🚀 AI Chat Request: stream=${isStream}, message="${message.substring(0, 50)}..."`)
    
    if (!process.env.OPEN_AI_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Get session for user context
    const session = await getServerSession(authOptions)
    
    // OPTIMIZATION 1: Simplified system prompt for faster processing
    const baseSystemPrompt = `You are a helpful AI assistant for this application.

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
` : 'Cart state not available'}`

    // OPTIMIZATION 2: Minimal user context (non-blocking)
    let userContext = ''
    if (session?.user?.id) {
      try {
        // Use a much simpler, faster context fetch
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: {
            id: true,
            name: true,
            email: true,
            userRoles: {
              select: {
                role: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        })
        
        if (user) {
          const roles = user.userRoles?.map(ur => ur.role.name).join(', ') || 'None'
          userContext = `
USER CONTEXT:
- Name: ${user.name || 'Not specified'}
- Email: ${user.email || 'Not specified'}
- Roles: ${roles}
`
        }
      } catch (error) {
        console.warn('Failed to fetch user context:', error)
        // Continue without user context - don't block the response
      }
    }

    // OPTIMIZATION 3: Simplified system prompt construction
    const systemPrompt = baseSystemPrompt + userContext

    // Build messages
    const chatMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: any) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
      { role: 'user', content: message },
    ]

    if (isStream) {
      console.log('📡 Starting streaming response...')
      const startTime = Date.now()
      
      const openai = createOpenAI({ apiKey: process.env.OPEN_AI_KEY! })
      const result = await streamText({
        model: openai(process.env.OPENAI_MODEL || 'gpt-4o-mini'),
        messages: chatMessages,
        temperature: 0.7,
        maxTokens: 1024,
      })

      const encoder = new TextEncoder()
      const textStream = result.textStream
      let fullText = ''
      let detectionBuffer = ''

      // OPTIMIZATION 4: Simplified tool patterns for faster detection
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
          let isClosed = false
          const safeEnqueue = (chunk: string) => {
            if (isClosed) return
            try {
              controller.enqueue(encoder.encode(chunk))
            } catch {
              isClosed = true
            }
          }

          // OPTIMIZATION 5: Send initial response immediately
          safeEnqueue(' ')
          try {
            for await (const delta of textStream) {
              fullText += delta
              detectionBuffer += delta
              safeEnqueue(delta)

              // OPTIMIZATION 6: Optimized tool detection
              for (const { pattern, type } of actionPatterns) {
                let match: RegExpExecArray | null
                pattern.lastIndex = 0
                const matches: Array<{ full: string; json: string }> = []
                
                while ((match = pattern.exec(detectionBuffer)) !== null) {
                  const raw = match[1]
                  const data = typeof raw === 'string' ? raw.replace(/\n/g, '').trim() : true
                  const json = JSON.stringify({ type, data })
                  const event = `\n[[TOOL]]${json}\n`
                  safeEnqueue(event)
                  matches.push({ full: match[0], json })
                }
                
                // Remove emitted matches from buffer
                for (const m of matches) {
                  detectionBuffer = detectionBuffer.replace(m.full, '')
                }
              }

              // OPTIMIZATION 7: Limit buffer size
              if (detectionBuffer.length > 1000) {
                detectionBuffer = detectionBuffer.slice(-1000)
              }
            }
            
            const endTime = Date.now()
            console.log(`✅ Streaming completed in ${endTime - startTime}ms`)
            
          } catch (err) {
            console.error('Streaming error:', err)
            try { controller.error(err as any) } catch {}
            return
          }
          
          // OPTIMIZATION 8: Non-blocking background processing
          try {
            if (session?.user?.id) {
              // Don't await these - let them run in background
              processUserInteractionInBackground(session.user.id, message, fullText, messages || [], currentUrl)
                .catch(error => console.warn('Background processing failed:', error))
            }
          } finally {
            if (!isClosed) {
              try { controller.close() } catch {}
              isClosed = true
            }
          }
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
      // OPTIMIZATION 9: Non-streaming branch with faster processing
      console.log('📄 Starting non-streaming response...')
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
          top_p: 0.95,
          max_tokens: 1024,
        }),
      })

      if (!openAIRes.ok) {
        const errText = await openAIRes.text()
        throw new Error(`OpenAI API error: ${openAIRes.status} ${errText}`)
      }

      const data = await openAIRes.json()
      const text = data?.choices?.[0]?.message?.content || ''
      
      const endTime = Date.now()
      console.log(`✅ Non-streaming completed in ${endTime - startTime}ms`)

      // Background processing (non-blocking)
      if (session?.user?.id) {
        processUserInteractionInBackground(session.user.id, message, text, messages || [], currentUrl)
          .catch(error => console.warn('Background processing failed:', error))
      }

      return NextResponse.json({ 
        response: text,
        cartState: cartState
      })
    }
  } catch (error) {
    console.error('Error in AI chat API:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}

// OPTIMIZATION 10: Simplified background processing
async function processUserInteractionInBackground(
  userId: string,
  message: string,
  response: string,
  messageHistory: any[],
  currentUrl: string
) {
  try {
    console.log('🔄 Starting background processing...')
    
    // Store user interaction (simple and fast)
    await prisma.userInteraction.create({
      data: {
        userId,
        interactionType: 'CHAT_MESSAGE',
        content: message,
        response,
        context: {
          currentUrl,
          messageCount: messageHistory?.length || 0,
          timestamp: new Date()
        }
      }
    })
    
    // Optional: Process context in background (don't block)
    try {
      const contextResult = await processUserContext(
        userId,
        message,
        response,
        messageHistory,
        currentUrl
      )
      
      if (contextResult.shouldUpdate) {
        await refreshUserContextAfterUpdate(userId)
        console.log('✅ User context updated in background')
      }
    } catch (contextError) {
      console.warn('Context processing failed:', contextError)
    }
    
    console.log('✅ Background processing completed')
  } catch (error) {
    console.warn('Background processing failed:', error)
  }
}
