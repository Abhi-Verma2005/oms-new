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
          documentContext = formatDocumentContextForAllTypes(relevantChunks, userMessage)
          
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
- **Domain Authority (DA)**: 0-100, measures website authority and ranking potential
  * 🌟 Excellent: 70-100 (top-tier sites, very competitive)
  * ✅ Good: 50-69 (quality sites, good for most campaigns)
  * 📊 Medium: 30-49 (decent sites, budget-friendly)
  * 📉 Low: 0-29 (newer/weaker sites, very affordable)
  * Filter: daMin, daMax

- **Page Authority (PA)**: 0-100, measures individual page strength
  * 🌟 Excellent: 60-100 (strong individual pages)
  * ✅ Good: 40-59 (solid page authority)
  * 📊 Medium: 20-39 (moderate page strength)
  * Filter: paMin, paMax

- **Domain Rating (DR)**: 0-100, Ahrefs' authority metric
  * 🌟 Excellent: 70-100 (high authority)
  * ✅ Good: 50-69 (solid authority)
  * 📊 Medium: 30-49 (moderate authority)
  * Filter: drMin, drMax

- **Spam Score**: 0-100, lower is better (Moz's spam detection)
  * ✨ Clean: 0-2 (very clean, high quality)
  * ✅ Good: 3-5 (acceptable, minor issues)
  * ⚠️ Risky: 6-10 (some spam signals)
  * ❌ High Risk: 11+ (avoid these sites)
  * Filter: spamMin, spamMax

**Pricing:**
- **Price Range**: $0-$5000+ per backlink
  * 💰 Budget: $0-100 (affordable, good for testing)
  * 💵 Mid-range: $100-500 (balanced quality/price)
  * 💎 Premium: $500-1500 (high-quality sites)
  * 👑 Luxury: $1500+ (top-tier, very competitive)
  * Filter: priceMin, priceMax

**Turnaround Time (TAT):**
- **TAT Days**: 0-60 days, how long it takes to publish
  * ⚡ Express: 1-3 days (quick turnaround)
  * 🚀 Fast: 4-7 days (standard fast service)
  * 📅 Normal: 8-14 days (regular timeline)
  * 🕐 Slow: 15-30 days (slower processing)
  * 🐢 Very Slow: 31+ days (extended timeline)
  * Filter: tatDaysMin, tatDaysMax

**Geographic & Language:**
- **Country**: us, uk, ca, au, india, de, fr, es, it, br, mx, etc.
  * Filter: country
- **Language**: en, es, fr, de, it, pt (English, Spanish, French, German, Italian, Portuguese)
  * Filter: language

**Content & Niche:**
- **Niches**: technology, health, finance, business, lifestyle, education, travel, food, sports, entertainment, news, blog, ecommerce
  * Each niche has different quality standards and pricing
  * Filter: niche

**Traffic & Performance:**
- **Semrush Overall Traffic**: 1K-1M+ monthly visitors
  * 🔥 High Traffic: 100K+ (very popular sites)
  * 📈 Medium Traffic: 10K-100K (established sites)
  * 📊 Low Traffic: 1K-10K (growing sites)
  * Filter: semrushOverallTrafficMin

- **Semrush Organic Traffic**: Organic search traffic
  * Filter: semrushOrganicTrafficMin

- **Traffic Trend**: Site traffic trajectory
  * 📈 Increasing: Growing visitor base
  * ➡️ Stable: Consistent traffic
  * 📉 Decreasing: Declining visitors
  * Filter: trend

**Backlink Quality:**
- **Backlink Nature**: Link type and SEO value
  * 🔗 dofollow: Passes SEO value (most valuable)
  * 🚫 nofollow: No SEO value but traffic potential
  * 💰 sponsored: Paid link marker
  * Filter: backlinkNature

- **Link Placement**: Where your link appears
  * 📝 in-content: Within article body (most valuable)
  * 👤 author-bio: Author biography section
  * 🔽 footer: Page footer area
  * Filter: linkPlacement

- **Permanence**: How long the link stays
  * ♾️ lifetime: Permanent placement
  * 📅 12-months: One year guaranteed
  * Filter: permanence

**Publishing Constraints:**
- **Backlinks Allowed**: Minimum number of backlinks you can place
  * Filter: backlinksAllowedMin

- **Outbound Link Limit**: Maximum outbound links per article
  * Filter: outboundLinkLimitMax

**Availability:**
- **Availability**: Filter for currently available publishers only
  * Filter: availability (true/false)

**Search & Metadata:**
- **Sample URL**: Filter by sample URL patterns
  * Filter: sampleUrl
- **Remark**: Filter by website remarks/notes
  * Filter: remarkIncludes
- **Guidelines URL**: Filter by guidelines URL
  * Filter: guidelinesUrlIncludes
- **Disclaimer**: Filter by disclaimer content
  * Filter: disclaimerIncludes
- **Last Published**: Filter by last publication date
  * Filter: lastPublishedAfter

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

**RESPONSE STYLE & MARKDOWN FORMATTING:**
- Be conversational and helpful
- Show understanding of their needs
- Don't mention technical parameter names
- Focus on what they'll get, not how you'll do it
- Be confident about your recommendations
- **USE MARKDOWN FOR BEAUTIFUL FORMATTING:**
  * Use **bold** for important terms and numbers
  * Use bullet points with • or - for lists
  * Use emojis strategically to enhance readability (✅ ❌ 🎯 📊 💰 🔍 etc.)
  * Use line breaks for better readability
  * Use > blockquotes for important notes or tips
  * Use code formatting (with backticks) for specific values when relevant

**EXAMPLES:**

User: "Show me affordable tech sites"
You: "I'll find quality **tech publishers** that offer good value for money 💰. Let me search for sites with:
• Solid authority (DA 30-50)
• Reasonable pricing (under $300)
• Tech niche focus

This should give you affordable yet effective options for your campaign!"

User: "What makes a good website for backlinks?"
You: "Great question! Here's what makes an excellent backlink site:

**Key Quality Indicators:**
• **Domain Authority (DA)**: 50+ for strong ranking power
• **Spam Score**: Under 5 for clean, safe links
• **Niche Relevance**: Matches your industry/topic
• **Traffic**: Good organic traffic (10K+ monthly)
• **Link Type**: Dofollow for SEO value

> 💡 **Pro Tip**: The best sites balance authority with affordability. DA 50-70 sites often offer the sweet spot of quality without premium pricing!"

User: "Also show ones from India"
You: "Perfect! I'll **add India** 🇮🇳 to your current search criteria.

This will help you find:
• Local publishers with regional expertise
• Potentially more cost-effective options
• Sites with Indian audience reach"

User: "Clear everything and show me health sites"
You: "Starting fresh! 🔄 I'll clear all current filters and find quality **health & wellness publishers** for you.

Looking for:
• Health/medical niche sites
• Good authority and trust signals
• Clean spam profiles"

User: "Remove the price filter"
You: "Got it! 🔓 I'll **remove the price restriction** so you can see the full range of health sites:
• Budget-friendly options ($0-100)
• Mid-range sites ($100-500)
• Premium publishers ($500+)

This gives you complete visibility of all available options!"

User: "TAT minimum 5 days"
You: "I'll set the **turnaround time** ⚡ to a minimum of **5 days**. This means:
• Only sites that can publish within 5+ days
• Filters out slower publishers
• Ensures reasonable delivery speed for your content"

Be intelligent, helpful, use beautiful markdown formatting, and show that you understand both the technical aspects and the user's business needs.`
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

**Turnaround Time (TAT):**
- "express", "quick", "fast turnaround" → tatDaysMax: 3
- "fast", "quick delivery" → tatDaysMax: 7
- "normal", "standard" → tatDaysMax: 14
- "slow", "patient" → tatDaysMax: 30
- "TAT min 5", "minimum 5 days", "at least 5 days" → tatDaysMin: 5
- "TAT max 10", "maximum 10 days", "within 10 days" → tatDaysMax: 10
- "between 5 and 10 days" → tatDaysMin: 5, tatDaysMax: 10
- "any turnaround", "don't care about TAT" → Remove tatDaysMin, tatDaysMax

**Geographic:**
- Country names → country: "[country_code]"
- "US", "USA", "America" → country: "us"
- "UK", "Britain" → country: "uk"
- "India" → country: "india"
- "Canada" → country: "ca"
- "Australia" → country: "au"
- "Germany" → country: "de"
- "France" → country: "fr"
- "Spain" → country: "es"
- "Italy" → country: "it"
- "Brazil" → country: "br"
- "Mexico" → country: "mx"
- "any country", "global" → Remove country filter

**Language:**
- "English" → language: "en"
- "Spanish" → language: "es"
- "French" → language: "fr"
- "German" → language: "de"
- "Italian" → language: "it"
- "Portuguese" → language: "pt"
- "any language" → Remove language filter

**Niche/Topic:**
- Industry mentions → niche: "[niche]"
- "tech", "technology" → niche: "technology"
- "health", "medical", "wellness" → niche: "health"
- "finance", "financial" → niche: "finance"
- "business" → niche: "business"
- "lifestyle" → niche: "lifestyle"
- "education" → niche: "education"
- "travel" → niche: "travel"
- "food" → niche: "food"
- "sports" → niche: "sports"
- "entertainment" → niche: "entertainment"
- "news" → niche: "news"
- "blog" → niche: "blog"
- "ecommerce", "shopping" → niche: "ecommerce"
- "any niche", "all topics" → Remove niche filter

**Traffic:**
- "high traffic", "popular", "busy" → semrushOverallTrafficMin: 50000
- "medium traffic", "established" → semrushOverallTrafficMin: 10000
- "low traffic", "growing" → semrushOverallTrafficMin: 1000
- "organic traffic" → semrushOrganicTrafficMin: [value]
- "increasing traffic", "growing" → trend: "increasing"
- "stable traffic", "consistent" → trend: "stable"
- "declining traffic", "decreasing" → trend: "decreasing"
- "any traffic" → Remove semrushOverallTrafficMin, semrushOrganicTrafficMin, trend

**Backlink Quality:**
- "dofollow", "do-follow", "follow links" → backlinkNature: "dofollow"
- "nofollow", "no-follow" → backlinkNature: "nofollow"
- "sponsored links" → backlinkNature: "sponsored"
- "in-content", "content links" → linkPlacement: "in-content"
- "author bio", "bio links" → linkPlacement: "author-bio"
- "footer links" → linkPlacement: "footer"
- "permanent", "lifetime" → permanence: "lifetime"
- "12 months", "one year" → permanence: "12-months"
- "any link type" → Remove backlinkNature, linkPlacement, permanence

**Publishing Constraints:**
- "multiple backlinks", "X backlinks allowed" → backlinksAllowedMin: [value]
- "limited outbound", "max X outbound" → outboundLinkLimitMax: [value]
- "available only", "in stock" → availability: true
- "any availability" → Remove availability

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

Example 5 - TAT FILTER:
User: "TAT min I want 6"
Current: { niche: "tech" }
Response: "I'll set the minimum turnaround time to 6 days..."
Analysis:
{
  "shouldExecuteTool": true,
  "reasoning": "Additive TAT filter request - user wants to add minimum turnaround time to existing tech filter",
  "toolName": "applyFilters",
  "parameters": {
    "niche": "tech",
    "tatDaysMin": 6
  },
  "confidence": 0.95
}

Example 6 - TAT RANGE:
User: "turnaround time between 5 and 10 days"
Current: { priceMax: 500 }
Response: "I'll filter for sites with 5-10 day turnaround..."
Analysis:
{
  "shouldExecuteTool": true,
  "reasoning": "TAT range filter - user wants sites with specific turnaround time range",
  "toolName": "applyFilters",
  "parameters": {
    "priceMax": 500,
    "tatDaysMin": 5,
    "tatDaysMax": 10
  },
  "confidence": 0.93
}

Example 7 - INFORMATION:
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

// Helper function to format document context for CSV, XLSX, DOCX, PDF and other documents
function formatDocumentContextForAllTypes(chunks: any[], userMessage: string): string {
  const csvChunks = chunks.filter(chunk => chunk.metadata?.chunkType?.startsWith('csv_'))
  const xlsxChunks = chunks.filter(chunk => chunk.metadata?.chunkType?.startsWith('xlsx_'))
  const docxChunks = chunks.filter(chunk => chunk.metadata?.chunkType?.startsWith('docx_'))
  const pdfChunks = chunks.filter(chunk => chunk.metadata?.chunkType?.startsWith('pdf_'))
  const otherChunks = chunks.filter(chunk => 
    !chunk.metadata?.chunkType?.startsWith('csv_') && 
    !chunk.metadata?.chunkType?.startsWith('xlsx_') &&
    !chunk.metadata?.chunkType?.startsWith('docx_') &&
    !chunk.metadata?.chunkType?.startsWith('pdf_')
  )
  
  let context = '**📄 RELEVANT DOCUMENT CONTEXT:**\n\n'
  
  // DOCX-specific context with priority ordering
  if (docxChunks.length > 0) {
    context += '**📄 Word Document Analysis:**\n'
    
    // Sort DOCX chunks by priority (high -> medium -> low)
    const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 }
    docxChunks.sort((a, b) => {
      const aPriority = priorityOrder[a.metadata?.priority] ?? 2
      const bPriority = priorityOrder[b.metadata?.priority] ?? 2
      return aPriority - bPriority
    })
    
    docxChunks.forEach((chunk, i) => {
      const chunkType = chunk.metadata?.chunkType
      const relevance = (chunk.score * 100).toFixed(0)
      
      if (chunkType === 'docx_summary') {
        context += `[Document Summary - ${chunk.documentName}] (Relevance: ${relevance}%)\n${chunk.content}\n\n`
      } else if (chunkType === 'docx_outline') {
        context += `[Document Outline - ${chunk.documentName}] (Relevance: ${relevance}%)\n${chunk.content}\n\n`
      } else if (chunkType === 'docx_section') {
        const heading = chunk.metadata?.heading ? ` - ${chunk.metadata.heading}` : ''
        context += `[Section${heading} - ${chunk.documentName}] (Relevance: ${relevance}%)\n${chunk.content}\n\n`
      } else if (chunkType === 'docx_table') {
        context += `[Table ${chunk.metadata?.tableIndex + 1} - ${chunk.documentName}] (Relevance: ${relevance}%)\n${chunk.content}\n\n`
      } else if (chunkType === 'docx_list') {
        const listType = chunk.metadata?.listType === 'ordered' ? 'Numbered' : 'Bulleted'
        context += `[${listType} List ${chunk.metadata?.listIndex + 1} - ${chunk.documentName}] (Relevance: ${relevance}%)\n${chunk.content}\n\n`
      } else if (chunkType === 'docx_content_analysis') {
        context += `[Content Analysis - ${chunk.documentName}] (Relevance: ${relevance}%)\n${chunk.content}\n\n`
      } else if (chunkType === 'docx_paragraph') {
        context += `[Paragraphs ${chunk.metadata?.paragraphRange} - ${chunk.documentName}] (Relevance: ${relevance}%)\n${chunk.content}\n\n`
      }
    })
  }
  
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
  
  // PDF-specific context with priority ordering
  if (pdfChunks.length > 0) {
    context += '**📄 PDF Document Analysis:**\n'
    
    // Sort PDF chunks by priority (high -> medium -> low)
    const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 }
    pdfChunks.sort((a, b) => {
      const aPriority = priorityOrder[a.metadata?.priority] ?? 2
      const bPriority = priorityOrder[b.metadata?.priority] ?? 2
      return aPriority - bPriority
    })
    
    pdfChunks.forEach((chunk, i) => {
      const chunkType = chunk.metadata?.chunkType
      const relevance = (chunk.score * 100).toFixed(0)
      
      if (chunkType === 'pdf_summary') {
        context += `[Document Summary - ${chunk.documentName}] (Relevance: ${relevance}%)\n${chunk.content}\n\n`
      } else if (chunkType === 'pdf_outline') {
        context += `[Document Outline - ${chunk.documentName}] (Relevance: ${relevance}%)\n${chunk.content}\n\n`
      } else if (chunkType === 'pdf_table') {
        context += `[Table ${chunk.metadata?.tableIndex + 1} - Page ${chunk.metadata?.pageNumber} - ${chunk.documentName}] (Relevance: ${relevance}%)\n${chunk.content}\n\n`
      } else if (chunkType === 'pdf_content_analysis') {
        context += `[Content Analysis - ${chunk.documentName}] (Relevance: ${relevance}%)\n${chunk.content}\n\n`
      } else if (chunkType === 'pdf_section') {
        const sectionTitle = chunk.metadata?.sectionTitle ? ` - ${chunk.metadata.sectionTitle}` : ''
        context += `[Section${sectionTitle} - ${chunk.documentName}] (Relevance: ${relevance}%)\n${chunk.content}\n\n`
      } else if (chunkType === 'pdf_page') {
        context += `[Page ${chunk.metadata?.pageNumber} - ${chunk.documentName}] (Relevance: ${relevance}%)\n${chunk.content}\n\n`
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
  
  context += '**Instructions:** Use this document context to provide accurate, data-driven responses. Reference specific values, columns, rows, sheets, sections, tables, lists, and pages when relevant. For Excel workbooks, prioritize workbook summaries and sheet overviews for general questions, and specific columns/statistics for detailed analysis. For Word documents, prioritize document summaries and outlines for general questions, and specific sections/tables for detailed analysis. For PDF documents, prioritize document summaries and outlines for general questions, and specific sections/tables/pages for detailed analysis.'
  
  return context
}