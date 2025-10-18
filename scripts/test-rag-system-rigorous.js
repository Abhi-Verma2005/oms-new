/**
 * 🧪 Rigorous RAG System Testing
 * Test if expected data is returned from RAG system
 */

const fetch = require('node-fetch')
const { performance } = require('perf_hooks')

console.log('🧪 Rigorous RAG System Testing...\n')

class RAGTester {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl
    this.testResults = {
      userCreation: [],
      embeddingGeneration: [],
      ragRetrieval: [],
      responseQuality: [],
      performance: []
    }
  }

  async testUserCreation() {
    console.log('👤 Testing User Creation...')
    
    const testUsers = [
      'test-user-123',
      'rag-test-user',
      'performance-test-user'
    ]

    for (const userId of testUsers) {
      try {
        const start = performance.now()
        const response = await fetch(`${this.baseUrl}/api/ai-chat?stream=1`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: 'Hello, my name is Test User',
            messages: [],
            config: { navigationData: [] },
            currentUrl: this.baseUrl,
            cartState: { items: [], totalItems: 0, totalPrice: 0 },
            userId: userId
          })
        })
        
        const time = performance.now() - start
        const success = response.ok
        
        this.testResults.userCreation.push({
          userId,
          success,
          time,
          status: response.status
        })
        
        console.log(`  ${success ? '✅' : '❌'} ${userId}: ${time.toFixed(2)}ms (${response.status})`)
        
      } catch (error) {
        this.testResults.userCreation.push({
          userId,
          success: false,
          time: -1,
          error: error.message
        })
        console.log(`  ❌ ${userId}: ${error.message}`)
      }
    }
  }

  async testEmbeddingGeneration() {
    console.log('\n🔮 Testing Embedding Generation...')
    
    const testQueries = [
      'my name is anish',
      'what is my name?',
      'help me with navigation',
      'show me my cart',
      'I need help with orders'
    ]

    for (const query of testQueries) {
      try {
        const start = performance.now()
        const response = await fetch(`${this.baseUrl}/api/ai-chat?stream=1`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: query,
            messages: [],
            config: { navigationData: [] },
            currentUrl: this.baseUrl,
            cartState: { items: [], totalItems: 0, totalPrice: 0 },
            userId: 'embedding-test-user'
          })
        })
        
        const time = performance.now() - start
        const success = response.ok
        
        // Check if response has content
        let hasContent = false
        let contentLength = 0
        if (success) {
          const reader = response.body.getReader()
          const decoder = new TextDecoder()
          let content = ''
          
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            content += decoder.decode(value, { stream: true })
          }
          
          contentLength = content.length
          hasContent = content.trim().length > 0
        }
        
        this.testResults.embeddingGeneration.push({
          query,
          success,
          time,
          hasContent,
          contentLength,
          status: response.status
        })
        
        console.log(`  ${success ? '✅' : '❌'} "${query}": ${time.toFixed(2)}ms, ${contentLength} chars, ${hasContent ? 'HAS CONTENT' : 'NO CONTENT'}`)
        
      } catch (error) {
        this.testResults.embeddingGeneration.push({
          query,
          success: false,
          time: -1,
          hasContent: false,
          contentLength: 0,
          error: error.message
        })
        console.log(`  ❌ "${query}": ${error.message}`)
      }
    }
  }

  async testRAGRetrieval() {
    console.log('\n🔍 Testing RAG Retrieval...')
    
    // First, seed some knowledge base data
    const seedMessages = [
      'my name is anish suman',
      'I am a software developer',
      'I work on AI and machine learning projects',
      'I like pizza and coffee',
      'I live in California'
    ]

    console.log('  📝 Seeding knowledge base...')
    for (const message of seedMessages) {
      try {
        await fetch(`${this.baseUrl}/api/ai-chat?stream=1`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: message,
            messages: [],
            config: { navigationData: [] },
            currentUrl: this.baseUrl,
            cartState: { items: [], totalItems: 0, totalPrice: 0 },
            userId: 'rag-test-user'
          })
        })
      } catch (error) {
        console.log(`    ⚠️ Failed to seed: ${error.message}`)
      }
    }

    // Wait for data to be processed
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Test retrieval queries
    const retrievalQueries = [
      { query: 'what is my name?', expected: ['anish', 'suman'] },
      { query: 'what do I do for work?', expected: ['software', 'developer'] },
      { query: 'what are my interests?', expected: ['AI', 'machine learning'] },
      { query: 'what food do I like?', expected: ['pizza', 'coffee'] },
      { query: 'where do I live?', expected: ['California'] }
    ]

    for (const { query, expected } of retrievalQueries) {
      try {
        const start = performance.now()
        const response = await fetch(`${this.baseUrl}/api/ai-chat?stream=1`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: query,
            messages: [],
            config: { navigationData: [] },
            currentUrl: this.baseUrl,
            cartState: { items: [], totalItems: 0, totalPrice: 0 },
            userId: 'rag-test-user'
          })
        })
        
        const time = performance.now() - start
        const success = response.ok
        
        // Check response content
        let hasContent = false
        let contentLength = 0
        let containsExpected = false
        let actualContent = ''
        
        if (success) {
          const reader = response.body.getReader()
          const decoder = new TextDecoder()
          
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            actualContent += decoder.decode(value, { stream: true })
          }
          
          contentLength = actualContent.length
          hasContent = actualContent.trim().length > 0
          
          // Check if response contains expected keywords
          const lowerContent = actualContent.toLowerCase()
          containsExpected = expected.some(keyword => 
            lowerContent.includes(keyword.toLowerCase())
          )
        }
        
        this.testResults.ragRetrieval.push({
          query,
          expected,
          success,
          time,
          hasContent,
          contentLength,
          containsExpected,
          actualContent: actualContent.substring(0, 100) + '...',
          status: response.status
        })
        
        console.log(`  ${success ? '✅' : '❌'} "${query}":`)
        console.log(`    Expected: ${expected.join(', ')}`)
        console.log(`    Contains Expected: ${containsExpected ? '✅' : '❌'}`)
        console.log(`    Time: ${time.toFixed(2)}ms, Content: ${contentLength} chars`)
        console.log(`    Response: "${actualContent.substring(0, 50)}..."`)
        
      } catch (error) {
        this.testResults.ragRetrieval.push({
          query,
          expected,
          success: false,
          time: -1,
          hasContent: false,
          contentLength: 0,
          containsExpected: false,
          actualContent: '',
          error: error.message
        })
        console.log(`  ❌ "${query}": ${error.message}`)
      }
    }
  }

  async testResponseQuality() {
    console.log('\n📊 Testing Response Quality...')
    
    const qualityTests = [
      {
        message: 'hi',
        expectedCharacteristics: ['greeting', 'helpful', 'friendly']
      },
      {
        message: 'help me navigate',
        expectedCharacteristics: ['navigation', 'assistance', 'helpful']
      },
      {
        message: 'what can you do?',
        expectedCharacteristics: ['capabilities', 'features', 'assistance']
      }
    ]

    for (const { message, expectedCharacteristics } of qualityTests) {
      try {
        const start = performance.now()
        const response = await fetch(`${this.baseUrl}/api/ai-chat?stream=1`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: message,
            messages: [],
            config: { navigationData: [] },
            currentUrl: this.baseUrl,
            cartState: { items: [], totalItems: 0, totalPrice: 0 },
            userId: 'quality-test-user'
          })
        })
        
        const time = performance.now() - start
        const success = response.ok
        
        let hasContent = false
        let contentLength = 0
        let qualityScore = 0
        let actualContent = ''
        
        if (success) {
          const reader = response.body.getReader()
          const decoder = new TextDecoder()
          
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            actualContent += decoder.decode(value, { stream: true })
          }
          
          contentLength = actualContent.length
          hasContent = actualContent.trim().length > 0
          
          // Calculate quality score based on expected characteristics
          const lowerContent = actualContent.toLowerCase()
          const characteristicsFound = expectedCharacteristics.filter(char => 
            lowerContent.includes(char.toLowerCase())
          )
          qualityScore = (characteristicsFound.length / expectedCharacteristics.length) * 100
        }
        
        this.testResults.responseQuality.push({
          message,
          expectedCharacteristics,
          success,
          time,
          hasContent,
          contentLength,
          qualityScore,
          actualContent: actualContent.substring(0, 100) + '...',
          status: response.status
        })
        
        console.log(`  ${success ? '✅' : '❌'} "${message}":`)
        console.log(`    Quality Score: ${qualityScore.toFixed(1)}%`)
        console.log(`    Time: ${time.toFixed(2)}ms, Content: ${contentLength} chars`)
        console.log(`    Response: "${actualContent.substring(0, 50)}..."`)
        
      } catch (error) {
        this.testResults.responseQuality.push({
          message,
          expectedCharacteristics,
          success: false,
          time: -1,
          hasContent: false,
          contentLength: 0,
          qualityScore: 0,
          actualContent: '',
          error: error.message
        })
        console.log(`  ❌ "${message}": ${error.message}`)
      }
    }
  }

  generateReport() {
    console.log('\n📊 RAG System Test Report')
    console.log('=' .repeat(60))
    
    // User Creation Report
    const userCreationSuccess = this.testResults.userCreation.filter(r => r.success).length
    const userCreationTotal = this.testResults.userCreation.length
    console.log(`\n👤 User Creation: ${userCreationSuccess}/${userCreationTotal} successful`)
    
    // Embedding Generation Report
    const embeddingSuccess = this.testResults.embeddingGeneration.filter(r => r.success).length
    const embeddingWithContent = this.testResults.embeddingGeneration.filter(r => r.hasContent).length
    const embeddingTotal = this.testResults.embeddingGeneration.length
    console.log(`\n🔮 Embedding Generation: ${embeddingSuccess}/${embeddingTotal} successful`)
    console.log(`   Content Returned: ${embeddingWithContent}/${embeddingTotal} (${(embeddingWithContent/embeddingTotal*100).toFixed(1)}%)`)
    
    // RAG Retrieval Report
    const ragSuccess = this.testResults.ragRetrieval.filter(r => r.success).length
    const ragWithExpected = this.testResults.ragRetrieval.filter(r => r.containsExpected).length
    const ragTotal = this.testResults.ragRetrieval.length
    console.log(`\n🔍 RAG Retrieval: ${ragSuccess}/${ragTotal} successful`)
    console.log(`   Expected Data Found: ${ragWithExpected}/${ragTotal} (${(ragWithExpected/ragTotal*100).toFixed(1)}%)`)
    
    // Response Quality Report
    const qualitySuccess = this.testResults.responseQuality.filter(r => r.success).length
    const avgQualityScore = this.testResults.responseQuality
      .filter(r => r.success)
      .reduce((sum, r) => sum + r.qualityScore, 0) / qualitySuccess || 0
    const qualityTotal = this.testResults.responseQuality.length
    console.log(`\n📊 Response Quality: ${qualitySuccess}/${qualityTotal} successful`)
    console.log(`   Average Quality Score: ${avgQualityScore.toFixed(1)}%`)
    
    // Performance Report
    const allTimes = [
      ...this.testResults.userCreation.map(r => r.time).filter(t => t > 0),
      ...this.testResults.embeddingGeneration.map(r => r.time).filter(t => t > 0),
      ...this.testResults.ragRetrieval.map(r => r.time).filter(t => t > 0),
      ...this.testResults.responseQuality.map(r => r.time).filter(t => t > 0)
    ]
    
    if (allTimes.length > 0) {
      const avgTime = allTimes.reduce((sum, t) => sum + t, 0) / allTimes.length
      const maxTime = Math.max(...allTimes)
      const minTime = Math.min(...allTimes)
      
      console.log(`\n⏱️ Performance:`)
      console.log(`   Average Response Time: ${avgTime.toFixed(2)}ms`)
      console.log(`   Fastest Response: ${minTime.toFixed(2)}ms`)
      console.log(`   Slowest Response: ${maxTime.toFixed(2)}ms`)
    }
    
    // Issues Report
    console.log(`\n🚨 Issues Found:`)
    const emptyResponses = [
      ...this.testResults.embeddingGeneration.filter(r => r.success && !r.hasContent),
      ...this.testResults.ragRetrieval.filter(r => r.success && !r.hasContent),
      ...this.testResults.responseQuality.filter(r => r.success && !r.hasContent)
    ]
    
    if (emptyResponses.length > 0) {
      console.log(`   ❌ Empty Responses: ${emptyResponses.length}`)
      emptyResponses.forEach(r => {
        console.log(`      - "${r.message || r.query}": No content returned`)
      })
    } else {
      console.log(`   ✅ No empty responses found`)
    }
    
    const failedRetrievals = this.testResults.ragRetrieval.filter(r => r.success && !r.containsExpected)
    if (failedRetrievals.length > 0) {
      console.log(`   ❌ Failed RAG Retrievals: ${failedRetrievals.length}`)
      failedRetrievals.forEach(r => {
        console.log(`      - "${r.query}": Expected ${r.expected.join(', ')}, but not found`)
      })
    } else {
      console.log(`   ✅ All RAG retrievals found expected data`)
    }
    
    // Recommendations
    console.log(`\n💡 Recommendations:`)
    if (emptyResponses.length > 0) {
      console.log(`   🔧 Fix empty response issues in API`)
    }
    if (failedRetrievals.length > 0) {
      console.log(`   🔧 Improve RAG retrieval accuracy`)
    }
    if (avgTime > 5000) {
      console.log(`   🐌 Optimize response times (currently ${avgTime.toFixed(2)}ms)`)
    }
    if (avgQualityScore < 70) {
      console.log(`   📝 Improve response quality (currently ${avgQualityScore.toFixed(1)}%)`)
    }
    
    console.log(`\n✅ RAG System Test Complete!`)
  }

  async runAllTests() {
    await this.testUserCreation()
    await this.testEmbeddingGeneration()
    await this.testRAGRetrieval()
    await this.testResponseQuality()
    this.generateReport()
  }
}

// Run the tests
const tester = new RAGTester()
tester.runAllTests().catch(error => {
  console.error('❌ RAG testing failed:', error.message)
  process.exit(1)
})


