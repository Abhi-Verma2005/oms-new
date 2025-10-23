#!/usr/bin/env node

/**
 * Test RAG Learning and Memory
 * Verifies that the system learns from user input and retrieves it correctly
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testRAGLearning() {
  console.log('🧠 TESTING RAG LEARNING AND MEMORY')
  console.log('=' .repeat(50))
  
  const testUserId = 'test-user-learning'
  
  try {
    // Step 1: Teach the system some facts
    console.log('\n📚 STEP 1: Teaching the system facts...')
    const facts = [
      'My favorite programming language is Python',
      'I love to eat pizza and pasta',
      'My hobby is playing guitar',
      'I work as a software engineer',
      'I live in San Francisco'
    ]
    
    for (const fact of facts) {
      console.log(`\n💭 Teaching: "${fact}"`)
      
      const response = await fetch('http://localhost:3000/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: fact,
          messages: [],
          userId: testUserId
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log(`✅ Learned: ${data.message.substring(0, 80)}...`)
      } else {
        console.log(`❌ Failed to learn: ${response.status}`)
      }
    }
    
    // Step 2: Test retrieval of learned facts
    console.log('\n🔍 STEP 2: Testing retrieval of learned facts...')
    const testQuestions = [
      'What is my favorite programming language?',
      'What do I like to eat?',
      'What is my hobby?',
      'What is my job?',
      'Where do I live?'
    ]
    
    let correctRetrievals = 0
    
    for (const question of testQuestions) {
      console.log(`\n❓ Asking: "${question}"`)
      
      const response = await fetch('http://localhost:3000/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: question,
          messages: [],
          userId: testUserId
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log(`🤖 Response: ${data.message}`)
        console.log(`📊 Context: ${data.hasRelevantContext ? 'Yes' : 'No'}`)
        console.log(`🎯 Confidence: ${data.confidence?.toFixed(3) || 'N/A'}`)
        console.log(`📈 Context Count: ${data.contextCount || 0}`)
        
        // Check if the response contains relevant information
        const responseText = data.message.toLowerCase()
        const questionText = question.toLowerCase()
        
        let isRelevant = false
        if (questionText.includes('programming language') && responseText.includes('python')) {
          isRelevant = true
        } else if (questionText.includes('eat') && (responseText.includes('pizza') || responseText.includes('pasta'))) {
          isRelevant = true
        } else if (questionText.includes('hobby') && responseText.includes('guitar')) {
          isRelevant = true
        } else if (questionText.includes('job') && responseText.includes('software engineer')) {
          isRelevant = true
        } else if (questionText.includes('live') && responseText.includes('san francisco')) {
          isRelevant = true
        }
        
        if (isRelevant) {
          console.log('✅ Correctly retrieved relevant information!')
          correctRetrievals++
        } else {
          console.log('❌ Did not retrieve relevant information')
        }
      } else {
        console.log(`❌ Failed to get response: ${response.status}`)
      }
    }
    
    // Step 3: Check knowledge base
    console.log('\n📚 STEP 3: Checking knowledge base...')
    const knowledgeEntries = await prisma.userKnowledgeBase.findMany({
      where: { userId: testUserId },
      orderBy: { createdAt: 'desc' }
    })
    
    console.log(`📖 Found ${knowledgeEntries.length} knowledge entries:`)
    knowledgeEntries.forEach((entry, i) => {
      console.log(`  ${i + 1}. ${entry.content}`)
      console.log(`     Type: ${entry.contentType}`)
      console.log(`     Created: ${entry.createdAt.toISOString()}`)
    })
    
    // Step 4: Test cache performance
    console.log('\n🎯 STEP 4: Testing cache performance...')
    const cacheEntries = await prisma.semanticCache.findMany({
      where: { userId: testUserId },
      orderBy: { createdAt: 'desc' }
    })
    
    console.log(`💾 Found ${cacheEntries.length} cache entries`)
    if (cacheEntries.length > 0) {
      const totalHits = cacheEntries.reduce((sum, entry) => sum + entry.hitCount, 0)
      console.log(`📊 Total cache hits: ${totalHits}`)
    }
    
    // Final Results
    console.log('\n' + '=' .repeat(50))
    console.log('📊 LEARNING TEST RESULTS')
    console.log('=' .repeat(50))
    
    const learningAccuracy = (correctRetrievals / testQuestions.length * 100).toFixed(1)
    console.log(`🧠 Learning Accuracy: ${correctRetrievals}/${testQuestions.length} (${learningAccuracy}%)`)
    console.log(`📚 Knowledge Entries: ${knowledgeEntries.length}`)
    console.log(`💾 Cache Entries: ${cacheEntries.length}`)
    
    if (learningAccuracy >= 80) {
      console.log('\n🎉 RAG LEARNING: EXCELLENT!')
      console.log('✅ System successfully learns and retrieves user information')
    } else if (learningAccuracy >= 60) {
      console.log('\n⚠️  RAG LEARNING: GOOD')
      console.log('✅ System learns but may need improvement in retrieval')
    } else {
      console.log('\n❌ RAG LEARNING: NEEDS IMPROVEMENT')
      console.log('❌ System has issues learning or retrieving information')
    }
    
  } catch (error) {
    console.error('❌ Learning test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the learning test
testRAGLearning().catch(console.error)

