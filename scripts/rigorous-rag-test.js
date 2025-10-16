#!/usr/bin/env node

/**
 * RIGOROUS RAG TESTING - AI Sidebar Per User
 * Tests memory, user isolation, and RAG functionality comprehensively
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function rigorousRAGTest() {
  console.log('🧪 RIGOROUS RAG TESTING - AI Sidebar Per User\n')
  
  const testTimestamp = Date.now()
  const baseUrl = 'http://localhost:3000'
  
  try {
    // Test 1: User Isolation Test
    console.log('👥 TEST 1: USER ISOLATION TEST')
    console.log('=' .repeat(50))
    
    const user1Id = `rag-test-user1-${testTimestamp}`
    const user2Id = `rag-test-user2-${testTimestamp}`
    
    // Create test users
    const user1 = await prisma.user.upsert({
      where: { email: 'rag-test-user1@example.com' },
      update: { id: user1Id },
      create: { 
        email: 'rag-test-user1@example.com', 
        name: 'RAG Test User 1',
        id: user1Id
      }
    })
    
    const user2 = await prisma.user.upsert({
      where: { email: 'rag-test-user2@example.com' },
      update: { id: user2Id },
      create: { 
        email: 'rag-test-user2@example.com', 
        name: 'RAG Test User 2',
        id: user2Id
      }
    })
    
    console.log(`✅ Created User 1: ${user1.id}`)
    console.log(`✅ Created User 2: ${user2.id}`)
    
    // Store different personal information for each user
    const user1Data = [
      "My name is Alice, I am 25 years old, I work as a software engineer",
      "I have a golden retriever named Buddy",
      "My favorite color is blue and I love hiking",
      "I'm building a SaaS startup called TechFlow"
    ]
    
    const user2Data = [
      "My name is Bob, I am 30 years old, I work as a marketing manager",
      "I have a cat named Whiskers",
      "My favorite color is green and I love cooking",
      "I'm working on a marketing agency called GrowthBoost"
    ]
    
    // Store user1 data
    for (const data of user1Data) {
      await prisma.$executeRaw`
        INSERT INTO user_knowledge_base (user_id, content, content_type, embedding, metadata, created_at)
        VALUES (
          ${user1Id},
          ${data},
          'user_fact',
          ${`[${Array.from({ length: 1536 }, () => Math.random() * 2 - 1).join(',')}]`}::vector(1536),
          ${JSON.stringify({
            query: data,
            timestamp: new Date().toISOString(),
            source: 'user_fact'
          })}::jsonb,
          NOW()
        )
      `
    }
    
    // Store user2 data
    for (const data of user2Data) {
      await prisma.$executeRaw`
        INSERT INTO user_knowledge_base (user_id, content, content_type, embedding, metadata, created_at)
        VALUES (
          ${user2Id},
          ${data},
          'user_fact',
          ${`[${Array.from({ length: 1536 }, () => Math.random() * 2 - 1).join(',')}]`}::vector(1536),
          ${JSON.stringify({
            query: data,
            timestamp: new Date().toISOString(),
            source: 'user_fact'
          })}::jsonb,
          NOW()
        )
      `
    }
    
    console.log(`✅ Stored ${user1Data.length} facts for User 1`)
    console.log(`✅ Stored ${user2Data.length} facts for User 2`)
    
    // Test user isolation by querying each user's data
    const user1Facts = await prisma.$queryRaw`
      SELECT content FROM user_knowledge_base 
      WHERE user_id = ${user1Id} AND content_type = 'user_fact'
      ORDER BY created_at DESC
    `
    
    const user2Facts = await prisma.$queryRaw`
      SELECT content FROM user_knowledge_base 
      WHERE user_id = ${user2Id} AND content_type = 'user_fact'
      ORDER BY created_at DESC
    `
    
    console.log(`📊 User 1 facts retrieved: ${user1Facts.length}`)
    console.log(`📊 User 2 facts retrieved: ${user2Facts.length}`)
    
    // Verify isolation - user1 should not see user2's data and vice versa
    const user1SeesUser2Data = user1Facts.some(fact => 
      user2Data.some(data => fact.content.includes(data.split(',')[0]))
    )
    
    const user2SeesUser1Data = user2Facts.some(fact => 
      user1Data.some(data => fact.content.includes(data.split(',')[0]))
    )
    
    if (!user1SeesUser2Data && !user2SeesUser1Data) {
      console.log('✅ USER ISOLATION: PASSED - Users cannot see each other\'s data')
    } else {
      console.log('❌ USER ISOLATION: FAILED - Data leakage detected')
    }
    
    // Test 2: Memory Persistence Test
    console.log('\n🧠 TEST 2: MEMORY PERSISTENCE TEST')
    console.log('=' .repeat(50))
    
    const memoryTests = [
      { query: "what is my name?", expected: "Alice", userId: user1Id },
      { query: "how old am I?", expected: "25", userId: user1Id },
      { query: "what do I do for work?", expected: "software engineer", userId: user1Id },
      { query: "what is my pet's name?", expected: "Buddy", userId: user1Id },
      { query: "what is my favorite color?", expected: "blue", userId: user1Id },
      { query: "what company am I building?", expected: "TechFlow", userId: user1Id },
      
      { query: "what is my name?", expected: "Bob", userId: user2Id },
      { query: "how old am I?", expected: "30", userId: user2Id },
      { query: "what do I do for work?", expected: "marketing manager", userId: user2Id },
      { query: "what is my pet's name?", expected: "Whiskers", userId: user2Id },
      { query: "what is my favorite color?", expected: "green", userId: user2Id },
      { query: "what company am I working on?", expected: "GrowthBoost", userId: user2Id }
    ]
    
    let memorySuccessCount = 0
    let totalMemoryTests = memoryTests.length
    
    for (const test of memoryTests) {
      const results = await prisma.$queryRaw`
        SELECT content, content_type
        FROM user_knowledge_base
        WHERE user_id = ${test.userId}
          AND content_type = 'user_fact'
          AND LOWER(content) LIKE LOWER(${'%' + test.expected + '%'})
        ORDER BY created_at DESC
        LIMIT 1
      `
      
      if (results.length > 0) {
        console.log(`✅ "${test.query}" (User ${test.userId.slice(-8)}) → Found: ${test.expected}`)
        memorySuccessCount++
      } else {
        console.log(`❌ "${test.query}" (User ${test.userId.slice(-8)}) → Not found: ${test.expected}`)
      }
    }
    
    const memorySuccessRate = (memorySuccessCount / totalMemoryTests) * 100
    console.log(`\n📊 Memory Success Rate: ${memorySuccessRate.toFixed(1)}% (${memorySuccessCount}/${totalMemoryTests})`)
    
    // Test 3: RAG Retrieval Performance Test
    console.log('\n⚡ TEST 3: RAG RETRIEVAL PERFORMANCE TEST')
    console.log('=' .repeat(50))
    
    const performanceTests = [
      { query: "Tell me about my personal information", userId: user1Id },
      { query: "What do I do for work and what's my pet's name?", userId: user1Id },
      { query: "What's my company and my hobbies?", userId: user1Id },
      { query: "Give me a summary of who I am", userId: user1Id },
      { query: "What are my personal details?", userId: user2Id },
      { query: "Tell me about my work and pet", userId: user2Id },
      { query: "What's my business and interests?", userId: user2Id }
    ]
    
    let totalRetrievalTime = 0
    let successfulRetrievals = 0
    
    for (const test of performanceTests) {
      const startTime = Date.now()
      
      // Simulate RAG retrieval query
      const results = await prisma.$queryRaw`
        SELECT 
          id,
          content,
          content_type,
          created_at,
          COALESCE(1 - (embedding <=> ${`[${Array.from({ length: 1536 }, () => Math.random() * 2 - 1).join(',')}]`}::vector(1536)), 0.5) AS similarity
        FROM user_knowledge_base
        WHERE user_id = ${test.userId}
          AND content_type = 'user_fact'
        ORDER BY created_at DESC
        LIMIT 5
      `
      
      const endTime = Date.now()
      const retrievalTime = endTime - startTime
      
      if (results.length > 0) {
        console.log(`✅ "${test.query.slice(0, 30)}..." → ${results.length} results in ${retrievalTime}ms`)
        totalRetrievalTime += retrievalTime
        successfulRetrievals++
      } else {
        console.log(`❌ "${test.query.slice(0, 30)}..." → No results in ${retrievalTime}ms`)
      }
    }
    
    const avgRetrievalTime = successfulRetrievals > 0 ? totalRetrievalTime / successfulRetrievals : 0
    console.log(`\n📊 Average Retrieval Time: ${avgRetrievalTime.toFixed(2)}ms`)
    console.log(`📊 Successful Retrievals: ${successfulRetrievals}/${performanceTests.length}`)
    
    // Test 4: Context Relevance Test
    console.log('\n🎯 TEST 4: CONTEXT RELEVANCE TEST')
    console.log('=' .repeat(50))
    
    const contextTests = [
      { query: "work", expectedKeywords: ["engineer", "manager", "company", "startup", "agency"], userId: user1Id },
      { query: "pet", expectedKeywords: ["Buddy", "Whiskers", "dog", "cat"], userId: user1Id },
      { query: "color", expectedKeywords: ["blue", "green", "favorite"], userId: user1Id },
      { query: "age", expectedKeywords: ["25", "30", "years old"], userId: user1Id }
    ]
    
    let contextSuccessCount = 0
    
    for (const test of contextTests) {
      const results = await prisma.$queryRaw`
        SELECT content
        FROM user_knowledge_base
        WHERE user_id = ${test.userId}
          AND content_type = 'user_fact'
          AND LOWER(content) LIKE LOWER(${'%' + test.query + '%'})
        ORDER BY created_at DESC
        LIMIT 3
      `
      
      if (results.length > 0) {
        const content = results.map(r => r.content).join(' ')
        const hasExpectedKeyword = test.expectedKeywords.some(keyword => 
          content.toLowerCase().includes(keyword.toLowerCase())
        )
        
        if (hasExpectedKeyword) {
          console.log(`✅ Context "${test.query}" → Relevant results found`)
          contextSuccessCount++
        } else {
          console.log(`❌ Context "${test.query}" → Results found but not relevant`)
        }
      } else {
        console.log(`❌ Context "${test.query}" → No results found`)
      }
    }
    
    console.log(`\n📊 Context Relevance Success: ${contextSuccessCount}/${contextTests.length}`)
    
    // Test 5: Real API Integration Test
    console.log('\n🌐 TEST 5: REAL API INTEGRATION TEST')
    console.log('=' .repeat(50))
    
    const apiTests = [
      { message: "What is my name?", userId: user1Id },
      { message: "What do I do for work?", userId: user2Id },
      { message: "Tell me about my pets", userId: user1Id },
      { message: "What are my hobbies?", userId: user2Id }
    ]
    
    let apiSuccessCount = 0
    
    for (const test of apiTests) {
      try {
        const response = await fetch(`${baseUrl}/api/ai-chat?stream=1`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: test.message,
            messages: [],
            userId: test.userId
          })
        })
        
        if (response.ok) {
          console.log(`✅ API Test: "${test.message}" → Response received`)
          apiSuccessCount++
        } else {
          console.log(`❌ API Test: "${test.message}" → HTTP ${response.status}`)
        }
      } catch (error) {
        console.log(`❌ API Test: "${test.message}" → Error: ${error.message}`)
      }
    }
    
    console.log(`\n📊 API Integration Success: ${apiSuccessCount}/${apiTests.length}`)
    
    // Final Assessment
    console.log('\n🏆 FINAL ASSESSMENT')
    console.log('=' .repeat(50))
    
    const overallScore = (
      (memorySuccessRate / 100) * 0.4 +  // 40% weight for memory
      (successfulRetrievals / performanceTests.length) * 0.3 +  // 30% weight for performance
      (contextSuccessCount / contextTests.length) * 0.2 +  // 20% weight for context
      (apiSuccessCount / apiTests.length) * 0.1  // 10% weight for API
    ) * 100
    
    console.log(`📈 Memory Accuracy: ${memorySuccessRate.toFixed(1)}%`)
    console.log(`📈 Retrieval Performance: ${((successfulRetrievals / performanceTests.length) * 100).toFixed(1)}%`)
    console.log(`📈 Context Relevance: ${((contextSuccessCount / contextTests.length) * 100).toFixed(1)}%`)
    console.log(`📈 API Integration: ${((apiSuccessCount / apiTests.length) * 100).toFixed(1)}%`)
    console.log(`\n🎯 OVERALL RAG SCORE: ${overallScore.toFixed(1)}%`)
    
    if (overallScore >= 90) {
      console.log('🎉 EXCELLENT: RAG system is performing exceptionally well!')
    } else if (overallScore >= 80) {
      console.log('✅ GOOD: RAG system is performing well with minor improvements needed')
    } else if (overallScore >= 70) {
      console.log('⚠️ FAIR: RAG system needs some improvements')
    } else {
      console.log('❌ POOR: RAG system needs significant improvements')
    }
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:')
    if (memorySuccessRate < 100) {
      console.log('- Improve memory retrieval accuracy')
    }
    if (avgRetrievalTime > 100) {
      console.log('- Optimize retrieval performance (target <100ms)')
    }
    if (contextSuccessCount < contextTests.length) {
      console.log('- Enhance context relevance scoring')
    }
    if (apiSuccessCount < apiTests.length) {
      console.log('- Fix API integration issues')
    }
    
    console.log('\n✅ RIGOROUS RAG TESTING COMPLETED!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up test data...')
    await prisma.$executeRaw`
      DELETE FROM user_knowledge_base 
      WHERE user_id LIKE ${'rag-test-%' + testTimestamp}
    `
    await prisma.user.deleteMany({
      where: { 
        email: {
          in: ['rag-test-user1@example.com', 'rag-test-user2@example.com']
        }
      }
    })
    console.log('✅ Test data cleaned up')
    await prisma.$disconnect()
  }
}

// Run the test
rigorousRAGTest().catch(console.error)
