import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ragSystem } from '@/lib/rag-minimal'

export const maxDuration = 60

// Tool execution functions
async function executeFilter(filters: any, userId: string) {
  console.log(`🔍 Executing filter:`, filters)
  
  try {
    // Build filter URL parameters
    const filterParams = new URLSearchParams()
    
    if (filters.daMin) filterParams.set('daMin', filters.daMin)
    if (filters.drMin) filterParams.set('drMin', filters.drMin)
    if (filters.spamMax) filterParams.set('spamMax', filters.spamMax)
    if (filters.priceMin) filterParams.set('priceMin', filters.priceMin)
    if (filters.priceMax) filterParams.set('priceMax', filters.priceMax)
    if (filters.niche) filterParams.set('niche', filters.niche)
    if (filters.country) filterParams.set('country', filters.country)
    if (filters.trafficMin) filterParams.set('trafficMin', filters.trafficMin)
    
    const filterString = filterParams.toString()
    
    return {
      action: 'filter_applied',
      filters: filters,
      url: `/publishers?${filterString}`,
      message: `Applied filters: ${Object.entries(filters).map(([k,v]) => `${k}=${v}`).join(', ')}`,
      success: true
    }
  } catch (error) {
    console.error('❌ Filter execution failed:', error)
    return {
      action: 'filter_failed',
      message: `Filter failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      success: false
    }
  }
}

async function executeNavigation(route: string, userId: string) {
  console.log(`🧭 Executing navigation to: ${route}`)
  
  return {
    action: 'navigate',
    route: route,
    message: `Navigating to ${route}`,
    success: true
  }
}

async function executeAddToCart(itemId: string, userId: string) {
  console.log(`🛒 Adding item to cart: ${itemId}`)
  
  try {
    // Add to cart logic here
    return {
      action: 'cart_updated',
      itemId: itemId,
      message: `Added item ${itemId} to cart`,
      success: true
    }
  } catch (error) {
    console.error('❌ Cart update failed:', error)
    return {
      action: 'cart_failed',
      message: `Failed to add item to cart: ${error instanceof Error ? error.message : 'Unknown error'}`,
      success: false
    }
  }
}

async function executeSearch(query: string, userId: string) {
  console.log(`🔍 Executing RAG search: ${query}`)
  
  try {
    // Search documents using RAG system
    const results = await ragSystem.searchDocuments(query, userId, 5)
    
    return {
      action: 'search_completed',
      query: query,
      sources: results,
      message: `Found ${results.length} relevant documents for: ${query}`,
      success: true
    }
  } catch (error) {
    console.error('❌ Search failed:', error)
    return {
      action: 'search_failed',
      message: `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      success: false
    }
  }
}

// Tool call types
interface FilterToolCall { type: 'FILTER'; params: any }
interface NavigateToolCall { type: 'NAVIGATE'; route: string }
interface CartToolCall { type: 'ADD_TO_CART'; itemId: string }
interface SearchToolCall { type: 'SEARCH'; query: string }

type ToolCall = FilterToolCall | NavigateToolCall | CartToolCall | SearchToolCall

function parseToolCalls(response: string): ToolCall[] {
  const toolCalls: ToolCall[] = []
  
  // Parse filter calls
  const filterMatch = response.match(/\[FILTER:([^\]]+)\]/)
  if (filterMatch) {
    const params = new URLSearchParams(filterMatch[1])
    const filterParams: any = {}
    for (const [key, value] of params.entries()) {
      if (key === 'daMin' || key === 'drMin' || key === 'spamMax' || key === 'priceMin' || key === 'priceMax' || key === 'trafficMin') {
        filterParams[key] = parseInt(value)
      } else {
        filterParams[key] = value
      }
    }
    toolCalls.push({ type: 'FILTER', params: filterParams })
  }
  
  // Parse navigation calls
  const navigateMatch = response.match(/\[NAVIGATE:([^\]]+)\]/)
  if (navigateMatch) {
    toolCalls.push({ type: 'NAVIGATE', route: navigateMatch[1] })
  }
  
  // Parse cart calls
  const cartMatch = response.match(/\[ADD_TO_CART:([^\]]+)\]/)
  if (cartMatch) {
    toolCalls.push({ type: 'ADD_TO_CART', itemId: cartMatch[1] })
  }
  
  // Parse search calls
  const searchMatch = response.match(/\[SEARCH:([^\]]+)\]/)
  if (searchMatch) {
    toolCalls.push({ type: 'SEARCH', query: searchMatch[1] })
  }
  
  return toolCalls
}

export async function POST(req: NextRequest) {
  try {
    const { messages, userId, documentUpload } = await req.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 })
    }

    // Handle document upload if present
    if (documentUpload) {
      console.log(`📄 Processing document upload: ${documentUpload.filename}`)
      
      try {
        // Add document to RAG system
        const success = await ragSystem.addDocument(documentUpload.content, {
          filename: documentUpload.filename,
          type: 'user_upload',
          size: documentUpload.content.length
        }, userId)
        
        if (success) {
          return NextResponse.json({
            content: `✅ Document "${documentUpload.filename}" uploaded and processed successfully! I can now answer questions about this document.`,
            toolResults: [{
              action: 'document_uploaded',
              filename: documentUpload.filename,
              size: documentUpload.content.length,
              message: `Document ${documentUpload.filename} uploaded and processed successfully`,
              success: true
            }]
          })
        } else {
          throw new Error('Failed to add document to RAG system')
        }
      } catch (error) {
        console.error('❌ Document upload failed:', error)
        return NextResponse.json({
          content: `❌ Failed to upload document "${documentUpload.filename}": ${error instanceof Error ? error.message : 'Unknown error'}`,
          toolResults: [{
            action: 'upload_failed',
            filename: documentUpload.filename,
            message: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            success: false
          }]
        })
      }
    }
    
    console.log(`🚀 Streaming AI Chat: ${messages.length} messages for user ${userId}`)
    
    const systemMessage = {
      role: 'system' as const,
      content: `You are an AI assistant for a publisher marketplace with advanced RAG capabilities. You can help users with:

**FILTERING**: Filter publisher websites by metrics
- DA (Domain Authority): daMin=X, daMax=X
- DR (Domain Rating): drMin=X, drMax=X  
- Spam Score: spamMin=X, spamMax=X
- Price: priceMin=X, priceMax=X
- Niche: niche=tech|health|finance|business
- Country: country=us|uk|ca|au|india
- Traffic: trafficMin=X

**NAVIGATION**: Navigate to different pages
- /publishers - Main publishers page
- /cart - Shopping cart
- /orders - Order history
- /profile - User profile

**CART OPERATIONS**: Manage shopping cart
- Add items to cart
- View cart contents
- Remove items

**RAG SEARCH**: Advanced document search with semantic understanding
- Search through uploaded documents and knowledge base
- Find relevant information using vector similarity
- Provide context-aware responses based on document content
- Access to user-specific document collections

**RESPONSE FORMAT**:
When applying filters: [FILTER:daMin=50&spamMax=3&niche=tech]
When navigating: [NAVIGATE:/publishers]
When adding to cart: [ADD_TO_CART:item123]
When searching documents: [SEARCH:link building strategies]

**RAG CAPABILITIES**:
- Semantic search through document collections
- Context-aware responses based on relevant documents
- Access to user-specific knowledge base
- Conversation history integration for personalized responses

Always provide helpful, accurate responses and use the appropriate tools when needed.`
    }

    // Create streaming response
    const encoder = new TextEncoder()
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Call OpenAI API with streaming
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY || process.env.OPEN_AI_KEY}`,
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [systemMessage, ...messages],
              temperature: 0.7,
              stream: true
            })
          })
          
          if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`)
          }
          
          // Process streaming response
          const reader = response.body?.getReader()
          const decoder = new TextDecoder()
          let fullResponse = ''
          let toolResults: any[] = []

          if (reader) {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break

              const chunk = decoder.decode(value)
              const lines = chunk.split('\n')

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6)
                  if (data === '[DONE]') continue

                  try {
                    const parsed = JSON.parse(data)
                    const content = parsed.choices?.[0]?.delta?.content
                    if (content) {
                      fullResponse += content
                      
                      // Stream content to client
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
                    }
                  } catch (e) {
                    // Skip invalid JSON
                  }
                }
              }
            }
          }

          // After streaming is complete, parse and execute tools
          const toolCalls = parseToolCalls(fullResponse)
          console.log(`🔧 Found ${toolCalls.length} tool calls:`, toolCalls)

          for (const toolCall of toolCalls) {
            let result
            switch (toolCall.type) {
              case 'FILTER':
                result = await executeFilter(toolCall.params, userId)
                break
              case 'NAVIGATE':
                result = await executeNavigation(toolCall.route, userId)
                break
              case 'ADD_TO_CART':
                result = await executeAddToCart(toolCall.itemId, userId)
                break
              case 'SEARCH':
                result = await executeSearch(toolCall.query, userId)
                break
            }
            if (result) {
              toolResults.push(result)
            }
          }

          // Stream tool results
          if (toolResults.length > 0) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ toolResults })}\n\n`))
          }

          // Store conversation for user-specific training (no data leakage)
          try {
            const conversationMessages = [...messages, { role: 'assistant', content: fullResponse }]
            await ragSystem.storeConversation(userId, conversationMessages)
            console.log(`💬 Conversation stored for user ${userId}`)
          } catch (error) {
            console.warn('⚠️ Failed to store conversation:', error)
          }

          // Send completion signal
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()

        } catch (error) {
          console.error('❌ Streaming error:', error)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' })}\n\n`))
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })

  } catch (error) {
    console.error('❌ API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
