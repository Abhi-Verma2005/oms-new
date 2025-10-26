import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ragSystem } from '@/lib/rag-minimal'
import { applyFilters } from '@/lib/tools-minimal'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { messages, userId, documentUpload, currentFilters: requestCurrentFilters } = await req.json()
    
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

    // ===== STAGE 1: TEXT RESPONSE GENERATION =====
    console.log('\n📝 STAGE 1: Generating conversational response...')
    
    const stage1SystemMessage = {
      role: 'system' as const,
      content: `You are an intelligent assistant for a publisher marketplace. You understand all filter parameters and can help users find the perfect websites.

**CURRENT FILTERS:**
${currentFiltersContext}

**CONVERSATION CONTEXT:**
${messages.length > 1 ? `Previous conversation: ${messages.slice(-3).map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n')}` : 'This is the start of our conversation.'}

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

**CONTEXTUAL UNDERSTANDING:**

**Business Context Recognition:**
- "for my new product launch" → Suggest high-quality, established sites with good traffic
- "for testing purposes" → Suggest budget-friendly, lower-quality sites for experimentation
- "for long-term strategy" → Suggest high-quality, established sites with strong authority
- "for quick wins" → Suggest medium-quality, affordable sites with good ROI potential
- "for my existing blog" → Consider current site metrics and suggest complementary sites
- "for my e-commerce store" → Focus on sites with good conversion potential

**Campaign Context:**
- "Black Friday campaign" → Suggest sites with high traffic and seasonal relevance
- "holiday season" → Consider seasonal content and traffic patterns
- "product launch" → Prioritize authority and credibility
- "brand awareness" → Focus on high-traffic, reputable sites
- "link building" → Balance quality with affordability

**Budget Context:**
- "I have $500 total budget" → Suggest multiple sites within budget
- "unlimited budget" → Focus on highest quality options
- "need to test first" → Suggest lower-cost options for initial testing
- "ROI focused" → Prioritize sites with best value proposition

**Timeline Context:**
- "need results this week" → Suggest sites with quick turnaround
- "long-term strategy" → Focus on established, stable sites
- "urgent campaign" → Prioritize available, responsive sites

**RESPONSE STYLE:**
- Be conversational and helpful
- Show understanding of their business needs and context
- Reference previous conversation when relevant
- Don't mention technical parameter names
- Focus on what they'll get, not how you'll do it
- Be confident about your recommendations
- Provide business insights and strategic advice

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
        max_tokens: 800,
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
- EXPLORATION: User wants to discover options → Call applyFilters with broad criteria
- COMPARISON: User wants to compare options → Call applyFilters with multiple criteria
- RECOMMENDATION: User wants suggestions → Call applyFilters with intelligent defaults
- EDUCATION: User wants to learn → No tool needed, provide educational response
- PLANNING: User wants strategic advice → Provide recommendations + call applyFilters
- UNCLEAR: Ambiguous request → Ask for clarification or use best judgment
- ERROR: Invalid request → Handle gracefully with helpful suggestions

**ADVANCED USER INTENTS:**

**EXPLORATION MODE:**
- "show me what's available" → Apply broad, diverse filters
- "what options do I have?" → Show variety of quality levels and niches
- "browse around" → Apply minimal filters for discovery

**COMPARISON MODE:**
- "compare these two" → Apply specific filters for comparison
- "vs that one" → Apply alternative filters for comparison
- "which is better?" → Apply quality-focused filters

**RECOMMENDATION MODE:**
- "what would you suggest?" → Apply intelligent defaults based on context
- "recommend some sites" → Apply balanced quality/price filters
- "what's best for me?" → Apply personalized filters based on conversation

**EDUCATION MODE:**
- "teach me about..." → Provide educational content, no filters
- "how does X work?" → Explain concepts, no filters
- "what should I know?" → Provide strategic advice, no filters

**PLANNING MODE:**
- "help me plan..." → Provide strategic advice + apply relevant filters
- "strategy for..." → Suggest approach + apply supporting filters
- "roadmap for..." → Provide step-by-step plan + apply initial filters

**ERROR HANDLING:**
- Invalid filter values (DA > 100, negative prices) → Suggest valid ranges
- Conflicting requests → Resolve by prioritizing based on context
- Empty results scenarios → Suggest alternative approaches
- Ambiguous terms → Ask for clarification or provide options
- Technical errors → Provide fallback suggestions

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

**COMPLEX SCENARIOS:**

**Conflicting Filters:**
- "cheap high-quality" → Resolve by prioritizing quality (daMin: 50, priceMax: 300)
- "expensive budget" → Resolve by prioritizing budget (priceMax: 200)
- "low spam premium" → Resolve by prioritizing premium (daMin: 60, spamMax: 2)

**Range Modifications:**
- "tighter price range" → Reduce current price range by 25%
- "wider DA range" → Expand current DA range by 50%
- "more strict spam" → Lower spamMax by 2 points
- "less strict quality" → Lower daMin by 10 points

**Relative Adjustments:**
- "more expensive" → Increase priceMin by 50%, decrease priceMax by 25%
- "cheaper" → Decrease priceMax by 50%
- "higher quality" → Increase daMin by 10 points
- "lower spam" → Decrease spamMax by 2 points
- "stricter" → Increase quality thresholds, decrease spam tolerance
- "looser" → Decrease quality thresholds, increase spam tolerance

**Multiple Operations:**
- "change both country and price" → Replace both country and price filters
- "update quality and add traffic" → Replace quality filters, add traffic filter
- "clear price but keep quality" → Remove price filters, keep quality filters

**Contextual Understanding:**
- "for my new product launch" → Suggest high-quality, established sites
- "for testing" → Suggest budget-friendly, lower-quality sites
- "for long-term strategy" → Suggest high-quality, established sites
- "for quick wins" → Suggest medium-quality, affordable sites

**4. SMART FILTER MERGING:**

**For APPEND operations:**
- Start with current filters
- Add new filters
- Keep existing values unless explicitly changed

**For REPLACE operations:**
- Start with current filters
- Replace only the mentioned filter type
- Keep all other filters unchanged

**For MULTIPLE REPLACE operations:**
- Start with current filters
- Replace all mentioned filter types
- Keep all other filters unchanged

**For CLEAR ALL operations:**
- Start with empty filters
- Add only the new filters mentioned

**For PARTIAL CLEAR operations:**
- Start with current filters
- Remove specific filter categories (quality, price, geographic, etc.)
- Keep all other filters unchanged

**For REMOVE operations:**
- Start with current filters
- Remove only the mentioned filter type
- Keep all other filters unchanged

**For RANGE MODIFICATION operations:**
- Start with current filters
- Modify existing ranges by specified percentage
- Keep all other filters unchanged

**For RELATIVE ADJUSTMENT operations:**
- Start with current filters
- Adjust existing values relatively
- Keep all other filters unchanged

**CONFLICT RESOLUTION:**
- When conflicts arise, prioritize based on context
- "cheap high-quality" → Prioritize quality, adjust price accordingly
- "expensive budget" → Prioritize budget, adjust quality accordingly
- Always explain the resolution in reasoning

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

Example 5 - MULTIPLE REPLACE:
User: "change both country and price"
Current: { niche: "tech", country: "india", daMin: 50, priceMax: 500 }
Response: "I'll update both the country and price filters..."
Analysis:
{
  "shouldExecuteTool": true,
  "reasoning": "Multiple replacement request - user wants to change both country and price filters while keeping niche and quality",
  "toolName": "applyFilters",
  "parameters": {
    "niche": "tech",
    "country": "us",
    "daMin": 50,
    "priceMax": 300
  },
  "confidence": 0.90
}

Example 6 - PARTIAL CLEAR:
User: "clear quality filters but keep niche"
Current: { niche: "tech", daMin: 50, drMin: 50, spamMax: 3, priceMax: 300 }
Response: "I'll remove the quality restrictions while keeping your tech niche..."
Analysis:
{
  "shouldExecuteTool": true,
  "reasoning": "Partial clear request - user wants to remove quality filters (daMin, drMin, spamMax) while keeping niche and price",
  "toolName": "applyFilters",
  "parameters": {
    "niche": "tech",
    "priceMax": 300
  },
  "confidence": 0.95
}

Example 7 - RANGE MODIFICATION:
User: "make the price range tighter"
Current: { priceMin: 100, priceMax: 800 }
Response: "I'll narrow the price range for more focused results..."
Analysis:
{
  "shouldExecuteTool": true,
  "reasoning": "Range modification request - user wants to tighten the current price range by 25%",
  "toolName": "applyFilters",
  "parameters": {
    "priceMin": 150,
    "priceMax": 600
  },
  "confidence": 0.88
}

Example 8 - RELATIVE ADJUSTMENT:
User: "make it more expensive"
Current: { priceMin: 200, priceMax: 500 }
Response: "I'll adjust the price range to focus on higher-end options..."
Analysis:
{
  "shouldExecuteTool": true,
  "reasoning": "Relative adjustment request - user wants to increase price focus by raising priceMin and adjusting priceMax",
  "toolName": "applyFilters",
  "parameters": {
    "priceMin": 300,
    "priceMax": 375
  },
  "confidence": 0.85
}

Example 9 - CONFLICTING FILTERS:
User: "show me cheap high-quality sites"
Current: {}
Response: "I'll find high-quality sites that offer good value for money..."
Analysis:
{
  "shouldExecuteTool": true,
  "reasoning": "Conflicting filters resolved by prioritizing quality - user wants high quality but affordable, so setting quality thresholds with reasonable price limit",
  "toolName": "applyFilters",
  "parameters": {
    "daMin": 50,
    "drMin": 50,
    "spamMax": 3,
    "priceMax": 300
  },
  "confidence": 0.92
}

Example 10 - CONTEXTUAL UNDERSTANDING:
User: "for my new product launch"
Current: {}
Response: "I'll find high-quality, established sites perfect for launching your new product..."
Analysis:
{
  "shouldExecuteTool": true,
  "reasoning": "Contextual request - user needs high-quality, established sites for product launch, prioritizing authority and credibility",
  "toolName": "applyFilters",
  "parameters": {
    "daMin": 60,
    "drMin": 60,
    "spamMax": 2,
    "trafficMin": 10000
  },
  "confidence": 0.94
}

Example 11 - EXPLORATION:
User: "show me what's available"
Current: {}
Response: "I'll show you a variety of options across different quality levels and niches..."
Analysis:
{
  "shouldExecuteTool": true,
  "reasoning": "Exploration request - user wants to discover available options, so applying broad filters to show variety",
  "toolName": "applyFilters",
  "parameters": {
    "daMin": 20,
    "priceMax": 1000
  },
  "confidence": 0.90
}

Example 12 - RECOMMENDATION:
User: "what would you suggest for my tech startup?"
Current: {}
Response: "For a tech startup, I'd recommend high-quality sites that offer good value..."
Analysis:
{
  "shouldExecuteTool": true,
  "reasoning": "Recommendation request - user wants personalized suggestions for tech startup, applying balanced quality/price filters",
  "toolName": "applyFilters",
  "parameters": {
    "niche": "tech",
    "daMin": 40,
    "drMin": 40,
    "spamMax": 4,
    "priceMax": 500
  },
  "confidence": 0.92
}

Example 13 - EDUCATION:
User: "teach me about backlink strategies"
Response: "Backlink strategies involve several key principles..."
Analysis:
{
  "shouldExecuteTool": false,
  "reasoning": "Education request - user wants to learn about backlink strategies, no filter operation needed",
  "toolName": null,
  "parameters": {},
  "confidence": 0.95
}

Example 14 - PLANNING:
User: "help me plan a 3-month link building campaign"
Response: "I'll help you create a strategic 3-month plan and find the right sites to start with..."
Analysis:
{
  "shouldExecuteTool": true,
  "reasoning": "Planning request - user wants strategic advice and initial site recommendations for campaign planning",
  "toolName": "applyFilters",
  "parameters": {
    "daMin": 30,
    "priceMax": 300,
    "spamMax": 5
  },
  "confidence": 0.88
}

Example 15 - INFORMATION:
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
              max_tokens: 1000
            })
          })

          if (!stage2Response.ok) {
            throw new Error(`Stage 2 API error: ${stage2Response.status}`)
          }

          const stage2Data = await stage2Response.json()
          const rawContent = stage2Data.choices[0]?.message?.content || '{}'
          
          // Clean and parse JSON response
          let analysis
          try {
            // Remove any text before the first { and after the last }
            const jsonStart = rawContent.indexOf('{')
            const jsonEnd = rawContent.lastIndexOf('}') + 1
            
            if (jsonStart !== -1 && jsonEnd > jsonStart) {
              const jsonContent = rawContent.substring(jsonStart, jsonEnd)
              analysis = JSON.parse(jsonContent)
            } else {
              throw new Error('No valid JSON found in response')
            }
          } catch (parseError) {
            console.error('❌ JSON Parse Error:', parseError)
            console.error('Raw content:', rawContent)
            
            // Fallback: create a basic analysis
            analysis = {
              shouldExecuteTool: false,
              reasoning: 'Failed to parse AI response, defaulting to no action',
              toolName: null,
              parameters: {},
              confidence: 0.1
            }
          }
          
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
