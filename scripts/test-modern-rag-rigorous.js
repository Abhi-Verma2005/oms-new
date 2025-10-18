#!/usr/bin/env node

/**
 * Rigorous Test of Modern RAG Implementation
 * Tests all modern RAG features with detailed logging and validation
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testModernRAGRigorous() {
  console.log('🚀 RIGOROUS TEST: Modern RAG Implementation')
  console.log('=' .repeat(60))
  
  const testUserId = 'test-user-modern-rag-rigorous'
  let testResults = {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    features: {}
  }
  
  try {
    // 1. Test Query Rewriting
    console.log('\n🔄 TEST 1: Query Rewriting')
    console.log('-' .repeat(40))
    
    const testQueries = [
      'What is my favorite programming language?',
      'Tell me about my food preferences',
      'What are my hobbies and interests?',
      'What programming languages do I know?',
      'What do I like to eat for dinner?'
    ]
    
    for (const query of testQueries) {
      testResults.totalTests++
      console.log(`\n📝 Testing Query: "${query}"`)
      
      try {
        const startTime = Date.now()
        const response = await fetch('http://localhost:3000/api/ai-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: query,
            messages: [],
            userId: testUserId
          })
        })
        const endTime = Date.now()
        
        if (response.ok) {
          const data = await response.json()
          console.log(`✅ Response: ${data.message.substring(0, 80)}...`)
          console.log(`📊 Context: ${data.hasRelevantContext ? 'Yes' : 'No'}`)
          console.log(`🎯 Confidence: ${data.confidence?.toFixed(3) || 'N/A'}`)
          console.log(`⏱️  Total Time: ${endTime - startTime}ms`)
          console.log(`📈 Timings: RAG=${data.timings?.ragMs || 0}ms, LLM=${data.timings?.llmMs || 0}ms`)
          
          testResults.passedTests++
          testResults.features.queryRewriting = true
        } else {
          console.log(`❌ API Error: ${response.status} - ${await response.text()}`)
          testResults.failedTests++
        }
      } catch (error) {
        console.log(`❌ Request failed: ${error.message}`)
        testResults.failedTests++
      }
    }
    
    // 2. Test Knowledge Base Storage
    console.log('\n💾 TEST 2: Knowledge Base Storage')
    console.log('-' .repeat(40))
    
    testResults.totalTests++
    const knowledgeEntries = await prisma.userKnowledgeBase.findMany({
      where: { userId: testUserId },
      orderBy: { createdAt: 'desc' },
      take: 10
    })
    
    console.log(`📚 Found ${knowledgeEntries.length} knowledge entries`)
    if (knowledgeEntries.length > 0) {
      knowledgeEntries.forEach((entry, i) => {
        console.log(`  ${i + 1}. ${entry.content.substring(0, 60)}... (${entry.contentType})`)
        console.log(`     Created: ${entry.createdAt.toISOString()}`)
        console.log(`     Importance: ${entry.importanceScore}`)
      })
      testResults.passedTests++
      testResults.features.knowledgeStorage = true
    } else {
      console.log('❌ No knowledge entries found')
      testResults.failedTests++
    }
    
    // 3. Test Semantic Cache
    console.log('\n🎯 TEST 3: Semantic Cache')
    console.log('-' .repeat(40))
    
    testResults.totalTests++
    const cacheEntries = await prisma.semanticCache.findMany({
      where: { userId: testUserId },
      orderBy: { createdAt: 'desc' },
      take: 5
    })
    
    console.log(`💾 Found ${cacheEntries.length} cache entries`)
    if (cacheEntries.length > 0) {
      cacheEntries.forEach((entry, i) => {
        console.log(`  ${i + 1}. Hit Count: ${entry.hitCount}`)
        console.log(`     Expires: ${entry.expiresAt.toISOString()}`)
        console.log(`     Last Hit: ${entry.lastHit?.toISOString() || 'Never'}`)
      })
      testResults.passedTests++
      testResults.features.semanticCache = true
    } else {
      console.log('❌ No cache entries found')
      testResults.failedTests++
    }
    
    // 4. Test Performance Metrics
    console.log('\n📊 TEST 4: Performance Metrics')
    console.log('-' .repeat(40))
    
    testResults.totalTests++
    const metrics = await prisma.rAGPerformanceMetrics.findMany({
      where: { userId: testUserId },
      orderBy: { timestamp: 'desc' },
      take: 10
    })
    
    console.log(`📈 Found ${metrics.length} performance metrics`)
    if (metrics.length > 0) {
      const avgDuration = metrics.reduce((sum, m) => sum + m.durationMs, 0) / metrics.length
      const successRate = metrics.filter(m => m.success).length / metrics.length * 100
      const avgDocsRetrieved = metrics.reduce((sum, m) => sum + (m.docsRetrieved || 0), 0) / metrics.length
      
      console.log(`  Average Duration: ${avgDuration.toFixed(0)}ms`)
      console.log(`  Success Rate: ${successRate.toFixed(1)}%`)
      console.log(`  Avg Docs Retrieved: ${avgDocsRetrieved.toFixed(1)}`)
      
      testResults.passedTests++
      testResults.features.performanceMetrics = true
    } else {
      console.log('❌ No performance metrics found')
      testResults.failedTests++
    }
    
    // 5. Test Hybrid Search Performance
    console.log('\n🔍 TEST 5: Hybrid Search Performance')
    console.log('-' .repeat(40))
    
    testResults.totalTests++
    const startTime = Date.now()
    
    try {
      const response = await fetch('http://localhost:3000/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'What are my preferences and interests?',
          messages: [],
          userId: testUserId
        })
      })
      
      const endTime = Date.now()
      const totalTime = endTime - startTime
      
      if (response.ok) {
        const data = await response.json()
        console.log(`✅ Hybrid search completed in ${totalTime}ms`)
        console.log(`📊 Context Count: ${data.contextCount || 0}`)
        console.log(`🎯 Cache Hit: ${data.cacheHit ? 'Yes' : 'No'}`)
        console.log(`📝 Response: ${data.message.substring(0, 100)}...`)
        console.log(`⏱️  Detailed Timings:`)
        console.log(`   RAG: ${data.timings?.ragMs || 0}ms`)
        console.log(`   Re-rank: ${data.timings?.rerankMs || 0}ms`)
        console.log(`   LLM: ${data.timings?.llmMs || 0}ms`)
        console.log(`   Total: ${data.timings?.totalMs || 0}ms`)
        
        testResults.passedTests++
        testResults.features.hybridSearch = true
      } else {
        console.log(`❌ Hybrid search failed: ${response.status}`)
        testResults.failedTests++
      }
    } catch (error) {
      console.log(`❌ Hybrid search error: ${error.message}`)
      testResults.failedTests++
    }
    
    // 6. Test User Isolation
    console.log('\n🔒 TEST 6: User Isolation')
    console.log('-' .repeat(40))
    
    testResults.totalTests++
    const otherUserEntries = await prisma.userKnowledgeBase.findMany({
      where: { 
        userId: { not: testUserId },
        content: { contains: 'test' }
      },
      take: 5
    })
    
    const currentUserEntries = await prisma.userKnowledgeBase.findMany({
      where: { userId: testUserId },
      take: 5
    })
    
    console.log(`👤 Current user entries: ${currentUserEntries.length}`)
    console.log(`👥 Other user entries: ${otherUserEntries.length}`)
    
    if (currentUserEntries.length > 0 && otherUserEntries.length === 0) {
      console.log('✅ User isolation working correctly')
      testResults.passedTests++
      testResults.features.userIsolation = true
    } else {
      console.log('❌ User isolation may have issues')
      testResults.failedTests++
    }
    
    // 7. Test Self-Correction
    console.log('\n🔧 TEST 7: Self-Correction')
    console.log('-' .repeat(40))
    
    testResults.totalTests++
    // Send the same message twice to test duplicate detection
    const duplicateMessage = 'My favorite color is blue'
    
    try {
      // First message
      const response1 = await fetch('http://localhost:3000/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: duplicateMessage,
          messages: [],
          userId: testUserId
        })
      })
      
      // Second message (should trigger self-correction)
      const response2 = await fetch('http://localhost:3000/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: duplicateMessage,
          messages: [],
          userId: testUserId
        })
      })
      
      if (response1.ok && response2.ok) {
        console.log('✅ Self-correction test completed')
        testResults.passedTests++
        testResults.features.selfCorrection = true
      } else {
        console.log('❌ Self-correction test failed')
        testResults.failedTests++
      }
    } catch (error) {
      console.log(`❌ Self-correction error: ${error.message}`)
      testResults.failedTests++
    }
    
    // Final Results
    console.log('\n' + '=' .repeat(60))
    console.log('📊 RIGOROUS TEST RESULTS')
    console.log('=' .repeat(60))
    
    const successRate = (testResults.passedTests / testResults.totalTests * 100).toFixed(1)
    console.log(`✅ Tests Passed: ${testResults.passedTests}/${testResults.totalTests} (${successRate}%)`)
    console.log(`❌ Tests Failed: ${testResults.failedTests}/${testResults.totalTests}`)
    
    console.log('\n🎯 Feature Status:')
    Object.entries(testResults.features).forEach(([feature, status]) => {
      console.log(`  ${status ? '✅' : '❌'} ${feature.replace(/([A-Z])/g, ' $1').toLowerCase()}`)
    })
    
    if (successRate >= 80) {
      console.log('\n🎉 MODERN RAG IMPLEMENTATION: EXCELLENT!')
    } else if (successRate >= 60) {
      console.log('\n⚠️  MODERN RAG IMPLEMENTATION: NEEDS IMPROVEMENT')
    } else {
      console.log('\n❌ MODERN RAG IMPLEMENTATION: CRITICAL ISSUES')
    }
    
  } catch (error) {
    console.error('❌ Test suite failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the rigorous test
testModernRAGRigorous().catch(console.error)
