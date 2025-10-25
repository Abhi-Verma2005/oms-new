import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ragSystem } from '@/lib/rag-minimal'
import { applyFilters } from '@/lib/tools-minimal'
import { processUserContext, processFilterContext } from '@/lib/ai-context-manager'

export const maxDuration = 60

// Smart AI Analysis Functions
async function analyzeRAGNeed(userMessage: string, messages: any[], userId: string): Promise<boolean> {
  try {
    const analysisPrompt = `
Analyze if this user request needs previous context from RAG system.

USER MESSAGE: "${userMessage}"
CONVERSATION LENGTH: ${messages.length} messages

Consider:
- Is user asking about previous conversations?
- Is user referencing something from before?
- Is user asking for continuation or follow-up?
- Is user asking for history or past interactions?
- Is this a complex request that might benefit from context?
- Is user asking "what did I say before" or similar?

Respond ONLY: "YES" or "NO"
`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY || process.env.OPEN_AI_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a context need analyzer. Respond only with YES or NO.' },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.1,
        max_tokens: 10
      })
    })

    if (response.ok) {
      const data = await response.json()
      const decision = data.choices[0]?.message?.content?.trim().toUpperCase()
      return decision === 'YES'
    }
    
    return false
  } catch (error) {
    console.warn('RAG need analysis failed:', error)
    return false
  }
}

async function analyzeConversationValue(userMessage: string, aiResponse: string, userId: string): Promise<boolean> {
  try {
    const analysisPrompt = `
Analyze if this conversation is valuable for future RAG retrieval.

USER: "${userMessage}"
AI: "${aiResponse}"

Consider:
- Contains useful domain knowledge?
- Filter requests that could help future users?
- Meaningful interaction worth remembering?
- Has actionable insights?

Respond ONLY: "YES" or "NO"
`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY || process.env.OPEN_AI_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a conversation value assessor. Respond only with YES or NO.' },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.1,
        max_tokens: 10
      })
    })

    if (response.ok) {
      const data = await response.json()
      const decision = data.choices[0]?.message?.content?.trim().toUpperCase()
      return decision === 'YES'
    }
    
    // Store substantial responses
    return aiResponse.length > 50 && (userMessage.includes('filter') || userMessage.includes('show') || userMessage.includes('find'))
  } catch (error) {
    console.warn('Failed to analyze conversation value:', error)
    return aiResponse.length > 100
  }
}

async function smartToolSelection(userMessage: string, ragContext: string, userId: string): Promise<{
  shouldUseTool: boolean
  toolName: string
  parameters: any
  confidence: number
}> {
  try {
    const analysisPrompt = `
Analyze this user message for tool usage with RAG context.

USER MESSAGE: "${userMessage}"
RAG CONTEXT: "${ragContext}"

Available tools:
- applyFilters: For filtering publisher websites
- navigateTo: For page navigation
- addToCart: For cart operations

For applyFilters, extract these parameters from the message:
- daMin/daMax: Domain Authority (0-100)
- drMin/drMax: Domain Rating (0-100)
- spamMin/spamMax: Spam Score (0-100)
- priceMin/priceMax: Price range
- niche: Website niche (tech, health, finance, business)
- country: Country code (us, uk, ca, au, india)
- trafficMin: Minimum traffic

Examples:
- "high quality" → daMin: 50, drMin: 50, spamMax: 2
- "low spam" → spamMax: 2
- "country india" → country: "india"
- "cheap" → priceMax: 500

Respond with ONLY this JSON:
{
  "shouldUseTool": true/false,
  "toolName": "applyFilters|navigateTo|addToCart",
  "parameters": {"filters": {...} or "route": "..." or "itemId": "..."},
  "confidence": 0.0-1.0
}

Rules:
- Only use tools when 100% certain
- Extract exact parameters from message
- Use RAG context to boost confidence
- Be conservative - prefer no tool over wrong tool
`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY || process.env.OPEN_AI_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a smart tool selector. Respond only with valid JSON.' },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.1,
        max_tokens: 200
      })
    })

    if (response.ok) {
      const data = await response.json()
      const result = JSON.parse(data.choices[0]?.message?.content || '{}')
      return {
        shouldUseTool: result.shouldUseTool || false,
        toolName: result.toolName || '',
        parameters: result.parameters || {},
        confidence: Math.max(0, Math.min(1, result.confidence || 0))
      }
    }
  } catch (error) {
    console.error('Smart tool selection failed:', error)
    throw error
  }
  
  // This should never be reached due to the throw above
  return { shouldUseTool: false, toolName: '', parameters: {}, confidence: 0 }
}

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

function parseOpenAIToolCalls(response: string): any[] {
  const toolCalls: any[] = []
  
  // Look for OpenAI function calling format in the response
  // This is a simplified parser - in production you'd want more robust parsing
  const functionCallRegex = /"tool_calls":\s*\[(.*?)\]/g
  const match = response.match(functionCallRegex)
  
  if (match) {
    try {
      // Extract the tool calls array
      const toolCallsStr = `[${match[1]}]`
      const parsed = JSON.parse(toolCallsStr)
      return Array.isArray(parsed) ? parsed : []
    } catch (error) {
      console.warn('Failed to parse tool calls:', error)
      return []
    }
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

    // Extract current URL parameters for context
    const url = new URL(req.url)
    const currentParams = url.searchParams
    const currentFilters: any = {}
    
    // Map URL parameters to filter context
    if (currentParams.get('daMin')) currentFilters.daMin = parseInt(currentParams.get('daMin')!)
    if (currentParams.get('daMax')) currentFilters.daMax = parseInt(currentParams.get('daMax')!)
    if (currentParams.get('paMin')) currentFilters.paMin = parseInt(currentParams.get('paMin')!)
    if (currentParams.get('paMax')) currentFilters.paMax = parseInt(currentParams.get('paMax')!)
    if (currentParams.get('drMin')) currentFilters.drMin = parseInt(currentParams.get('drMin')!)
    if (currentParams.get('drMax')) currentFilters.drMax = parseInt(currentParams.get('drMax')!)
    if (currentParams.get('spamMin')) currentFilters.spamMin = parseInt(currentParams.get('spamMin')!)
    if (currentParams.get('spamMax')) currentFilters.spamMax = parseInt(currentParams.get('spamMax')!)
    if (currentParams.get('priceMin')) currentFilters.priceMin = parseInt(currentParams.get('priceMin')!)
    if (currentParams.get('priceMax')) currentFilters.priceMax = parseInt(currentParams.get('priceMax')!)
    if (currentParams.get('niche')) currentFilters.niche = currentParams.get('niche')
    if (currentParams.get('country')) currentFilters.country = currentParams.get('country')
    if (currentParams.get('language')) currentFilters.language = currentParams.get('language')
    if (currentParams.get('trafficMin')) currentFilters.trafficMin = parseInt(currentParams.get('trafficMin')!)
    if (currentParams.get('backlinkNature')) currentFilters.backlinkNature = currentParams.get('backlinkNature')
    if (currentParams.get('availability')) currentFilters.availability = currentParams.get('availability') === 'true'
    
    console.log(`🔍 Current URL parameters:`, Object.keys(currentFilters).length > 0 ? currentFilters : 'No filters applied')

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
    
    const userMessage = messages[messages.length - 1]?.content || ''
    console.log(`🚀 Smart AI Chat: ${messages.length} messages for user ${userId}`)
    
    // Skip RAG context for testing tool calling
    let ragContext = ''
    let userContext = ''
    let filterContext = ''
    
    console.log(`🧠 Smart AI: Skipping RAG context for testing`)
    
    // Build current filters context
    const currentFiltersContext = Object.keys(currentFilters).length > 0 
      ? `\n**CURRENT FILTERS APPLIED:**\n${Object.entries(currentFilters).map(([key, value]) => `- ${key}: ${value}`).join('\n')}\n`
      : '\n**CURRENT FILTERS:** None applied\n'

    const systemMessage = {
      role: 'system' as const,
      content: `You are an intelligent filter assistant for a publisher marketplace.

**CONTEXT:**
${ragContext}${userContext}${filterContext}${currentFiltersContext}

**INTELLIGENT ANALYSIS:**
Analyze the user's request to determine if they want to filter or search for websites/publishers. Look for:
- Requests for websites, sites, publishers, domains
- Quality indicators (best, worst, high quality, low quality)
- Geographic preferences (country, region, location)
- Technical criteria (DA, DR, spam score, authority, traffic)
- Any filtering or search intent

**SMART DECISION MAKING:**
- If user wants to find/filter websites → Generate text response + use applyFilters tool
- If user asks general questions → Generate text response only
- Always be helpful and explain your reasoning

**CURRENT FILTERS AWARENESS:**
- You can see what filters are currently applied
- When user asks to modify filters, consider current state
- When user asks to add filters, merge with existing ones
- When user asks to clear filters, remove all current ones
- When user asks to show current filters, explain what's applied

**RESPONSE FORMAT:**
1. Generate a helpful text response explaining what you're doing
2. If filtering websites → Call applyFilters tool with extracted parameters
3. Both text and tool calls should work together seamlessly

**AVAILABLE FILTER PARAMETERS:**
- daMin/daMax: Domain Authority (0-100)
- paMin/paMax: Page Authority (0-100) 
- drMin/drMax: Domain Rating (0-100)
- spamMin/spamMax: Spam Score (0-100)
- priceMin/priceMax: Price range
- niche: Website niche (tech, health, finance, business)
- country: Country code (us, uk, ca, au, india)
- language: Website language (English, Spanish, French, etc.)
- trafficMin: Minimum traffic
- backlinkNature: Backlink type (do-follow, no-follow, sponsored)
- availability: Website availability (true/false)

**EXAMPLES:**
- "show me best US websites" → "I'll find the best US websites with high quality..." + applyFilters({country: "us", daMin: 50})
- "what is domain authority?" → "Domain Authority (DA) is a metric that..." (text only)
- "find worst Indian sites" → "I'll find the worst Indian websites with low quality..." + applyFilters({country: "india", daMax: 20, spamMin: 5})
- "add more filters" → "I'll add additional filters to your current search..." + applyFilters({...currentFilters, newFilters})
- "clear all filters" → "I'll clear all current filters..." + applyFilters({})
- "what filters are applied?" → "Currently you have these filters applied: [list current filters]" (text only)
- "show me English websites" → "I'll find English websites..." + applyFilters({language: "English"})
- "find do-follow links" → "I'll find websites with do-follow backlinks..." + applyFilters({backlinkNature: "do-follow"})

**BE INTELLIGENT:**
- Analyze the user's intent, not just keywords
- Make smart decisions about when to use tools
- Always provide helpful responses
- Use tools when they add value to the user's request
- Consider current filter state when making decisions`
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
              model: 'gpt-4o',
              messages: [systemMessage, ...messages],
              temperature: 0.3,
              max_tokens: 2000,
              stream: true,
              tools: [
                {
                  type: 'function',
                  function: {
                    name: 'applyFilters',
                    description: 'Apply smart filters to publisher websites based on user intent',
                    parameters: {
                      type: 'object',
                      properties: {
                        daMin: { type: 'number', description: 'Minimum Domain Authority (0-100)' },
                        daMax: { type: 'number', description: 'Maximum Domain Authority (0-100)' },
                        paMin: { type: 'number', description: 'Minimum Page Authority (0-100)' },
                        paMax: { type: 'number', description: 'Maximum Page Authority (0-100)' },
                        drMin: { type: 'number', description: 'Minimum Domain Rating (0-100)' },
                        drMax: { type: 'number', description: 'Maximum Domain Rating (0-100)' },
                        spamMin: { type: 'number', description: 'Minimum Spam Score (0-100)' },
                        spamMax: { type: 'number', description: 'Maximum Spam Score (0-100)' },
                        priceMin: { type: 'number', description: 'Minimum price' },
                        priceMax: { type: 'number', description: 'Maximum price' },
                        niche: { type: 'string', description: 'Website niche (tech, health, finance, business)' },
                        country: { type: 'string', description: 'Country code (us, uk, ca, au, india)' },
                        language: { type: 'string', description: 'Website language (English, Spanish, French, etc.)' },
                        trafficMin: { type: 'number', description: 'Minimum traffic' },
                        backlinkNature: { type: 'string', description: 'Backlink nature (do-follow, no-follow, sponsored)' },
                        availability: { type: 'boolean', description: 'Website availability (true/false)' }
                      }
                    }
                  }
                }
              ],
              tool_choice: 'auto'
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
          let collectedToolCalls: any[] = []

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
                    const toolCalls = parsed.choices?.[0]?.delta?.tool_calls
                    
                    if (content) {
                      fullResponse += content
                      console.log(`📝 AI Response: ${content}`)
                      
                      // Stream content to client
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
                    }
                    
                    if (toolCalls) {
                      console.log(`🔧 Tool Calls Detected:`, JSON.stringify(toolCalls, null, 2))
                      // Collect tool calls for processing after streaming
                      collectedToolCalls.push(...toolCalls)
                    } else {
                      // Debug: Check if there are any tool-related fields in the response
                      if (parsed.choices?.[0]?.delta) {
                        const delta = parsed.choices[0].delta
                        if (Object.keys(delta).length > 0) {
                          console.log(`🔍 Delta keys:`, Object.keys(delta))
                          if (delta.tool_calls === undefined) {
                            console.log(`🔍 No tool_calls field in delta`)
                          }
                        }
                      }
                    }
                  } catch (e) {
                    // Skip invalid JSON
                  }
                }
              }
            }
          }

          // Process collected tool calls after streaming is complete
          console.log(`📄 Full AI Response: ${fullResponse}`)
          console.log(`🔍 Collected Tool Calls:`, JSON.stringify(collectedToolCalls, null, 2))
          
          // Reconstruct complete tool calls from chunks
          const reconstructedToolCalls: any[] = []
          const toolCallMap = new Map()
          
          for (const toolCall of collectedToolCalls) {
            // Use index as primary key, fallback to id
            const key = toolCall.index !== undefined ? toolCall.index : toolCall.id
            
            if (!toolCallMap.has(key)) {
              toolCallMap.set(key, {
                id: toolCall.id,
                index: toolCall.index,
                type: toolCall.type,
                function: {
                  name: toolCall.function?.name || '',
                  arguments: ''
                }
              })
            }
            
            const existing = toolCallMap.get(key)
            
            // Update function name if present
            if (toolCall.function?.name) {
              existing.function.name = toolCall.function.name
            }
            
            // Concatenate arguments if present
            if (toolCall.function?.arguments) {
              existing.function.arguments += toolCall.function.arguments
            }
          }
          
          console.log(`🔧 Reconstructed Tool Calls:`, JSON.stringify(Array.from(toolCallMap.values()), null, 2))
          
          // Process reconstructed tool calls
          for (const [key, toolCall] of toolCallMap) {
            if (toolCall.function && toolCall.function.name === 'applyFilters') {
              try {
                console.log(`🔧 Processing reconstructed tool call with arguments: ${toolCall.function.arguments}`)
                
                // Extract parameters from complete tool call
                let filters = {}
                if (toolCall.function.arguments && toolCall.function.arguments.trim()) {
                  const parsedArgs = JSON.parse(toolCall.function.arguments)
                  filters = parsedArgs || {}
                }
                
                console.log(`🧠 Smart AI selected applyFilters with:`, filters)
                
                const result = await applyFilters(filters, userId)
                console.log(`✅ Applied filters:`, result)
                
                // Stream tool result to client with navigation
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                  toolResults: [result],
                  message: `🧠 Smart AI: ${result.message}`,
                  intelligence: 'Applied filters based on your request with high confidence'
                })}\n\n`))
              } catch (error) {
                console.error('Tool execution failed:', error)
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                  toolResults: [{ success: false, error: error instanceof Error ? error.message : 'Unknown error' }],
                  message: 'AI failed to execute filter - please try rephrasing your request'
                })}\n\n`))
              }
            }
          }

          // Smart conversation storage - only store valuable conversations
          try {
            const conversationMessages = [...messages, { role: 'assistant', content: fullResponse }]
            
            // Use AI to determine if conversation is worth storing
            const shouldStore = await analyzeConversationValue(userMessage, fullResponse, userId)
            
            if (shouldStore) {
              await ragSystem.storeConversation(userId, conversationMessages)
              console.log(`💾 Valuable conversation stored for user ${userId}`)
              
              // Also store as a document for future RAG retrieval
              const documentContent = `User: ${userMessage}\nAssistant: ${fullResponse}`
              await ragSystem.addDocument(
                documentContent,
                { 
                  userId, 
                  type: 'conversation',
                  message: userMessage,
                  response: fullResponse,
                  timestamp: new Date().toISOString()
                },
                userId
              )
              console.log('📚 Conversation stored as RAG document')
            } else {
              console.log('💭 Conversation not stored - not valuable enough')
            }
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
