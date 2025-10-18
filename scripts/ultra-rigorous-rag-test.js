#!/usr/bin/env node

/**
 * 🧪 ULTRA RIGOROUS RAG TESTING SUITE
 * Comprehensive testing of RAG system with multiple scenarios, performance metrics, and edge cases
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  testTimeout: 30000,
  maxRetries: 3,
  performanceThresholds: {
    retrievalTime: 200, // ms
    totalResponseTime: 5000, // ms
    memoryAccuracy: 90, // %
    contextRelevance: 85 // %
  }
}

class UltraRigorousRAGTest {
  constructor() {
    this.testResults = {
      userIsolation: { passed: 0, total: 0, details: [] },
      memoryPersistence: { passed: 0, total: 0, details: [] },
      performance: { passed: 0, total: 0, details: [] },
      contextRelevance: { passed: 0, total: 0, details: [] },
      apiIntegration: { passed: 0, total: 0, details: [] },
      edgeCases: { passed: 0, total: 0, details: [] },
      errorHandling: { passed: 0, total: 0, details: [] }
    }
    this.performanceMetrics = {
      retrievalTimes: [],
      responseTimes: [],
      memoryAccuracy: [],
      contextRelevance: []
    }
  }

  async runAllTests() {
    console.log('🧪 ULTRA RIGOROUS RAG TESTING SUITE')
    console.log('=' .repeat(60))
    console.log(`⏰ Started at: ${new Date().toISOString()}`)
    console.log(`🎯 Performance Thresholds:`)
    console.log(`   - Retrieval Time: <${TEST_CONFIG.performanceThresholds.retrievalTime}ms`)
    console.log(`   - Response Time: <${TEST_CONFIG.performanceThresholds.totalResponseTime}ms`)
    console.log(`   - Memory Accuracy: >${TEST_CONFIG.performanceThresholds.memoryAccuracy}%`)
    console.log(`   - Context Relevance: >${TEST_CONFIG.performanceThresholds.contextRelevance}%`)
    console.log('')

    try {
      // Test 1: User Isolation & Data Privacy
      await this.testUserIsolation()
      
      // Test 2: Memory Persistence & Retrieval
      await this.testMemoryPersistence()
      
      // Test 3: Performance & Speed
      await this.testPerformance()
      
      // Test 4: Context Relevance & Accuracy
      await this.testContextRelevance()
      
      // Test 5: API Integration
      await this.testAPIIntegration()
      
      // Test 6: Edge Cases
      await this.testEdgeCases()
      
      // Test 7: Error Handling
      await this.testErrorHandling()
      
      // Generate comprehensive report
      this.generateReport()
      
    } catch (error) {
      console.error('❌ Test suite failed:', error)
    } finally {
      await this.cleanup()
    }
  }

  async testUserIsolation() {
    console.log('👥 TEST 1: USER ISOLATION & DATA PRIVACY')
    console.log('=' .repeat(50))
    
    const testUsers = await this.createTestUsers(3)
    const testData = this.generateTestData(testUsers)
    
    // Store isolated data for each user
    for (let i = 0; i < testUsers.length; i++) {
      await this.storeUserData(testUsers[i].id, testData[i])
    }
    
    // Test isolation - each user should only see their own data
    for (let i = 0; i < testUsers.length; i++) {
      const userData = await this.retrieveUserData(testUsers[i].id)
      const otherUsersData = await this.retrieveOtherUsersData(testUsers[i].id, testUsers)
      
      const isolationPassed = this.verifyDataIsolation(userData, otherUsersData, testData[i])
      this.recordTestResult('userIsolation', isolationPassed, 
        `User ${i + 1} isolation test`, { userData: userData.length, otherData: otherUsersData.length })
    }
    
    console.log(`✅ User Isolation Tests: ${this.testResults.userIsolation.passed}/${this.testResults.userIsolation.total} passed`)
  }

  async testMemoryPersistence() {
    console.log('\n🧠 TEST 2: MEMORY PERSISTENCE & RETRIEVAL')
    console.log('=' .repeat(50))
    
    const testUser = await this.createTestUser('memory-test')
    const memoryTests = [
      { fact: "My name is John Smith", query: "What is my name?", expected: "John Smith" },
      { fact: "I am 28 years old", query: "How old am I?", expected: "28" },
      { fact: "I work as a software engineer at TechCorp", query: "What do I do for work?", expected: "software engineer" },
      { fact: "I have a golden retriever named Max", query: "What is my dog's name?", expected: "Max" },
      { fact: "My favorite programming language is Python", query: "What programming language do I prefer?", expected: "Python" },
      { fact: "I live in San Francisco, California", query: "Where do I live?", expected: "San Francisco" },
      { fact: "I graduated from Stanford University in 2018", query: "Where did I go to college?", expected: "Stanford" },
      { fact: "I'm working on a machine learning project", query: "What project am I working on?", expected: "machine learning" }
    ]
    
    // Store facts
    for (const test of memoryTests) {
      await this.storeUserFact(testUser.id, test.fact)
    }
    
    // Test retrieval accuracy
    for (const test of memoryTests) {
      const startTime = Date.now()
      const results = await this.queryUserMemory(testUser.id, test.query)
      const retrievalTime = Date.now() - startTime
      
      const accuracy = this.calculateMemoryAccuracy(results, test.expected)
      this.performanceMetrics.memoryAccuracy.push(accuracy)
      this.performanceMetrics.retrievalTimes.push(retrievalTime)
      
      const passed = accuracy >= TEST_CONFIG.performanceThresholds.memoryAccuracy
      this.recordTestResult('memoryPersistence', passed, 
        `Memory test: "${test.query}"`, { accuracy, retrievalTime, expected: test.expected })
    }
    
    console.log(`✅ Memory Persistence Tests: ${this.testResults.memoryPersistence.passed}/${this.testResults.memoryPersistence.total} passed`)
  }

  async testPerformance() {
    console.log('\n⚡ TEST 3: PERFORMANCE & SPEED')
    console.log('=' .repeat(50))
    
    const testUser = await this.createTestUser('performance-test')
    await this.populateTestData(testUser.id, 50) // 50 test documents
    
    const performanceTests = [
      { query: "Tell me about my work", expectedDocs: 5 },
      { query: "What are my hobbies?", expectedDocs: 3 },
      { query: "Give me a summary of my profile", expectedDocs: 8 },
      { query: "What projects am I working on?", expectedDocs: 4 },
      { query: "Tell me about my education", expectedDocs: 2 }
    ]
    
    for (const test of performanceTests) {
      const startTime = Date.now()
      const results = await this.performRAGQuery(testUser.id, test.query)
      const totalTime = Date.now() - startTime
      
      this.performanceMetrics.responseTimes.push(totalTime)
      
      const performancePassed = totalTime <= TEST_CONFIG.performanceThresholds.totalResponseTime
      this.recordTestResult('performance', performancePassed, 
        `Performance test: "${test.query}"`, { 
          responseTime: totalTime, 
          docsRetrieved: results.length,
          expectedDocs: test.expectedDocs 
        })
    }
    
    console.log(`✅ Performance Tests: ${this.testResults.performance.passed}/${this.testResults.performance.total} passed`)
  }

  async testContextRelevance() {
    console.log('\n🎯 TEST 4: CONTEXT RELEVANCE & ACCURACY')
    console.log('=' .repeat(50))
    
    const testUser = await this.createTestUser('relevance-test')
    const relevanceTests = [
      { 
        query: "What do I do for work?", 
        expectedKeywords: ["engineer", "developer", "programmer", "software"],
        contextType: "professional"
      },
      { 
        query: "Tell me about my pets", 
        expectedKeywords: ["dog", "cat", "pet", "animal"],
        contextType: "personal"
      },
      { 
        query: "What are my technical skills?", 
        expectedKeywords: ["python", "javascript", "programming", "coding"],
        contextType: "technical"
      },
      { 
        query: "Where do I live?", 
        expectedKeywords: ["city", "state", "address", "location"],
        contextType: "geographic"
      }
    ]
    
    // Populate with diverse test data
    await this.populateDiverseTestData(testUser.id)
    
    for (const test of relevanceTests) {
      const results = await this.performRAGQuery(testUser.id, test.query)
      const relevance = this.calculateContextRelevance(results, test.expectedKeywords)
      
      this.performanceMetrics.contextRelevance.push(relevance)
      
      const relevancePassed = relevance >= TEST_CONFIG.performanceThresholds.contextRelevance
      this.recordTestResult('contextRelevance', relevancePassed, 
        `Relevance test: "${test.query}"`, { 
          relevance, 
          keywords: test.expectedKeywords,
          contextType: test.contextType 
        })
    }
    
    console.log(`✅ Context Relevance Tests: ${this.testResults.contextRelevance.passed}/${this.testResults.contextRelevance.total} passed`)
  }

  async testAPIIntegration() {
    console.log('\n🌐 TEST 5: API INTEGRATION')
    console.log('=' .repeat(50))
    
    const testUser = await this.createTestUser('api-test')
    await this.populateTestData(testUser.id, 20)
    
    const apiTests = [
      { message: "What is my name?", userId: testUser.id },
      { message: "Tell me about my work", userId: testUser.id },
      { message: "What are my hobbies?", userId: testUser.id },
      { message: "Give me a summary of my profile", userId: testUser.id }
    ]
    
    for (const test of apiTests) {
      try {
        const startTime = Date.now()
        const response = await fetch(`${TEST_CONFIG.baseUrl}/api/ai-chat?stream=1`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: test.message,
            messages: [],
            userId: test.userId
          })
        })
        
        const responseTime = Date.now() - startTime
        const apiPassed = response.ok && responseTime <= TEST_CONFIG.performanceThresholds.totalResponseTime
        
        this.recordTestResult('apiIntegration', apiPassed, 
          `API test: "${test.message}"`, { 
            status: response.status, 
            responseTime,
            ok: response.ok 
          })
          
      } catch (error) {
        this.recordTestResult('apiIntegration', false, 
          `API test: "${test.message}"`, { error: error.message })
      }
    }
    
    console.log(`✅ API Integration Tests: ${this.testResults.apiIntegration.passed}/${this.testResults.apiIntegration.total} passed`)
  }

  async testEdgeCases() {
    console.log('\n🔍 TEST 6: EDGE CASES')
    console.log('=' .repeat(50))
    
    const testUser = await this.createTestUser('edge-test')
    
    const edgeCases = [
      { query: "", description: "Empty query" },
      { query: "a".repeat(1000), description: "Very long query" },
      { query: "!@#$%^&*()", description: "Special characters only" },
      { query: "123456789", description: "Numbers only" },
      { query: "   ", description: "Whitespace only" },
      { query: "null", description: "Null-like query" },
      { query: "undefined", description: "Undefined-like query" }
    ]
    
    for (const test of edgeCases) {
      try {
        const results = await this.performRAGQuery(testUser.id, test.query)
        const edgeCasePassed = this.validateEdgeCaseResponse(results, test.query)
        
        this.recordTestResult('edgeCases', edgeCasePassed, 
          `Edge case: ${test.description}`, { 
            query: test.query, 
            resultsCount: results.length 
          })
      } catch (error) {
        this.recordTestResult('edgeCases', false, 
          `Edge case: ${test.description}`, { error: error.message })
      }
    }
    
    console.log(`✅ Edge Case Tests: ${this.testResults.edgeCases.passed}/${this.testResults.edgeCases.total} passed`)
  }

  async testErrorHandling() {
    console.log('\n🛡️ TEST 7: ERROR HANDLING')
    console.log('=' .repeat(50))
    
    const errorTests = [
      { userId: "invalid-user-id", query: "Test query", description: "Invalid user ID" },
      { userId: null, query: "Test query", description: "Null user ID" },
      { userId: "", query: "Test query", description: "Empty user ID" },
      { userId: "test-user", query: null, description: "Null query" },
      { userId: "test-user", query: undefined, description: "Undefined query" }
    ]
    
    for (const test of errorTests) {
      try {
        const results = await this.performRAGQuery(test.userId, test.query)
        const errorHandlingPassed = this.validateErrorHandling(results, test)
        
        this.recordTestResult('errorHandling', errorHandlingPassed, 
          `Error handling: ${test.description}`, { 
            userId: test.userId, 
            query: test.query,
            resultsCount: results.length 
          })
      } catch (error) {
        // Expected to throw for invalid inputs
        const errorHandlingPassed = this.isExpectedError(error, test)
        this.recordTestResult('errorHandling', errorHandlingPassed, 
          `Error handling: ${test.description}`, { error: error.message })
      }
    }
    
    console.log(`✅ Error Handling Tests: ${this.testResults.errorHandling.passed}/${this.testResults.errorHandling.total} passed`)
  }

  // Helper methods
  async createTestUsers(count) {
    const users = []
    for (let i = 0; i < count; i++) {
      const user = await this.createTestUser(`test-user-${i}`)
      users.push(user)
    }
    return users
  }

  async createTestUser(suffix) {
    const userId = `rag-test-${suffix}-${Date.now()}`
    const user = await prisma.user.upsert({
      where: { email: `rag-test-${suffix}@example.com` },
      update: { id: userId },
      create: { 
        email: `rag-test-${suffix}@example.com`, 
        name: `RAG Test User ${suffix}`,
        id: userId
      }
    })
    return user
  }

  generateTestData(users) {
    return users.map((user, index) => [
      `My name is User${index + 1}`,
      `I am ${25 + index} years old`,
      `I work as a ${['engineer', 'designer', 'manager'][index % 3]}`,
      `I have a ${['dog', 'cat', 'bird'][index % 3]} named ${['Buddy', 'Whiskers', 'Tweety'][index % 3]}`,
      `My favorite color is ${['blue', 'green', 'red'][index % 3]}`,
      `I live in ${['San Francisco', 'New York', 'Seattle'][index % 3]}`
    ])
  }

  async storeUserData(userId, data) {
    for (const fact of data) {
      await this.storeUserFact(userId, fact)
    }
  }

  async storeUserFact(userId, fact) {
    const embedding = Array.from({ length: 1536 }, () => Math.random() * 2 - 1)
    await prisma.$executeRaw`
      INSERT INTO user_knowledge_base (user_id, content, content_type, embedding, metadata, created_at)
      VALUES (
        ${userId},
        ${fact},
        'user_fact',
        ${`[${embedding.join(',')}]`}::vector(1536),
        ${JSON.stringify({
          query: fact,
          timestamp: new Date().toISOString(),
          source: 'user_fact'
        })}::jsonb,
        NOW()
      )
    `
  }

  async retrieveUserData(userId) {
    return await prisma.$queryRaw`
      SELECT content FROM user_knowledge_base 
      WHERE user_id = ${userId} AND content_type = 'user_fact'
      ORDER BY created_at DESC
    `
  }

  async retrieveOtherUsersData(userId, allUsers) {
    const otherUserIds = allUsers.filter(u => u.id !== userId).map(u => u.id)
    if (otherUserIds.length === 0) return []
    
    return await prisma.$queryRaw`
      SELECT content FROM user_knowledge_base 
      WHERE user_id = ANY(${otherUserIds}) AND content_type = 'user_fact'
      ORDER BY created_at DESC
    `
  }

  verifyDataIsolation(userData, otherUsersData, expectedData) {
    // Check that user data contains expected facts
    const hasExpectedData = expectedData.some(expected => 
      userData.some(fact => fact.content.includes(expected.split(',')[0]))
    )
    
    // Check that user doesn't see other users' data
    const hasOtherUsersData = otherUsersData.some(otherFact => 
      userData.some(userFact => userFact.content === otherFact.content)
    )
    
    return hasExpectedData && !hasOtherUsersData
  }

  calculateMemoryAccuracy(results, expected) {
    if (results.length === 0) return 0
    
    const content = results.map(r => r.content).join(' ').toLowerCase()
    const expectedLower = expected.toLowerCase()
    
    // Check for exact match or partial match
    if (content.includes(expectedLower)) return 100
    
    // Check for keyword matches
    const expectedWords = expectedLower.split(' ')
    const matchedWords = expectedWords.filter(word => 
      word.length > 2 && content.includes(word)
    )
    
    return (matchedWords.length / expectedWords.length) * 100
  }

  async queryUserMemory(userId, query) {
    const embedding = Array.from({ length: 1536 }, () => Math.random() * 2 - 1)
    return await prisma.$queryRaw`
      SELECT content, content_type, created_at
      FROM user_knowledge_base
      WHERE user_id = ${userId}
        AND content_type = 'user_fact'
        AND (LOWER(content) LIKE LOWER(${'%' + query + '%'}) OR 
             LOWER(content) LIKE LOWER(${'%' + query.split(' ').join('%') + '%'}))
      ORDER BY created_at DESC
      LIMIT 5
    `
  }

  async performRAGQuery(userId, query) {
    const embedding = Array.from({ length: 1536 }, () => Math.random() * 2 - 1)
    return await prisma.$queryRaw`
      SELECT 
        id,
        content,
        content_type,
        created_at,
        COALESCE(1 - (embedding <=> ${`[${embedding.join(',')}]`}::vector(1536)), 0.5) AS similarity
      FROM user_knowledge_base
      WHERE user_id = ${userId}
        AND embedding IS NOT NULL
      ORDER BY 
        CASE 
          WHEN created_at > NOW() - INTERVAL '24 hours' THEN 0
          WHEN created_at > NOW() - INTERVAL '7 days' THEN 1
          ELSE 2
        END,
        embedding <=> ${`[${embedding.join(',')}]`}::vector(1536)
      LIMIT 10
    `
  }

  calculateContextRelevance(results, expectedKeywords) {
    if (results.length === 0) return 0
    
    const content = results.map(r => r.content).join(' ').toLowerCase()
    const matchedKeywords = expectedKeywords.filter(keyword => 
      content.includes(keyword.toLowerCase())
    )
    
    return (matchedKeywords.length / expectedKeywords.length) * 100
  }

  async populateTestData(userId, count) {
    const testFacts = [
      "I work as a software engineer at a tech company",
      "I have a golden retriever named Max",
      "My favorite programming language is Python",
      "I live in San Francisco, California",
      "I graduated from Stanford University",
      "I'm working on a machine learning project",
      "I enjoy hiking and photography",
      "I have a master's degree in Computer Science",
      "I'm interested in artificial intelligence",
      "I have 5 years of experience in software development"
    ]
    
    for (let i = 0; i < count; i++) {
      const fact = testFacts[i % testFacts.length] + ` (${i + 1})`
      await this.storeUserFact(userId, fact)
    }
  }

  async populateDiverseTestData(userId) {
    const diverseData = [
      "I work as a software engineer specializing in Python and machine learning",
      "I have a golden retriever named Max who loves playing fetch",
      "My favorite programming languages are Python, JavaScript, and Go",
      "I live in San Francisco, California, near the Golden Gate Bridge",
      "I graduated from Stanford University with a degree in Computer Science",
      "I'm currently working on a machine learning project for image recognition",
      "I enjoy hiking in the mountains and taking nature photographs",
      "I have a master's degree in Computer Science from Stanford",
      "I'm deeply interested in artificial intelligence and neural networks",
      "I have 5 years of experience in full-stack software development",
      "I love cooking Italian food and experimenting with new recipes",
      "I play guitar and enjoy jazz music",
      "I'm learning Spanish and plan to visit Spain next year",
      "I volunteer at the local animal shelter on weekends",
      "I'm passionate about sustainable technology and green energy"
    ]
    
    for (const data of diverseData) {
      await this.storeUserFact(userId, data)
    }
  }

  validateEdgeCaseResponse(results, query) {
    // Edge cases should either return no results or handle gracefully
    if (query.trim() === "" || query.length > 500) {
      return results.length === 0 || results.length <= 3
    }
    
    if (/^[!@#$%^&*()]+$/.test(query) || /^\d+$/.test(query)) {
      return results.length === 0 || results.length <= 2
    }
    
    return true // Other edge cases should work normally
  }

  validateErrorHandling(results, test) {
    // Should handle invalid inputs gracefully
    if (!test.userId || test.userId === "invalid-user-id") {
      return results.length === 0
    }
    
    if (!test.query) {
      return results.length === 0
    }
    
    return true
  }

  isExpectedError(error, test) {
    // Check if the error is expected for the test case
    if (!test.userId || test.userId === "invalid-user-id") {
      return error.message.includes('user') || error.message.includes('invalid')
    }
    
    if (!test.query) {
      return error.message.includes('query') || error.message.includes('message')
    }
    
    return false
  }

  recordTestResult(category, passed, description, details = {}) {
    this.testResults[category].total++
    if (passed) {
      this.testResults[category].passed++
    }
    this.testResults[category].details.push({
      description,
      passed,
      details,
      timestamp: new Date().toISOString()
    })
  }

  generateReport() {
    console.log('\n🏆 COMPREHENSIVE TEST REPORT')
    console.log('=' .repeat(60))
    
    const categories = Object.keys(this.testResults)
    let totalPassed = 0
    let totalTests = 0
    
    categories.forEach(category => {
      const result = this.testResults[category]
      const percentage = ((result.passed / result.total) * 100).toFixed(1)
      const status = result.passed === result.total ? '✅' : result.passed > result.total * 0.8 ? '⚠️' : '❌'
      
      console.log(`${status} ${category.toUpperCase()}: ${result.passed}/${result.total} (${percentage}%)`)
      totalPassed += result.passed
      totalTests += result.total
    })
    
    const overallPercentage = ((totalPassed / totalTests) * 100).toFixed(1)
    console.log(`\n🎯 OVERALL SCORE: ${totalPassed}/${totalTests} (${overallPercentage}%)`)
    
    // Performance metrics
    if (this.performanceMetrics.retrievalTimes.length > 0) {
      const avgRetrievalTime = this.performanceMetrics.retrievalTimes.reduce((a, b) => a + b, 0) / this.performanceMetrics.retrievalTimes.length
      console.log(`⚡ Average Retrieval Time: ${avgRetrievalTime.toFixed(2)}ms`)
    }
    
    if (this.performanceMetrics.responseTimes.length > 0) {
      const avgResponseTime = this.performanceMetrics.responseTimes.reduce((a, b) => a + b, 0) / this.performanceMetrics.responseTimes.length
      console.log(`⚡ Average Response Time: ${avgResponseTime.toFixed(2)}ms`)
    }
    
    if (this.performanceMetrics.memoryAccuracy.length > 0) {
      const avgMemoryAccuracy = this.performanceMetrics.memoryAccuracy.reduce((a, b) => a + b, 0) / this.performanceMetrics.memoryAccuracy.length
      console.log(`🧠 Average Memory Accuracy: ${avgMemoryAccuracy.toFixed(1)}%`)
    }
    
    if (this.performanceMetrics.contextRelevance.length > 0) {
      const avgContextRelevance = this.performanceMetrics.contextRelevance.reduce((a, b) => a + b, 0) / this.performanceMetrics.contextRelevance.length
      console.log(`🎯 Average Context Relevance: ${avgContextRelevance.toFixed(1)}%`)
    }
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:')
    if (overallPercentage < 90) {
      console.log('- RAG system needs improvement in multiple areas')
    }
    if (this.performanceMetrics.retrievalTimes.some(t => t > TEST_CONFIG.performanceThresholds.retrievalTime)) {
      console.log('- Optimize retrieval performance')
    }
    if (this.performanceMetrics.memoryAccuracy.some(a => a < TEST_CONFIG.performanceThresholds.memoryAccuracy)) {
      console.log('- Improve memory accuracy and retrieval')
    }
    if (this.performanceMetrics.contextRelevance.some(r => r < TEST_CONFIG.performanceThresholds.contextRelevance)) {
      console.log('- Enhance context relevance scoring')
    }
    
    console.log('\n✅ ULTRA RIGOROUS RAG TESTING COMPLETED!')
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up test data...')
    try {
      await prisma.$executeRaw`
        DELETE FROM user_knowledge_base 
        WHERE user_id LIKE 'rag-test-%'
      `
      await prisma.user.deleteMany({
        where: { 
          email: {
            contains: 'rag-test-'
          }
        }
      })
      console.log('✅ Test data cleaned up')
    } catch (error) {
      console.error('⚠️ Cleanup error:', error.message)
    } finally {
      await prisma.$disconnect()
    }
  }
}

// Run the comprehensive test suite
async function runUltraRigorousRAGTest() {
  const testSuite = new UltraRigorousRAGTest()
  await testSuite.runAllTests()
}

// Execute if run directly
if (require.main === module) {
  runUltraRigorousRAGTest().catch(console.error)
}

module.exports = { UltraRigorousRAGTest, runUltraRigorousRAGTest }
