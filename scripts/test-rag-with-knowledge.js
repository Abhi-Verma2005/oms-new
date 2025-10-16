#!/usr/bin/env node

/**
 * 🧪 Test RAG with Knowledge Base
 * Tests RAG system with actual user knowledge
 */

const { PrismaClient } = require('@prisma/client')

console.log('🧪 Testing RAG with Knowledge Base...\n')

const prisma = new PrismaClient()

async function testRAGWithKnowledge() {
  try {
    console.log('🔍 Testing RAG system with user knowledge...')
    
    // Create test user
    const testUser = await prisma.user.upsert({
      where: { email: 'rag-test@example.com' },
      update: {},
      create: {
        email: 'rag-test@example.com',
        name: 'RAG Test User'
      }
    })
    
    console.log(`👤 Created test user: ${testUser.email} (ID: ${testUser.id})`)
    
    // Add knowledge to the user's knowledge base
    console.log('\n📝 Adding knowledge to user knowledge base...')
    
    const knowledgeEntries = [
      {
        content: 'I prefer SEO-focused strategies and technical optimization for my websites.',
        contentType: 'conversation',
        topics: ['SEO', 'technical', 'preference'],
        metadata: { source: 'user-preference', category: 'seo' }
      },
      {
        content: 'I am interested in e-commerce platforms and Shopify integration for my business.',
        contentType: 'conversation',
        topics: ['ecommerce', 'shopify', 'business'],
        metadata: { source: 'user-interest', category: 'ecommerce' }
      },
      {
        content: 'My website focuses on digital marketing services and client acquisition.',
        contentType: 'conversation',
        topics: ['digital-marketing', 'services', 'client-acquisition'],
        metadata: { source: 'business-info', category: 'services' }
      }
    ]
    
    for (const item of knowledgeEntries) {
      const mockEmbedding = Array.from({ length: 1536 }, () => Math.random() * 2 - 1)
      
      await prisma.$executeRaw`
        INSERT INTO user_knowledge_base (user_id, content, content_type, topics, metadata, embedding, importance_score)
        VALUES (${testUser.id}, ${item.content}, ${item.contentType}, ${item.topics}, ${JSON.stringify(item.metadata)}::jsonb, ${`[${mockEmbedding.join(',')}]`}::vector(1536), 0.9)
      `
      
      console.log(`  ✅ Added: "${item.content.substring(0, 50)}..."`)
    }
    
    // Test RAG API with knowledge
    console.log('\n🔍 Testing RAG API with user knowledge...')
    
    const testQueries = [
      'How can I improve my website SEO?',
      'What e-commerce platforms do you recommend?',
      'Tell me about digital marketing services'
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
      
      if (response.ok) {
        const responseData = await response.json()
        console.log(`  📊 Cached: ${responseData.cached}`)
        console.log(`  📊 Confidence: ${responseData.confidence}`)
        console.log(`  📊 Sources: ${responseData.sources.join(', ')}`)
        console.log(`  📊 Context count: ${responseData.context.length}`)
        console.log(`  📝 Response: "${responseData.message.substring(0, 100)}..."`)
        
        // Check if response mentions user's preferences
        if (responseData.message.toLowerCase().includes('seo') && query.toLowerCase().includes('seo')) {
          console.log(`  ✅ SEO preference detected in response`)
        }
        if (responseData.message.toLowerCase().includes('e-commerce') && query.toLowerCase().includes('e-commerce')) {
          console.log(`  ✅ E-commerce interest detected in response`)
        }
      } else {
        console.log(`  ❌ API Error: ${response.status}`)
      }
    }
    
    // Test knowledge isolation
    console.log('\n🔍 Testing knowledge isolation...')
    
    // Create another user
    const otherUser = await prisma.user.upsert({
      where: { email: 'other-user@example.com' },
      update: {},
      create: {
        email: 'other-user@example.com',
        name: 'Other User'
      }
    })
    
    console.log(`👤 Created other user: ${otherUser.email}`)
    
    // Test that other user doesn't see first user's knowledge
    const otherUserResponse = await fetch('http://localhost:3000/api/ai-chat-rag', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'How can I improve my website SEO?',
        userId: otherUser.id,
        messages: [
          { role: 'user', content: 'How can I improve my website SEO?' }
        ],
        clientConfig: {},
        cartState: null,
        currentUrl: '/test'
      })
    })
    
    if (otherUserResponse.ok) {
      const otherUserData = await otherUserResponse.json()
      console.log(`  📊 Other user's context count: ${otherUserData.context.length}`)
      console.log(`  📝 Other user's response: "${otherUserData.message.substring(0, 100)}..."`)
      
      if (otherUserData.context.length === 0) {
        console.log(`  ✅ Knowledge isolation verified: Other user has no access to first user's knowledge`)
      } else {
        console.log(`  ❌ Knowledge isolation failed: Other user can see first user's knowledge`)
      }
    }
    
    console.log('\n✅ RAG with knowledge test completed!')
    
  } catch (error) {
    console.error('❌ Error testing RAG with knowledge:', error.message)
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up test data...')
    try {
      // Delete knowledge base entries
      await prisma.userKnowledgeBase.deleteMany({
        where: { 
          user: {
            email: {
              in: ['rag-test@example.com', 'other-user@example.com']
            }
          }
        }
      })
      
      // Delete cache entries
      await prisma.$executeRaw`
        DELETE FROM semantic_cache WHERE user_id IN (
          SELECT id FROM users WHERE email IN ('rag-test@example.com', 'other-user@example.com')
        )
      `
      
      // Delete test users
      await prisma.user.deleteMany({
        where: {
          email: {
            in: ['rag-test@example.com', 'other-user@example.com']
          }
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
console.log('  • Create test user with knowledge base entries')
console.log('  • Test RAG API with user-specific knowledge')
console.log('  • Verify knowledge isolation between users')
console.log('  • Clean up test data')

testRAGWithKnowledge()
