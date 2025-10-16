#!/usr/bin/env node

/**
 * 🧪 Test Real RAG API with OpenAI Integration
 * Tests the actual RAG system with real AI responses
 */

const { PrismaClient } = require('@prisma/client')

console.log('🧪 Testing Real RAG API with OpenAI Integration...\n')

const prisma = new PrismaClient()

async function testRealRAGAPI() {
  try {
    console.log('🔍 Testing real RAG API with OpenAI integration...')
    
    // Create test user with knowledge
    const testUser = await prisma.user.upsert({
      where: { email: 'real-rag-test@example.com' },
      update: {},
      create: {
        email: 'real-rag-test@example.com',
        name: 'Real RAG Test User'
      }
    })
    
    console.log(`👤 Created test user: ${testUser.email} (ID: ${testUser.id})`)
    
    // Add real knowledge to the user's knowledge base
    console.log('\n📝 Adding knowledge to user knowledge base...')
    
    const knowledgeEntries = [
      {
        content: 'I am a digital marketing expert who specializes in SEO, content marketing, and social media strategies. My clients are primarily small to medium-sized businesses looking to grow their online presence.',
        contentType: 'conversation',
        topics: ['digital-marketing', 'seo', 'content-marketing', 'social-media', 'expertise'],
        metadata: { source: 'user-profile', category: 'expertise', importance: 'high' }
      },
      {
        content: 'I prefer data-driven approaches and always recommend A/B testing for marketing campaigns. I believe in measuring ROI and focusing on conversion optimization.',
        contentType: 'conversation',
        topics: ['data-driven', 'ab-testing', 'roi', 'conversion-optimization', 'preferences'],
        metadata: { source: 'user-preference', category: 'methodology', importance: 'high' }
      },
      {
        content: 'My typical client budget ranges from $2,000 to $10,000 per month for digital marketing services. I work with e-commerce, SaaS, and service-based businesses.',
        contentType: 'conversation',
        topics: ['budget', 'pricing', 'ecommerce', 'saas', 'service-business', 'client-info'],
        metadata: { source: 'business-info', category: 'pricing', importance: 'medium' }
      }
    ]
    
    for (const item of knowledgeEntries) {
      const mockEmbedding = Array.from({ length: 1536 }, () => Math.random() * 2 - 1)
      
      await prisma.$executeRaw`
        INSERT INTO user_knowledge_base (user_id, content, content_type, topics, metadata, embedding, importance_score)
        VALUES (${testUser.id}, ${item.content}, ${item.contentType}, ${item.topics}, ${JSON.stringify(item.metadata)}::jsonb, ${`[${mockEmbedding.join(',')}]`}::vector(1536), 0.9)
      `
      
      console.log(`  ✅ Added: "${item.content.substring(0, 60)}..."`)
    }
    
    // Test real RAG API queries
    console.log('\n🔍 Testing real RAG API with OpenAI...')
    
    const testQueries = [
      'What digital marketing strategies do you recommend?',
      'How should I approach A/B testing for my campaigns?',
      'What budget should I allocate for digital marketing?'
    ]
    
    for (const query of testQueries) {
      console.log(`\n📝 Testing query: "${query}"`)
      
      const response = await fetch('http://localhost:3000/api/ai-chat-rag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: query,
          userId: testUser.id,
          messages: [
            { role: 'user', content: query }
          ],
          clientConfig: {},
          cartState: null,
          currentUrl: '/test'
        })
      })
      
      console.log(`📊 Response status: ${response.status}`)
      
      if (response.ok) {
        const responseData = await response.json()
        console.log(`  📊 Cached: ${responseData.cached || responseData.cacheHit || false}`)
        console.log(`  📊 Confidence: ${responseData.confidence || 'N/A'}`)
        console.log(`  📊 Sources: ${(responseData.sources || []).join(', ')}`)
        console.log(`  📊 Context count: ${responseData.contextCount || (responseData.context || []).length}`)
        console.log(`  📝 Response: "${responseData.message.substring(0, 150)}..."`)
        
        // Check if response is personalized based on user knowledge
        const responseText = responseData.message.toLowerCase()
        if (query.toLowerCase().includes('digital marketing') && (responseText.includes('seo') || responseText.includes('content marketing'))) {
          console.log(`  ✅ Personalized response detected (includes user expertise)`)
        }
        if (query.toLowerCase().includes('budget') && (responseText.includes('2000') || responseText.includes('10000') || responseText.includes('budget'))) {
          console.log(`  ✅ Personalized response detected (includes user pricing info)`)
        }
        if (query.toLowerCase().includes('testing') && (responseText.includes('ab testing') || responseText.includes('data-driven'))) {
          console.log(`  ✅ Personalized response detected (includes user preferences)`)
        }
      } else {
        const errorText = await response.text()
        console.log(`  ❌ API Error: ${response.status} - ${errorText}`)
      }
      
      // Wait between requests
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
    
    // Test streaming response
    console.log('\n📡 Testing streaming RAG API...')
    
    const streamResponse = await fetch('http://localhost:3000/api/ai-chat-rag?stream=1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Give me a comprehensive digital marketing strategy',
        userId: testUser.id,
        messages: [
          { role: 'user', content: 'Give me a comprehensive digital marketing strategy' }
        ],
        clientConfig: {},
        cartState: null,
        currentUrl: '/test'
      })
    })
    
    console.log(`📊 Stream response status: ${streamResponse.status}`)
    
    if (streamResponse.ok) {
      console.log('📡 Streaming response:')
      console.log('─'.repeat(50))
      
      let fullStreamResponse = ''
      const reader = streamResponse.body.getReader()
      const decoder = new TextDecoder()
      
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          break
        }
        
        const chunk = decoder.decode(value, { stream: true })
        fullStreamResponse += chunk
        process.stdout.write(chunk)
      }
      
      console.log('\n' + '─'.repeat(50))
      console.log(`📊 Stream response length: ${fullStreamResponse.length} characters`)
      
      if (fullStreamResponse.toLowerCase().includes('seo') || fullStreamResponse.toLowerCase().includes('content marketing')) {
        console.log(`✅ Streaming response appears to be personalized`)
      }
    } else {
      const errorText = await streamResponse.text()
      console.log(`❌ Stream API Error: ${streamResponse.status} - ${errorText}`)
    }
    
    console.log('\n✅ Real RAG API test completed!')
    
  } catch (error) {
    console.error('❌ Error testing real RAG API:', error.message)
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure your Next.js development server is running:')
      console.log('   npm run dev')
    }
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up test data...')
    try {
      // Delete knowledge base entries
      await prisma.userKnowledgeBase.deleteMany({
        where: { 
          user: {
            email: 'real-rag-test@example.com'
          }
        }
      })
      
      // Delete cache entries
      await prisma.$executeRaw`
        DELETE FROM semantic_cache WHERE user_id IN (
          SELECT id FROM users WHERE email = 'real-rag-test@example.com'
        )
      `
      
      // Delete test user
      await prisma.user.deleteMany({
        where: {
          email: 'real-rag-test@example.com'
        }
      })
      
      console.log('  ✅ Test data cleaned up')
    } catch (error) {
      console.log(`  ⚠️  Cleanup failed: ${error.message}`)
    }
    
    await prisma.$disconnect()
  }
}

console.log('📊 Test Plan:')
console.log('  • Create test user with comprehensive knowledge base')
console.log('  • Test real RAG API with OpenAI integration')
console.log('  • Verify personalized responses based on user knowledge')
console.log('  • Test streaming functionality')
console.log('  • Clean up test data')

console.log('\n⚠️  Note: This test requires OPENAI_API_KEY environment variable to be set')

testRealRAGAPI()
