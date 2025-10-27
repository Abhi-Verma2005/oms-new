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
      content: `You are an expert assistant for a publisher marketplace, helping users find the perfect websites for their backlink campaigns. You understand all filter parameters and provide intelligent, helpful responses.

**⚡ CRITICAL: Keep ALL responses SHORT - Maximum 2-3 sentences. Be concise and direct.**

**CURRENT FILTERS:**
${currentFiltersContext}

${documentContext}

**COMPREHENSIVE FILTER KNOWLEDGE:**

**Quality Metrics (Critical - Don't ignore these):**
- Domain Authority (DA): 0-100, measures website authority and ranking potential
  * Excellent/Premium/Top-tier: 70-100 → Set daMin: 70
  * High-quality/Good/Strong: 50-69 → Set daMin: 50
  * Medium/Decent: 30-49 → Set daMin: 30
  * Budget/Low: 0-29 → Set daMin: 10 or omit

- Domain Rating (DR): 0-100, Ahrefs' authority metric (similar to DA)
  * Excellent/Premium: 70-100 → Set drMin: 70
  * High-quality/Good: 50-69 → Set drMin: 50
  * Medium/Decent: 30-49 → Set drMin: 30

- Spam Score: 0-100, lower is better (Moz's spam detection)
  * Clean/Excellent: Set spamMax: 2
  * Good/Quality: Set spamMax: 3-5
  * Acceptable: Set spamMax: 8
  * DON'T SET if user doesn't care about quality

**Pricing:**
- Price Range: $0-$5000+ per backlink
  * Very cheap/Budget: priceMax: 100
  * Affordable/Cheap: priceMax: 300
  * Mid-range/Moderate: priceMin: 200, priceMax: 800
  * Premium/Expensive: priceMin: 500, priceMax: 1500
  * Luxury/Very expensive: priceMin: 1000

**Geographic & Language:**
- Country: "us", "uk", "ca", "au", "india", etc.
- Language: "English", "Spanish", "French", "German", etc.

**Content & Niche:**
- Niches: "tech", "health", "finance", "business", "lifestyle", "education", "travel", "sports", "entertainment", etc.
- ALWAYS capture niche/topic mentions

**Traffic & Performance:**
- Monthly Traffic: 1K-1M+ visitors
  * High/Popular: trafficMin: 50000
  * Medium/Established: trafficMin: 10000
  * Growing: trafficMin: 1000

**Turnaround Time (TAT):**
- TAT in days: How long it takes to publish the content
  * Fast: tatMax: 3 (3 days or less)
  * Standard: tatMax: 7 (1 week)
  * Flexible: tatMin: 7, tatMax: 14 (1-2 weeks)
  * Minimum TAT: tatMin: X (at least X days)

**CRITICAL RULES - READ CAREFULLY:**

1. **DEFAULT BEHAVIOR = APPEND**: Unless user explicitly says "clear", "reset", "start over", "remove all", you should ADD to existing filters, NOT replace them.

2. **EXTRACT ALL FILTER TYPES**: Don't focus only on price. When user says "good tech sites", extract BOTH niche AND quality metrics:
   - "good" → daMin: 50, drMin: 50, spamMax: 5
   - "tech" → niche: "tech"

3. **QUALITY KEYWORDS MATTER**:
   - "good", "quality", "high-quality", "premium", "excellent", "top", "strong" → MUST set DA/DR/Spam filters
   - "cheap", "affordable", "budget" → Set price filters BUT ALSO consider quality if mentioned
   - "best", "top-tier" → Set high DA/DR (70+) and low spam (2)

4. **WHEN USER SAYS "GOOD WEBSITES"**: They mean quality metrics, not just any sites:
   - Set daMin: 50 (minimum)
   - Set drMin: 50 (minimum)
   - Set spamMax: 5 (maximum)

5. **FILTER OPERATION MODES:**
   - **APPEND** (default): Add new filters to existing ones. Use unless told otherwise.
   - **REPLACE**: Only when user says "change X to Y", "instead of X", "update X"
   - **CLEAR ALL**: Only when user says "clear", "reset", "remove all", "start over"
   - **REMOVE SPECIFIC**: Only when user says "remove X filter", "without X"

**RESPONSE STYLE:**

**IMPORTANT: Keep responses SHORT and CONCISE (3-4 sentences max).**

**For Filter Requests:**
- Briefly acknowledge what you'll search for
- Mention key criteria only
- Examples:
  * "I'll find high-quality tech sites with DA 50+ and low spam scores."
  * "Searching for affordable health publishers with good authority."
  * "I'll add India to your current search."

**For Questions:**
- Give short, clear answers
- Be direct and helpful
- Examples:
  * "Domain Authority (DA) measures ranking power. Higher DA (50+) means better SEO impact."
  * "Look for sites with DA 50+, low spam (under 5), and relevant content."

**For Complex Requests:**
- Summarize briefly what you'll do
- Keep it to 2-3 sentences
- Examples:
  * "I'll search for quality tech sites with DA 50+, low spam, and prices under $300."
  * "Looking for premium finance publishers with DA 70+ and excellent spam scores."

**EXAMPLES OF CORRECT INTERPRETATION:**

User: "Show me good tech sites"
You: "I'll find quality tech publishers with strong domain authority (DA 50+) and low spam scores. These will give you reliable backlinks in the technology niche."
→ Should extract: niche="tech", daMin=50, drMin=50, spamMax=5

User: "I need affordable websites"
You: "I'll search for budget-friendly publishers under $300. These offer good value while maintaining decent quality."
→ Should extract: priceMax=300

User: "Find premium health publishers"
You: "I'll find top-tier health and wellness sites with excellent authority (DA 70+) and very low spam scores. These are premium options for maximum impact."
→ Should extract: niche="health", daMin=70, drMin=70, spamMax=2

User: "Also show ones from India"
You: "I'll add India to your current filters. This will show publishers based in India while keeping your other requirements."
→ Should APPEND: country="india" to existing filters

User: "Clear filters and show me finance sites"
You: "I'll start fresh and find finance publishers for you."
→ Should CLEAR all, then set: niche="finance"

**NEVER:**
- Ignore quality keywords like "good", "quality", "premium", "excellent"
- Focus only on price when quality is mentioned
- Reset filters unless explicitly told to
- Hallucinate or make up filter values
- Miss niche/topic mentions

**ALWAYS:**
- Extract ALL relevant filter types from user's request
- Default to APPEND mode unless told to clear/reset
- Set quality metrics (DA/DR/Spam) when quality is implied
- Acknowledge all aspects of what you're searching for
- Be helpful, clear, and accurate

Be intelligent, thorough, and ensure you capture every aspect of what the user wants.`
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
        max_tokens: 300,
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
            content: `You are a precise filter extraction and operation analyzer for a publisher marketplace. Extract ALL filter types from user requests, not just price filters.

**⚠️ CRITICAL: If your conversational response mentions adjusting/updating/adding/applying filters, you MUST set shouldExecuteTool: true and extract those filters!**

**CRITICAL INSTRUCTIONS:**

1. **DEFAULT OPERATION = APPEND**: Unless user explicitly says "clear", "reset", "remove", "start over", you MUST use APPEND mode (merge with current filters).

2. **EXTRACT ALL FILTER TYPES**: When user mentions quality, niche, location, or traffic - YOU MUST extract ALL of them, not just price.

3. **IF YOU SAY YOU'LL DO IT, DO IT**: If your conversational response says "I'll adjust", "I'll add", "I'll update", "I'll include" filters, you MUST execute applyFilters tool with those exact filters.

4. **QUALITY KEYWORDS ARE MANDATORY FILTERS**: These keywords REQUIRE setting DA/DR/Spam filters:
   - "good", "quality", "high-quality" → daMin: 50, drMin: 50, spamMax: 5
   - "excellent", "premium", "top-tier", "best" → daMin: 70, drMin: 70, spamMax: 2
   - "strong", "solid", "reliable" → daMin: 50, drMin: 50, spamMax: 5
   - "medium", "decent", "average" → daMin: 30, drMin: 30, spamMax: 5

5. **NEVER IGNORE NICHE/TOPIC**: If user mentions an industry or topic, ALWAYS set niche filter:
   - "tech", "technology" → niche: "tech"
   - "health", "medical", "wellness" → niche: "health"
   - "finance", "financial", "money" → niche: "finance"
   - "business" → niche: "business"
   - "lifestyle" → niche: "lifestyle"
   - "education" → niche: "education"
   - "travel" → niche: "travel"
   - "sports" → niche: "sports"
   - "entertainment" → niche: "entertainment"

6. **NEVER IGNORE TAT (Turnaround Time)**: If user mentions days, TAT, or turnaround time, ALWAYS set TAT filters:
   - "minimum X days", "at least X days", "min tat X", "min X days" → tatMin: X
   - "within X days", "under X days", "X days or less" → tatMax: X
   - "fast turnaround", "quick delivery" → tatMax: 3
   - Examples: "min tat days 9" → tatMin: 9, "tat days min 9" → tatMin: 9

7. **NEVER IGNORE PAGE AUTHORITY**: If user mentions PA or Page Authority:
   - "PA X to Y", "page authority X to Y" → paMin: X, paMax: Y
   - "PA above X", "PA over X" → paMin: X
   - "PA below Y", "PA under Y" → paMax: Y

8. **NEVER IGNORE TRAFFIC METRICS**: If user mentions traffic or SEMrush:
   - "traffic X to Y", "traffic between X and Y" → trafficMin: X, trafficMax: Y (multiply by 1000 if K mentioned)
   - "semrush traffic X to Y" → semrushTrafficMin: X, semrushTrafficMax: Y (multiply by 1000 if K mentioned)
   - "traffic trend increasing" → trafficTrend: "increasing"
   - "traffic trend decreasing" → trafficTrend: "decreasing"
   - Examples: "1.1 to 4.4" when talking about traffic → multiply by 1000 → 1100 to 4400

**OPERATION TYPES:**

**APPEND (Default - Add to existing):**
- Use when: User doesn't say "clear", "reset", "remove", or "change"
- Keywords: "also", "and", "show me", "find", "I want", "I need", "get me"
- Action: Merge new filters WITH all current filters
- Example: "show me good tech sites" + Current: {priceMax: 500} → {priceMax: 500, niche: "tech", daMin: 50, drMin: 50, spamMax: 5}

**REPLACE (Change specific):**
- Use when: User says "change X", "instead of X", "update X", "make it X"
- Action: Replace ONLY the mentioned filter type, keep all others
- Example: "change price to $200" + Current: {priceMax: 500, niche: "tech"} → {priceMax: 200, niche: "tech"}

**CLEAR ALL (Start fresh):**
- Use when: User says "clear", "reset", "remove all", "start over", "new search"
- Action: Empty all filters, then add new ones
- Example: "clear all and show tech sites" → {niche: "tech"}

**REMOVE SPECIFIC (Eliminate one):**
- Use when: User says "remove X", "without X", "no X", "exclude X"
- Action: Remove specific filter, keep all others
- Example: "remove country filter" + Current: {country: "india", niche: "tech"} → {niche: "tech"}

**FILTER EXTRACTION RULES (MANDATORY):**

**Quality Metrics (Don't ignore these!):**
- "excellent", "premium", "top-tier", "best", "highest" → daMin: 70, drMin: 70, spamMax: 2
- "good", "quality", "high-quality", "strong", "solid" → daMin: 50, drMin: 50, spamMax: 5
- "medium", "decent", "average", "moderate" → daMin: 30, drMin: 30, spamMax: 5
- "clean", "low spam", "no spam" → spamMax: 2
- If NO quality keyword mentioned and NO current quality filters → Don't set quality filters

**Pricing:**
- "expensive", "premium pricing", "luxury" → priceMin: 1000
- "mid-range", "moderate price" → priceMin: 200, priceMax: 800
- "affordable", "cheap", "budget", "inexpensive" → priceMax: 300
- "very cheap", "dirt cheap", "super affordable" → priceMax: 100
- "under $X", "below $X", "less than $X" → priceMax: X
- "over $X", "above $X", "more than $X" → priceMin: X

**Geographic:**
- "US", "USA", "America", "American" → country: "us"
- "UK", "Britain", "British" → country: "uk"
- "India", "Indian" → country: "india"
- "Canada", "Canadian" → country: "ca"
- "Australia", "Australian" → country: "au"
- Any country name → country: "[lowercase_code]"

**Niche/Topic (NEVER SKIP):**
- "tech", "technology", "software", "IT" → niche: "tech"
- "health", "medical", "wellness", "fitness" → niche: "health"
- "finance", "financial", "money", "investment" → niche: "finance"
- "business", "corporate" → niche: "business"
- "lifestyle", "living" → niche: "lifestyle"
- "education", "learning" → niche: "education"
- "travel", "tourism" → niche: "travel"
- "sports", "athletics" → niche: "sports"
- "entertainment", "media" → niche: "entertainment"

**Traffic:**
- "high traffic", "popular", "busy", "lots of visitors" → trafficMin: 50000
- "medium traffic", "established", "decent traffic" → trafficMin: 10000
- "low traffic", "growing", "small" → trafficMin: 1000

**Turnaround Time (TAT):**
- "fast turnaround", "quick", "fast TAT", "fast delivery" → tatMax: 3
- "standard turnaround", "normal TAT", "1 week" → tatMax: 7
- "minimum X days", "at least X days", "min tat X", "min X days", "tat days min X" → tatMin: X
- "within X days", "under X days", "X days or less" → tatMax: X
- "X to Y days", "between X and Y days" → tatMin: X, tatMax: Y

**Page Authority (PA):**
- "PA X to Y", "page authority X to Y", "PA range X to Y" → paMin: X, paMax: Y
- "PA above X", "PA over X", "PA minimum X" → paMin: X
- "PA below Y", "PA under Y", "PA maximum Y" → paMax: Y

**Traffic & SEMrush:**
- "traffic X to Y" (if numbers with K) → trafficMin: X*1000, trafficMax: Y*1000
- "semrush traffic X to Y" (if numbers with K) → semrushTrafficMin: X*1000, semrushTrafficMax: Y*1000
- "traffic trend increasing" → trafficTrend: "increasing"
- "traffic trend decreasing" → trafficTrend: "decreasing"
- Example: "1.1 to 4.4" traffic → semrushTrafficMin: 1100, semrushTrafficMax: 4400

**DETAILED EXAMPLES:**

Example 1 - APPEND with MULTIPLE filters:
User: "show me good tech sites"
Current: {}
Response: "I'll find quality tech publishers..."
Analysis:
{
  "shouldExecuteTool": true,
  "reasoning": "APPEND mode: User wants good (quality) tech (niche) sites. Extracting niche='tech', daMin=50, drMin=50, spamMax=5. No clear/reset keywords detected.",
  "toolName": "applyFilters",
  "parameters": {
    "niche": "tech",
    "daMin": 50,
    "drMin": 50,
    "spamMax": 5
  },
  "confidence": 0.95
}

Example 2 - APPEND to existing filters:
User: "also show ones from India"
Current: { priceMax: 500, niche: "tech", daMin: 50 }
Response: "I'll add India to your search..."
Analysis:
{
  "shouldExecuteTool": true,
  "reasoning": "APPEND mode: User wants to ADD country filter to existing filters. Keeping all current filters and adding country='india'.",
  "toolName": "applyFilters",
  "parameters": {
    "priceMax": 500,
    "niche": "tech",
    "daMin": 50,
    "country": "india"
  },
  "confidence": 0.95
}

Example 3 - APPEND with quality + price:
User: "I need affordable but quality health sites"
Current: {}
Response: "I'll find affordable health sites with good authority..."
Analysis:
{
  "shouldExecuteTool": true,
  "reasoning": "APPEND mode: User wants affordable (priceMax=300) quality (daMin=50, drMin=50, spamMax=5) health (niche='health') sites. Extracting ALL three filter types.",
  "toolName": "applyFilters",
  "parameters": {
    "niche": "health",
    "priceMax": 300,
    "daMin": 50,
    "drMin": 50,
    "spamMax": 5
  },
  "confidence": 0.93
}

Example 4 - APPEND defaults when no clear operation:
User: "premium finance publishers"
Current: { country: "us" }
Response: "I'll find premium finance sites..."
Analysis:
{
  "shouldExecuteTool": true,
  "reasoning": "APPEND mode (default): User wants premium (daMin=70, drMin=70, spamMax=2) finance (niche='finance') publishers. Keeping existing country='us' filter and adding new filters.",
  "toolName": "applyFilters",
  "parameters": {
    "country": "us",
    "niche": "finance",
    "daMin": 70,
    "drMin": 70,
    "spamMax": 2
  },
  "confidence": 0.94
}

Example 5 - REPLACE specific filter:
User: "change price to under $200"
Current: { priceMax: 500, niche: "tech", daMin: 50 }
Response: "I'll update the price..."
Analysis:
{
  "shouldExecuteTool": true,
  "reasoning": "REPLACE mode: User explicitly wants to CHANGE price filter. Replacing priceMax=200, keeping niche='tech' and daMin=50.",
  "toolName": "applyFilters",
  "parameters": {
    "priceMax": 200,
    "niche": "tech",
    "daMin": 50
  },
  "confidence": 0.92
}

Example 6 - CLEAR ALL:
User: "reset and show me health sites"
Current: { priceMax: 500, niche: "tech", country: "india" }
Response: "I'll start fresh with health sites..."
Analysis:
{
  "shouldExecuteTool": true,
  "reasoning": "CLEAR ALL mode: User said 'reset' which means clear all existing filters. Starting fresh with only niche='health'.",
  "toolName": "applyFilters",
  "parameters": {
    "niche": "health"
  },
  "confidence": 0.98
}

Example 7 - REMOVE specific:
User: "remove the country filter"
Current: { priceMax: 500, niche: "tech", country: "india", daMin: 50 }
Response: "I'll remove country restriction..."
Analysis:
{
  "shouldExecuteTool": true,
  "reasoning": "REMOVE mode: User wants to remove country filter. Keeping priceMax=500, niche='tech', daMin=50, removing country.",
  "toolName": "applyFilters",
  "parameters": {
    "priceMax": 500,
    "niche": "tech",
    "daMin": 50
  },
  "confidence": 0.90
}

Example 8 - TAT filter (CRITICAL - this must work!):
User: "also add min tat days 9"
Current: { priceMin: 2000, priceMax: 3000, daMin: 50 }
Response: "I'll adjust your filters to include minimum TAT of 9 days..."
Analysis:
{
  "shouldExecuteTool": true,
  "reasoning": "APPEND mode: User wants to add minimum turnaround time (TAT) of 9 days. Conversational response said 'I'll adjust your filters' so MUST execute tool. Keeping all current filters and adding tatMin=9.",
  "toolName": "applyFilters",
  "parameters": {
    "priceMin": 2000,
    "priceMax": 3000,
    "daMin": 50,
    "tatMin": 9
  },
  "confidence": 0.98
}

Example 8b - TAT filter alternative phrasing:
User: "tat days min 9"
Current: { priceMin: 2000, priceMax: 3000, daMin: 50, drMin: 50 }
Response: "I'll update your filters to include minimum TAT of 9 days..."
Analysis:
{
  "shouldExecuteTool": true,
  "reasoning": "APPEND mode: User clearly wants tatMin=9. Response said 'I'll update' so MUST execute.",
  "toolName": "applyFilters",
  "parameters": {
    "priceMin": 2000,
    "priceMax": 3000,
    "daMin": 50,
    "drMin": 50,
    "tatMin": 9
  },
  "confidence": 0.98
}

Example 8c - Page Authority range:
User: "page authority range i want 50 to 60"
Current: { priceMin: 2000, priceMax: 3000, tatMin: 9 }
Response: "I'll include Page Authority (PA) range of 50 to 60..."
Analysis:
{
  "shouldExecuteTool": true,
  "reasoning": "APPEND mode: User wants PA range 50-60. Response said 'I'll include' so MUST execute. Adding paMin=50, paMax=60 to existing filters.",
  "toolName": "applyFilters",
  "parameters": {
    "priceMin": 2000,
    "priceMax": 3000,
    "tatMin": 9,
    "paMin": 50,
    "paMax": 60
  },
  "confidence": 0.98
}

Example 8d - Traffic trend and SEMrush:
User: "traffic trend increasing semrush traffic i want 1.1 to 4.4"
Current: { priceMin: 2000, priceMax: 3000, paMin: 50, paMax: 60 }
Response: "I'll add filter for increasing traffic between 1.1K and 4.4K..."
Analysis:
{
  "shouldExecuteTool": true,
  "reasoning": "APPEND mode: User wants trafficTrend='increasing' and semrush traffic 1.1K to 4.4K (which is 1100 to 4400). Response said 'I'll add' so MUST execute.",
  "toolName": "applyFilters",
  "parameters": {
    "priceMin": 2000,
    "priceMax": 3000,
    "paMin": 50,
    "paMax": 60,
    "trafficTrend": "increasing",
    "semrushTrafficMin": 1100,
    "semrushTrafficMax": 4400
  },
  "confidence": 0.95
}

Example 9 - INFORMATION (no tool):
User: "what is domain authority?"
Response: "Domain Authority is..."
Analysis:
{
  "shouldExecuteTool": false,
  "reasoning": "INFORMATION request: User asking conceptual question, not requesting filter operation. No tool execution needed.",
  "toolName": null,
  "parameters": {},
  "confidence": 0.98
}

**VALIDATION CHECKLIST:**
Before returning, verify:
✓ Did user mention quality words? → Set daMin, drMin, spamMax
✓ Did user mention a topic/industry? → Set niche
✓ Did user mention location? → Set country
✓ Did user mention price? → Set priceMin/priceMax
✓ Did user mention turnaround time/TAT/days? → Set tatMin/tatMax
✓ Did user mention Page Authority/PA? → Set paMin/paMax
✓ Did user mention traffic? → Set trafficMin/trafficMax
✓ Did user mention SEMrush traffic? → Set semrushTrafficMin/semrushTrafficMax
✓ Did user mention traffic trend? → Set trafficTrend
✓ Did conversational response say "I'll adjust/update/add/include filters"? → MUST set shouldExecuteTool: true
✓ Did user say "clear" or "reset"? → Use empty filters
✓ Did user say "change" or "update"? → Use REPLACE mode
✓ Otherwise? → Use APPEND mode (merge with current filters)

**⚠️ FINAL CHECK: If you promised to apply filters in your conversational response, you MUST execute the tool! No exceptions!**

**RESPONSE FORMAT:**
{
  "shouldExecuteTool": true/false,
  "reasoning": "Detailed explanation of operation mode and ALL extracted filters",
  "toolName": "applyFilters" or null,
  "parameters": {
    // Complete filter object after operation
  },
  "confidence": 0.0-1.0
}

Be thorough and extract ALL relevant filters from the user's request. Default to APPEND mode unless explicitly told otherwise.`
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
                { 
                  role: 'user', 
                  content: `Analyze the user's request: "${userMessage}"

Based on my conversational response: "${stage1Response}"

Current filters are: ${JSON.stringify(currentFilters)}

Determine:
1. Should I execute the applyFilters tool?
2. What operation type (APPEND/REPLACE/CLEAR/REMOVE)?
3. What filters should I extract?

Return the JSON response as specified in the format.` 
                }
              ],
              temperature: 0.1,
              max_tokens: 400,
              response_format: { type: "json_object" }
            })
          })

          if (!stage2Response.ok) {
            throw new Error(`Stage 2 API error: ${stage2Response.status}`)
          }

          const stage2Data = await stage2Response.json()
          const rawContent = stage2Data.choices[0]?.message?.content || '{}'
          
          console.log(`📄 Stage 2 Raw Response:`, rawContent)
          
          let analysis
          try {
            analysis = JSON.parse(rawContent)
          } catch (parseError) {
            console.error('❌ Failed to parse Stage 2 response:', parseError)
            console.error('Raw content:', rawContent)
            // Default to no tool execution if parsing fails
            analysis = {
              shouldExecuteTool: false,
              reasoning: 'Failed to parse analysis response',
              toolName: null,
              parameters: {},
              confidence: 0
            }
          }
          
          console.log(`🎯 Stage 2 Analysis:`)
          console.log(`   Should Execute: ${analysis.shouldExecuteTool}`)
          console.log(`   Reasoning: ${analysis.reasoning}`)
          console.log(`   Confidence: ${((analysis.confidence || 0) * 100).toFixed(0)}%`)
          
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
