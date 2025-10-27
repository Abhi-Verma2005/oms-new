import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ragSystem } from '@/lib/rag-minimal'
import { applyFilters } from '@/lib/tools-minimal'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { messages, userId, documentUpload, currentFilters: requestCurrentFilters, selectedDocuments } = await req.json()
    
    if (!userId || !messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    // Use current filters from request body (sent by frontend)
    const currentFilters = requestCurrentFilters || {}
    
    const userMessage = messages[messages.length - 1]?.content || ''
    console.log(`🚀 Two-Stage LLM Processing for user ${userId}`)
    console.log(`📊 Current filters from frontend:`, currentFilters)
    
    const currentFiltersContext = Object.keys(currentFilters).length > 0 
      ? `Current filters: ${JSON.stringify(currentFilters, null, 2)}`
      : 'No filters currently applied'

    // FIXED: Smart document context retrieval
    let documentContext = ''
    let documentInsights = null
    
    if (selectedDocuments && selectedDocuments.length > 0) {
      try {
        console.log(`📄 Searching document context for ${selectedDocuments.length} documents...`)
        
        // Search with token limits
        const relevantChunks = await ragSystem.searchDocumentChunks(
          userMessage, 
          userId, 
          3, // Top 3 chunks (reduced)
          2000 // Max 2000 tokens (reduced)
        )
        
        if (relevantChunks.length > 0) {
          // Enhanced document context formatting for CSV and other documents
          documentContext = formatDocumentContextForCSV(relevantChunks, userMessage)
          
          console.log(`✅ Found ${relevantChunks.length} relevant document chunks`)
        }
      } catch (error) {
        console.error('❌ Document context error:', error)
        // Continue without document context
      }
    }

    // ===== STAGE 1: TEXT RESPONSE GENERATION =====
    console.log('\n📝 STAGE 1: Generating conversational response...')
    
    const stage1SystemMessage = {
      role: 'system' as const,
      content: `You are an intelligent assistant for a publisher marketplace. You understand all filter parameters and can help users find the perfect websites.

**CURRENT FILTERS:**
${currentFiltersContext}

${documentContext}

**COMPREHENSIVE FILTER KNOWLEDGE:**

**Quality Metrics:**
- Domain Authority (DA): 0-100, measures website authority and ranking potential
  * Excellent: 70-100 (top-tier sites, very competitive)
  * Good: 50-69 (quality sites, good for most campaigns)
  * Medium: 30-49 (decent sites, budget-friendly)
  * Low: 0-29 (newer/weaker sites, very affordable)

- Page Authority (PA): 0-100, measures individual page strength
  * Excellent: 60-100 (strong individual pages)
  * Good: 40-59 (solid page authority)
  * Medium: 20-39 (moderate page strength)

- Domain Rating (DR): 0-100, Ahrefs' authority metric
  * Excellent: 70-100 (high authority)
  * Good: 50-69 (solid authority)
  * Medium: 30-49 (moderate authority)

- Spam Score: 0-100, lower is better (Moz's spam detection)
  * Clean: 0-2 (very clean, high quality)
  * Good: 3-5 (acceptable, minor issues)
  * Risky: 6-10 (some spam signals)
  * High Risk: 11+ (avoid these sites)

**Pricing:**
- Price Range: $0-$5000+ per backlink
  * Budget: $0-100 (affordable, good for testing)
  * Mid-range: $100-500 (balanced quality/price)
  * Premium: $500-1500 (high-quality sites)
  * Luxury: $1500+ (top-tier, very competitive)

**Geographic & Language:**
- Country: us, uk, ca, au, india, etc.
- Language: English, Spanish, French, German, etc.

**Content & Niche:**
- Niches: tech, health, finance, business, lifestyle, education, travel, etc.
- Each niche has different quality standards and pricing

**Traffic & Performance:**
- Monthly Traffic: 1K-1M+ visitors
  * High Traffic: 100K+ (very popular sites)
  * Medium Traffic: 10K-100K (established sites)
  * Low Traffic: 1K-10K (growing sites)

**Backlink Quality:**
- Backlink Nature: dofollow, nofollow, mixed
- Link Placement: header, footer, content, sidebar
- Permanence: permanent, temporary, sponsored

**FILTER OPERATION INTELLIGENCE:**

**When to APPEND filters:**
- User says "also", "and", "plus", "add", "include"
- User wants to add more criteria to existing search
- Example: "also show ones from India" (adds country filter)

**When to REPLACE specific filters:**
- User says "change", "instead", "actually", "update"
- User wants to modify a specific aspect
- Example: "change price to under $200" (replaces price filter)

**When to CLEAR ALL filters:**
- User says "clear", "reset", "remove all", "start over", "new search"
- User wants a fresh start
- Example: "clear all filters and show me tech sites"

**When to REMOVE specific filters:**
- User says "remove", "no", "without", "exclude"
- User wants to eliminate a specific criteria
- Example: "remove the country filter" or "show sites without spam score requirement"

**SMART RESPONSES:**

**For Filter Requests:**
- Acknowledge what they want to find
- Mention quality level if implied
- Be specific about what you'll search for
- Examples:
  * "I'll find high-quality tech sites with strong authority for you."
  * "I'll add the India filter to your current search."
  * "I'll clear all filters and start fresh with your tech site search."

**For Questions:**
- Explain metrics in simple terms
- Give practical advice
- Relate to their needs
- Examples:
  * "Domain Authority predicts how well a site ranks. Higher DA means more competitive but better results."
  * "For a new campaign, I'd recommend sites with DA 30-50 - they're affordable but still effective."

**For Complex Requests:**
- Break down what they're asking for
- Suggest optimal combinations
- Explain trade-offs
- Examples:
  * "You want high-quality sites that are affordable. I'll find sites with good authority but reasonable pricing."
  * "For maximum impact, I'll look for sites with DA 50+ and low spam scores."

**RESPONSE STYLE:**
- Be conversational and helpful
- Show understanding of their needs
- Don't mention technical parameter names
- Focus on what they'll get, not how you'll do it
- Be confident about your recommendations

**EXAMPLES:**

User: "Show me affordable tech sites"
You: "I'll find quality tech publishers that offer good value for money. Let me search for sites with solid authority but reasonable pricing."

User: "What makes a good website for backlinks?"
You: "A good backlink site has strong Domain Authority (50+), low spam score (under 5), relevant content to your niche, and good traffic. The best sites are authoritative but not overly competitive."

User: "Also show ones from India"
You: "I'll add India to your current search criteria. This will help you find local publishers that might be more accessible and cost-effective."

User: "Clear everything and show me health sites"
You: "I'll start fresh and find quality health and wellness publishers for you. Let me search for sites with good authority in the health niche."

User: "Remove the price filter"
You: "I'll remove the price restriction so you can see all health sites regardless of cost. This will give you the full range of options available."

Be intelligent, helpful, and show that you understand both the technical aspects and the user's business needs.`
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
            content: `You are an intelligent filter operation analyzer. Your job is to determine what filter operations the user wants to perform.

**USER'S REQUEST:**
"${userMessage}"

**YOUR CONVERSATIONAL RESPONSE:**
"${stage1Response}"

**CURRENT FILTERS:**
${currentFiltersContext}

**FILTER OPERATION ANALYSIS:**

**1. DETERMINE INTENT:**
- ACTION: User wants to see/modify filtered results → Call applyFilters
- INFORMATION: User wants to learn/understand → No tool needed
- UNCLEAR: Ambiguous request → Use judgment

**2. IDENTIFY OPERATION TYPE:**

**APPEND (Add to existing):**
- Keywords: "also", "and", "plus", "add", "include", "show me X too"
- Action: Merge new filters with current filters
- Example: "also show ones from India" → Add country filter

**REPLACE (Change specific):**
- Keywords: "change", "instead", "actually", "update", "make it X"
- Action: Replace specific filter while keeping others
- Example: "change price to under $200" → Replace price filter

**MULTIPLE REPLACE (Change multiple):**
- Keywords: "change both", "update X and Y", "modify A and B"
- Action: Replace multiple filters while keeping others
- Example: "change both country and price" → Replace country and price filters

**CLEAR ALL (Start fresh):**
- Keywords: "clear", "reset", "remove all", "start over", "new search", "fresh"
- Action: Empty all filters
- Example: "clear all and show me tech sites" → Empty filters + add niche

**PARTIAL CLEAR (Clear specific category):**
- Keywords: "clear quality filters", "remove all price", "reset country settings"
- Action: Clear specific filter category while keeping others
- Example: "clear quality filters but keep niche" → Remove daMin, drMin, spamMax, keep niche

**REMOVE SPECIFIC (Eliminate one):**
- Keywords: "remove", "no", "without", "exclude", "don't want"
- Action: Remove specific filter from current set
- Example: "remove the country filter" → Remove country, keep others

**RANGE MODIFICATION (Adjust ranges):**
- Keywords: "tighter", "wider", "more strict", "less strict", "narrower", "broader"
- Action: Modify existing ranges
- Example: "make price range tighter" → Narrow current price range

**RELATIVE ADJUSTMENT (Relative changes):**
- Keywords: "more expensive", "cheaper", "higher quality", "lower spam", "stricter", "looser"
- Action: Adjust existing filters relatively
- Example: "make it more expensive" → Increase priceMin, decrease priceMax

**3. FILTER EXTRACTION RULES:**

**Quality/Authority:**
- "excellent", "top-tier", "premium" → daMin: 70, drMin: 70, spamMax: 2
- "high quality", "good", "strong" → daMin: 50, drMin: 50, spamMax: 3
- "medium", "decent", "average" → daMin: 30, drMin: 30, spamMax: 5
- "low quality", "budget" → daMin: 10, drMin: 10, spamMax: 8
- "clean", "low spam" → spamMax: 2
- "any quality", "don't care about quality" → Remove daMin, drMin, spamMax

**Pricing:**
- "luxury", "expensive", "premium" → priceMin: 1000
- "mid-range", "moderate" → priceMin: 200, priceMax: 800
- "affordable", "cheap", "budget" → priceMax: 300
- "very cheap", "dirt cheap" → priceMax: 100
- "any price", "don't care about price" → Remove priceMin, priceMax

**Geographic:**
- Country names → country: "[country_code]"
- "US", "USA", "America" → country: "us"
- "UK", "Britain" → country: "uk"
- "India" → country: "india"
- "any country", "global" → Remove country filter

**Niche/Topic:**
- Industry mentions → niche: "[niche]"
- "tech", "technology" → niche: "tech"
- "health", "medical" → niche: "health"
- "finance", "financial" → niche: "finance"
- "any niche", "all topics" → Remove niche filter

**Traffic:**
- "high traffic", "popular", "busy" → trafficMin: 50000
- "medium traffic", "established" → trafficMin: 10000
- "low traffic", "growing" → trafficMin: 1000
- "any traffic" → Remove trafficMin

**4. SMART FILTER MERGING:**

**For APPEND operations:**
- Start with current filters
- Add new filters
- Keep existing values unless explicitly changed

**For REPLACE operations:**
- Start with current filters
- Replace only the mentioned filter type
- Keep all other filters unchanged

**For CLEAR ALL operations:**
- Start with empty filters
- Add only the new filters mentioned

**For REMOVE operations:**
- Start with current filters
- Remove only the mentioned filter type
- Keep all other filters unchanged

**5. RESPONSE FORMAT:**

{
  "shouldExecuteTool": true/false,
  "reasoning": "Detailed explanation of the operation type and filters",
  "toolName": "applyFilters" or null,
  "parameters": {
    // Final filter object after operation
  },
  "confidence": 0.0-1.0
}

**EXAMPLES:**

Example 1 - APPEND:
User: "also show ones from India"
Current: { priceMax: 500, niche: "tech" }
Response: "I'll add India to your search..."
Analysis:
{
  "shouldExecuteTool": true,
  "reasoning": "Additive request - user wants to add country filter to existing tech and price filters",
  "toolName": "applyFilters",
  "parameters": {
    "priceMax": 500,
    "niche": "tech",
    "country": "india"
  },
  "confidence": 0.95
}

Example 2 - REPLACE:
User: "change price to under $200"
Current: { priceMax: 500, niche: "tech", country: "india" }
Response: "I'll update the price filter..."
Analysis:
{
  "shouldExecuteTool": true,
  "reasoning": "Replacement request - user wants to change price filter while keeping niche and country",
  "toolName": "applyFilters",
  "parameters": {
    "priceMax": 200,
    "niche": "tech",
    "country": "india"
  },
  "confidence": 0.92
}

Example 3 - CLEAR ALL:
User: "clear all and show me health sites"
Current: { priceMax: 500, niche: "tech", country: "india" }
Response: "I'll start fresh and find health sites..."
Analysis:
{
  "shouldExecuteTool": true,
  "reasoning": "Clear all request - user wants to start fresh with only health niche filter",
  "toolName": "applyFilters",
  "parameters": {
    "niche": "health"
  },
  "confidence": 0.98
}

Example 4 - REMOVE:
User: "remove the country filter"
Current: { priceMax: 500, niche: "tech", country: "india" }
Response: "I'll remove the country restriction..."
Analysis:
{
  "shouldExecuteTool": true,
  "reasoning": "Removal request - user wants to remove country filter while keeping price and niche",
  "toolName": "applyFilters",
  "parameters": {
    "priceMax": 500,
    "niche": "tech"
  },
  "confidence": 0.90
}

Example 5 - INFORMATION:
User: "what is domain authority?"
Response: "Domain Authority (DA) is a metric..."
Analysis:
{
  "shouldExecuteTool": false,
  "reasoning": "Information request - user asked a conceptual question, no filter operation needed",
  "toolName": null,
  "parameters": {},
  "confidence": 0.98
}

Be intelligent about understanding the user's intent and perform the correct filter operation.`
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
              
              // Send tool result to client (using old format for compatibility)
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                toolResults: [{
                  ...result,
                  analysis: {
                    reasoning: analysis.reasoning,
                    confidence: analysis.confidence
                  }
                }],
                message: `🧠 Smart AI: ${result.message}`,
                intelligence: 'Applied filters based on your request'
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

// Helper function to format document context for CSV, XLSX and other documents
function formatDocumentContextForCSV(chunks: any[], userMessage: string): string {
  const csvChunks = chunks.filter(chunk => chunk.metadata?.chunkType?.startsWith('csv_'))
  const xlsxChunks = chunks.filter(chunk => chunk.metadata?.chunkType?.startsWith('xlsx_'))
  const otherChunks = chunks.filter(chunk => 
    !chunk.metadata?.chunkType?.startsWith('csv_') && 
    !chunk.metadata?.chunkType?.startsWith('xlsx_')
  )
  
  let context = '**📄 RELEVANT DOCUMENT CONTEXT:**\n\n'
  
  // XLSX-specific context with priority ordering
  if (xlsxChunks.length > 0) {
    context += '**📊 Excel Workbook Analysis:**\n'
    
    // Sort XLSX chunks by priority (high -> medium -> low)
    const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 }
    xlsxChunks.sort((a, b) => {
      const aPriority = priorityOrder[a.metadata?.priority] ?? 2
      const bPriority = priorityOrder[b.metadata?.priority] ?? 2
      return aPriority - bPriority
    })
    
    xlsxChunks.forEach((chunk, i) => {
      const chunkType = chunk.metadata?.chunkType
      const relevance = (chunk.score * 100).toFixed(0)
      
      if (chunkType === 'xlsx_summary') {
        context += `[Workbook Summary - ${chunk.documentName}] (Relevance: ${relevance}%)\n${chunk.content}\n\n`
      } else if (chunkType === 'xlsx_sheet_overview') {
        context += `[Sheet: ${chunk.metadata?.sheetName} - ${chunk.documentName}] (Relevance: ${relevance}%)\n${chunk.content}\n\n`
      } else if (chunkType === 'xlsx_statistics') {
        context += `[Statistical Analysis - Sheet: ${chunk.metadata?.sheetName} - ${chunk.documentName}] (Relevance: ${relevance}%)\n${chunk.content}\n\n`
      } else if (chunkType === 'xlsx_column') {
        const columnType = chunk.metadata?.columnType ? ` (${chunk.metadata.columnType})` : ''
        context += `[Column: ${chunk.metadata?.columnName}${columnType} - Sheet: ${chunk.metadata?.sheetName} - ${chunk.documentName}] (Relevance: ${relevance}%)\n${chunk.content}\n\n`
      } else if (chunkType === 'xlsx_merged_cells') {
        context += `[Merged Cells - Sheet: ${chunk.metadata?.sheetName} - ${chunk.documentName}] (Relevance: ${relevance}%)\n${chunk.content}\n\n`
      } else if (chunkType === 'xlsx_cross_sheet') {
        context += `[Cross-Sheet Analysis - ${chunk.documentName}] (Relevance: ${relevance}%)\n${chunk.content}\n\n`
      }
    })
  }
  
  // CSV-specific context with priority ordering
  if (csvChunks.length > 0) {
    context += '**📊 CSV Data Analysis:**\n'
    
    // Sort CSV chunks by priority (high -> medium -> low)
    const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 }
    csvChunks.sort((a, b) => {
      const aPriority = priorityOrder[a.metadata?.priority] ?? 2
      const bPriority = priorityOrder[b.metadata?.priority] ?? 2
      return aPriority - bPriority
    })
    
    csvChunks.forEach((chunk, i) => {
      const chunkType = chunk.metadata?.chunkType
      const relevance = (chunk.score * 100).toFixed(0)
      
      if (chunkType === 'csv_summary') {
        context += `[Summary - ${chunk.documentName}] (Relevance: ${relevance}%)\n${chunk.content}\n\n`
      } else if (chunkType === 'csv_statistics') {
        context += `[Statistical Analysis - ${chunk.documentName}] (Relevance: ${relevance}%)\n${chunk.content}\n\n`
      } else if (chunkType === 'csv_column') {
        const columnType = chunk.metadata?.columnType ? ` (${chunk.metadata.columnType})` : ''
        context += `[Column: ${chunk.metadata?.columnName}${columnType} - ${chunk.documentName}] (Relevance: ${relevance}%)\n${chunk.content}\n\n`
      } else if (chunkType === 'csv_rows') {
        context += `[Rows ${chunk.metadata?.rowRange} - ${chunk.documentName}] (Relevance: ${relevance}%)\n${chunk.content}\n\n`
      }
    })
  }
  
  // Other document context
  if (otherChunks.length > 0) {
    context += '**📄 Other Document Content:**\n'
    otherChunks.forEach((chunk, i) => {
      context += `[${chunk.documentName} - Section ${chunk.chunkIndex + 1}] (Relevance: ${(chunk.score * 100).toFixed(0)}%)\n${chunk.content}\n\n`
    })
  }
  
  context += '**Instructions:** Use this document context to provide accurate, data-driven responses. Reference specific values, columns, rows, and sheets when relevant. For Excel workbooks, prioritize workbook summaries and sheet overviews for general questions, and specific columns/statistics for detailed analysis.'
  
  return context
}
