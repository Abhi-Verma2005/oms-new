import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ragSystem } from '@/lib/rag-minimal'
import { applyFilters } from '@/lib/tools-minimal'
import { processUserContext, processFilterContext } from '@/lib/ai-context-manager'

export const maxDuration = 60

interface IntentAnalysis {
  intent: 'ACTION' | 'INFORMATION' | 'UNCLEAR'
  confidence: number
  reasoning: string
  suggestedFilters?: any
}

async function analyzeUserIntent(
  userMessage: string, 
  conversationContext: any[],
  currentFilters: any
): Promise<IntentAnalysis> {
  try {
    const contextMessages = conversationContext.slice(-3).map(m => 
      `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
    ).join('\n')

    const prompt = `Analyze the user's intent for this message in a publisher marketplace context.

CONVERSATION CONTEXT:
${contextMessages}

CURRENT FILTERS APPLIED:
${Object.keys(currentFilters).length > 0 ? JSON.stringify(currentFilters, null, 2) : 'None'}

USER'S NEW MESSAGE:
"${userMessage}"

Classify the intent as:

1. **ACTION**: User wants to see/browse filtered results
   - Wants to view websites matching criteria
   - Making selection/comparison
   - Looking for options to potentially purchase
   - Modifying existing search
   Examples: "show me X", "looking for Y", "got any Z?", "I need", "can I see"

2. **INFORMATION**: User wants to learn/understand
   - Asking how something works
   - Requesting explanation of concepts
   - Seeking advice or guidance
   - Comparing features conceptually
   Examples: "what is X?", "how does Y work?", "why Z?", "explain", "tell me about"

3. **UNCLEAR**: Ambiguous or conversational
   - Greetings, acknowledgments
   - Unclear requests
   - Off-topic

For ACTION intent, extract implied filters from natural language:
- Quality terms → DA/DR/Spam thresholds
- Price terms → Price ranges
- Geographic terms → Country codes
- Topic/industry terms → Niche
- Traffic terms → Traffic minimums

Respond with ONLY this JSON:
{
  "intent": "ACTION|INFORMATION|UNCLEAR",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of classification",
  "suggestedFilters": {
    // Only if ACTION intent - extracted filter parameters
    // Use null values for filters not mentioned
  }
}

Be intelligent about context:
- "also X" or "and Y" = ACTION (additive to current filters)
- "instead Z" or "change to W" = ACTION (replacement)
- "what about X?" after browsing = likely ACTION
- "how much should I pay?" = INFORMATION (asking advice)
- "anything under $500?" = ACTION (wants to see results)`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY || process.env.OPEN_AI_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Fast model for intent classification
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert intent classifier. Respond only with valid JSON.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 300
      })
    })

    if (response.ok) {
      const data = await response.json()
      const result = JSON.parse(data.choices[0]?.message?.content || '{}')
      
      console.log(`🎯 Intent Analysis: ${result.intent} (${result.confidence})`)
      console.log(`💭 Reasoning: ${result.reasoning}`)
      if (result.suggestedFilters) {
        console.log(`🔍 Suggested Filters:`, result.suggestedFilters)
      }
      
      return {
        intent: result.intent || 'UNCLEAR',
        confidence: Math.max(0, Math.min(1, result.confidence || 0)),
        reasoning: result.reasoning || 'No reasoning provided',
        suggestedFilters: result.suggestedFilters || null
      }
    }
    
    // Fallback if API fails
    return {
      intent: 'UNCLEAR',
      confidence: 0,
      reasoning: 'Intent analysis API failed',
      suggestedFilters: null
    }
    
  } catch (error) {
    console.error('❌ Intent analysis failed:', error)
    return {
      intent: 'UNCLEAR',
      confidence: 0,
      reasoning: 'Analysis error',
      suggestedFilters: null
    }
  }
}

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
    
    if (!userId || !messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    // Extract current filters from URL
    const url = new URL(req.url)
    const currentParams = url.searchParams
    const currentFilters: any = {}
    
    if (currentParams.get('daMin')) currentFilters.daMin = parseInt(currentParams.get('daMin')!)
    if (currentParams.get('daMax')) currentFilters.daMax = parseInt(currentParams.get('daMax')!)
    if (currentParams.get('drMin')) currentFilters.drMin = parseInt(currentParams.get('drMin')!)
    if (currentParams.get('drMax')) currentFilters.drMax = parseInt(currentParams.get('drMax')!)
    if (currentParams.get('spamMin')) currentFilters.spamMin = parseInt(currentParams.get('spamMin')!)
    if (currentParams.get('spamMax')) currentFilters.spamMax = parseInt(currentParams.get('spamMax')!)
    if (currentParams.get('priceMin')) currentFilters.priceMin = parseInt(currentParams.get('priceMin')!)
    if (currentParams.get('priceMax')) currentFilters.priceMax = parseInt(currentParams.get('priceMax')!)
    if (currentParams.get('niche')) currentFilters.niche = currentParams.get('niche')
    if (currentParams.get('country')) currentFilters.country = currentParams.get('country')
    if (currentParams.get('trafficMin')) currentFilters.trafficMin = parseInt(currentParams.get('trafficMin')!)
    
    const userMessage = messages[messages.length - 1]?.content || ''
    console.log(`🚀 Two-Stage LLM Processing for user ${userId}`)
    
    const currentFiltersContext = Object.keys(currentFilters).length > 0 
      ? `Current filters: ${JSON.stringify(currentFilters, null, 2)}`
      : 'No filters currently applied'
    
    // ===== STAGE 1: TEXT RESPONSE GENERATION =====
    console.log('\n📝 STAGE 1: Generating conversational response...')
    
    const stage1SystemMessage = {
      role: 'system' as const,
      content: `You are a helpful assistant for a publisher marketplace.

**CONTEXT:**
${currentFiltersContext}

**YOUR ROLE:**
- Provide natural, conversational responses to user queries
- If user wants to filter/search websites, acknowledge their request naturally
- If user asks questions, provide informative answers
- Be friendly, concise, and helpful
- DO NOT mention or execute any technical operations
- Just respond as a helpful human would

**EXAMPLES:**

User: "Show me affordable tech sites"
You: "I'll help you find affordable tech publishers. Let me search for sites under $500 in the technology niche."

User: "What is Domain Authority?"
You: "Domain Authority (DA) is a metric developed by Moz that predicts how well a website will rank on search engines. It ranges from 0-100, with higher scores indicating stronger authority and better ranking potential."

User: "I need sites from India with good quality"
You: "I'll look for high-quality publishers from India for you. I'll find sites with strong authority metrics and low spam scores."

User: "Also show ones with high traffic"
You: "I'll add the high traffic requirement to your current search. Looking for publishers with significant monthly traffic now."

Keep responses brief, natural, and conversational.`
    }

    let stage1Response = ''
    
    // Call LLM for text response (streaming)
    const stage1Stream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY || process.env.OPEN_AI_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [stage1SystemMessage, ...messages],
        temperature: 0.7,
        max_tokens: 500,
        stream: true
      })
    })

    if (!stage1Stream.ok) {
      throw new Error(`Stage 1 API error: ${stage1Stream.status}`)
    }

    // Stream Stage 1 response to client
    const encoder = new TextEncoder()
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Process Stage 1 streaming
          const reader = stage1Stream.body?.getReader()
          const decoder = new TextDecoder()

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
                      stage1Response += content
                      
                      // Stream to client
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                        type: 'content',
                        content,
                        stage: 1
                      })}\n\n`))
                    }
                  } catch (e) {
                    // Skip invalid JSON
                  }
                }
              }
            }
          }

          console.log(`✅ Stage 1 Complete: "${stage1Response}"`)

          // ===== STAGE 2: TOOL ANALYSIS & EXECUTION =====
          console.log('\n🔧 STAGE 2: Analyzing if tools are needed...')
          
          const stage2SystemMessage = {
      role: 'system' as const,
            content: `You are a tool execution analyzer. Your job is to determine if the user's request requires tool execution.

**USER'S REQUEST:**
"${userMessage}"

**YOUR CONVERSATIONAL RESPONSE:**
"${stage1Response}"

**CURRENT FILTERS:**
${currentFiltersContext}

**ANALYSIS TASK:**

Determine if the user wants to SEE filtered results (requires applyFilters tool) or just wanted INFORMATION (no tool needed).

**Call applyFilters if:**
- User wants to browse/view websites
- User is making a selection
- User wants to see results matching criteria
- User is modifying current search
- Examples: "show me X", "find Y", "I need Z", "looking for", "got any"

**DON'T call tools if:**
- User asked a conceptual question
- User wanted explanation/advice
- User is just chatting
- Examples: "what is X?", "how does Y work?", "explain Z"

**FILTER EXTRACTION RULES:**

Extract filters from the user's natural language:

Quality/Authority indicators:
- "quality", "good", "reputable", "trustworthy" → daMin: 50, drMin: 50, spamMax: 2
- "high authority", "strong" → daMin: 60, drMin: 60
- "low spam", "clean" → spamMax: 2

Price indicators:
- "cheap", "affordable", "budget", "inexpensive" → priceMax: 500
- "expensive", "premium", "high-end" → priceMin: 1000
- "mid-range", "moderate" → priceMin: 500, priceMax: 1500
- "under $X", "less than X", "below X" → priceMax: X
- "above $X", "over X", "more than X" → priceMin: X

Geographic indicators:
- Any country name → country: "[country_code]"
- Examples: "India" → "india", "US/USA" → "us", "UK" → "uk"

Niche/Topic indicators:
- Any industry mention → niche: "[niche]"
- Available: tech, health, finance, business, lifestyle, education

Traffic indicators:
- "popular", "high traffic", "busy" → trafficMin: 10000
- "established traffic" → trafficMin: 5000

Context modifiers:
- "also", "and", "plus" → MERGE with current filters
- "instead", "change to", "actually" → REPLACE relevant filters
- "clear", "reset", "remove filters" → Empty filters

**RESPOND WITH ONLY THIS JSON:**
{
  "shouldExecuteTool": true/false,
  "reasoning": "Why you made this decision",
  "toolName": "applyFilters" or null,
  "parameters": {
    // Extracted filter parameters
    // MERGE with current filters if additive request
    // ONLY changed filters if replacement request
  },
  "confidence": 0.0-1.0
}

**EXAMPLES:**

Example 1:
User: "show me affordable tech sites"
Response: "I'll help you find affordable tech publishers..."
Analysis:
{
  "shouldExecuteTool": true,
  "reasoning": "User wants to see filtered results for affordable tech sites",
  "toolName": "applyFilters",
  "parameters": {
    "priceMax": 500,
    "niche": "tech"
  },
  "confidence": 0.95
}

Example 2:
User: "what is domain authority?"
Response: "Domain Authority (DA) is a metric..."
Analysis:
{
  "shouldExecuteTool": false,
  "reasoning": "User asked a conceptual question, only wanted information",
  "toolName": null,
  "parameters": {},
  "confidence": 0.98
}

Example 3:
User: "also show ones from India"
Current: { priceMax: 500, niche: "tech" }
Response: "I'll add India to your search..."
Analysis:
{
  "shouldExecuteTool": true,
  "reasoning": "Additive request - user wants to add country filter",
  "toolName": "applyFilters",
  "parameters": {
    "priceMax": 500,
    "niche": "tech",
    "country": "india"
  },
  "confidence": 0.92
}

Be precise and confident in your analysis.`
          }

          const stage2Response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY || process.env.OPEN_AI_KEY}`,
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini', // Fast model for analysis
              messages: [
                stage2SystemMessage,
                { role: 'user', content: `Analyze this request and determine tool execution.` }
              ],
              temperature: 0.1,
              max_tokens: 500
            })
          })

          if (!stage2Response.ok) {
            throw new Error(`Stage 2 API error: ${stage2Response.status}`)
          }

          const stage2Data = await stage2Response.json()
          const analysis = JSON.parse(stage2Data.choices[0]?.message?.content || '{}')
          
          console.log(`🎯 Stage 2 Analysis:`)
          console.log(`   Should Execute: ${analysis.shouldExecuteTool}`)
          console.log(`   Reasoning: ${analysis.reasoning}`)
          console.log(`   Confidence: ${(analysis.confidence * 100).toFixed(0)}%`)
          
          if (analysis.shouldExecuteTool && analysis.toolName === 'applyFilters') {
            console.log(`   Parameters:`, analysis.parameters)
            
            // Execute the filter tool
            try {
              const result = await applyFilters(analysis.parameters, userId)
              console.log(`✅ Filter executed successfully`)
              
              // Send tool result to client
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                type: 'tool_result',
                stage: 2,
                toolResult: {
                  ...result,
                  analysis: {
                    reasoning: analysis.reasoning,
                    confidence: analysis.confidence
                  }
                }
              })}\n\n`))
              
            } catch (error) {
              console.error('❌ Tool execution failed:', error)
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                type: 'tool_error',
                stage: 2,
                error: error instanceof Error ? error.message : 'Unknown error'
              })}\n\n`))
            }
        } else {
            console.log(`ℹ️ No tool execution needed`)
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: 'no_tool',
              stage: 2,
              reasoning: analysis.reasoning
            })}\n\n`))
          }

          // Store conversation
          try {
            const conversationMessages = [
              ...messages, 
              { role: 'assistant', content: stage1Response }
            ]
            
            const shouldStore = stage1Response.length > 50
            if (shouldStore) {
              await ragSystem.storeConversation(userId, conversationMessages)
              console.log(`💾 Conversation stored`)
            }
          } catch (error) {
            console.warn('⚠️ Failed to store conversation:', error)
          }

          // Send completion
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()

        } catch (error) {
          console.error('❌ Stream error:', error)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error' 
          })}\n\n`))
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
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
              temperature: 0.1,
              max_tokens: 4000,
              stream: true,
              tools: [
                {
                  type: 'function',
                  function: {
                    name: 'applyFilters',
                    description: 'Apply filters to search publisher websites. Call this AFTER streaming your explanation to the user.',
                    parameters: {
                      type: 'object',
                      properties: {
                        reasoning: {
                          type: 'string',
                          description: 'Brief conversational message (e.g., "Finding websites above $300"). Keep it short and natural.'
                        },
                        priceMin: { type: 'number', description: 'Minimum price in dollars' },
                        priceMax: { type: 'number', description: 'Maximum price in dollars' },
                        daMin: { type: 'number', description: 'Minimum Domain Authority (0-100)' },
                        daMax: { type: 'number', description: 'Maximum Domain Authority (0-100)' },
                        paMin: { type: 'number', description: 'Minimum Page Authority (0-100)' },
                        paMax: { type: 'number', description: 'Maximum Page Authority (0-100)' },
                        drMin: { type: 'number', description: 'Minimum Domain Rating (0-100)' },
                        drMax: { type: 'number', description: 'Maximum Domain Rating (0-100)' },
                        spamMin: { type: 'number', description: 'Minimum Spam Score (0-100)' },
                        spamMax: { type: 'number', description: 'Maximum Spam Score (0-100)' },
                        niche: { type: 'string', description: 'Website niche (tech, health, finance, business)' },
                        country: { type: 'string', description: 'Country code (us, uk, ca, au, india)' },
                        language: { type: 'string', description: 'Website language (English, Spanish, French, etc.)' },
                        trafficMin: { type: 'number', description: 'Minimum monthly traffic' },
                        backlinkNature: { type: 'string', description: 'Backlink nature (do-follow, no-follow, sponsored)' },
                        availability: { type: 'boolean', description: 'Website availability (true/false)' }
                      },
                      required: ['reasoning']
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
                    const finishReason = parsed.choices?.[0]?.finish_reason
                    
                    if (content) {
                      fullResponse += content
                      console.log(`📝 AI Response: ${content}`)
                      
                      // Stream content to client
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
                    }
                    
                    if (toolCalls) {
                      console.log(`🔧 Tool Calls Detected:`, JSON.stringify(toolCalls, null, 2))
                      // Collect tool calls for processing
                      for (const toolCall of toolCalls) {
                        const index = toolCall.index
                        
                        if (!collectedToolCalls[index]) {
                          collectedToolCalls[index] = {
                            id: toolCall.id,
                            type: toolCall.type || 'function',
                            function: {
                              name: toolCall.function?.name || '',
                              arguments: ''
                            }
                          }
                        }
                        
                        if (toolCall.function?.name) {
                          collectedToolCalls[index].function.name = toolCall.function.name
                        }
                        
                        if (toolCall.function?.arguments) {
                          collectedToolCalls[index].function.arguments += toolCall.function.arguments
                        }
                      }
                    }
                    
                    // Process tool calls when streaming finishes but before [DONE]
                    if (finishReason === 'tool_calls' || finishReason === 'stop') {
                      console.log(`🔍 Processing collected tool calls on finish:`, collectedToolCalls)
                      
                      // Process all collected tool calls
                      for (const toolCall of collectedToolCalls.filter(tc => tc)) {
                        if (toolCall.function?.name === 'applyFilters') {
                          try {
                            console.log(`🔧 Processing tool call with arguments: ${toolCall.function.arguments}`)
                            
                            let filters = {}
                            let reasoning = ''
                            if (toolCall.function.arguments && toolCall.function.arguments.trim()) {
                              const parsedArgs = JSON.parse(toolCall.function.arguments)
                              const { reasoning: aiReasoning, ...filterParams } = parsedArgs
                              filters = filterParams
                              reasoning = aiReasoning || 'No reasoning provided'
                            }
                            
                            console.log(`🧠 AI Reasoning: ${reasoning}`)
                            console.log(`🔧 Applying filters:`, filters)
                            
                            const result = await applyFilters(filters, userId)
                            console.log(`✅ Applied filters:`, result)
                            
                            // Stream tool result to client immediately
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                              toolResults: [result],
                              message: `🧠 Smart AI: ${result.message}`,
                              intelligence: 'Applied filters based on your request',
                              reasoning: reasoning
                            })}\n\n`))
                            
                            toolResults.push(result)
                          } catch (error) {
                            console.error('Tool execution failed:', error)
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                              toolResults: [{ success: false, error: error instanceof Error ? error.message : 'Unknown error' }],
                              message: 'AI failed to execute filter'
                            })}\n\n`))
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

          // Log final response
          console.log(`📄 Full AI Response: ${fullResponse}`)

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
