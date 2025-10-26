import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ragSystem } from '@/lib/rag-minimal'
import { applyFilters } from '@/lib/tools-minimal'

export const maxDuration = 60

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

  } catch (error) {
    console.error('❌ API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
