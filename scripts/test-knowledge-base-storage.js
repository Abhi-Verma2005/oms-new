#!/usr/bin/env node

/**
 * 🧪 Test Knowledge Base Storage
 * Test that conversations are being vectorized and stored in the knowledge base
 */

console.log('🧪 Testing Knowledge Base Storage and Vectorization...\n')

async function testKnowledgeBaseStorage() {
  try {
    console.log('🔍 Testing if conversations are being stored and vectorized...')
    
    const testUserId = 'cmf2xwqgp00003bg1lzw6pev0'
    
    // Step 1: Tell the AI about your favorite food
    console.log('📝 Step 1: Telling AI about favorite food...')
    const foodMessage = 'my favorite food is pizza'
    
    const foodResponse = await fetch('http://localhost:3000/api/ai-chat?stream=1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: foodMessage,
        userId: testUserId,
        messages: [
          { role: 'user', content: foodMessage }
        ],
        config: {},
        currentUrl: '/test',
        cartState: null
      })
    })
    
    if (foodResponse.ok) {
      console.log('✅ Food preference shared successfully')
      
      // Read the response to ensure it's processed
      const reader = foodResponse.body.getReader()
      const decoder = new TextDecoder()
      let foodResponseContent = ''
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        foodResponseContent += decoder.decode(value, { stream: true })
      }
      
      console.log(`📝 AI Response: "${foodResponseContent.substring(0, 100)}..."`)
    } else {
      console.log('❌ Failed to share food preference')
      return
    }
    
    // Wait a moment for the async storage to complete
    console.log('⏳ Waiting for conversation to be stored in knowledge base...')
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Step 2: Ask about the favorite food
    console.log('\n📝 Step 2: Asking about favorite food...')
    const askMessage = 'what is my favorite food?'
    
    const askResponse = await fetch('http://localhost:3000/api/ai-chat?stream=1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: askMessage,
        userId: testUserId,
        messages: [
          { role: 'user', content: askMessage }
        ],
        config: {},
        currentUrl: '/test',
        cartState: null
      })
    })
    
    if (askResponse.ok) {
      // Read the response
      const reader = askResponse.body.getReader()
      const decoder = new TextDecoder()
      let askResponseContent = ''
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        askResponseContent += decoder.decode(value, { stream: true })
      }
      
      console.log(`📝 AI Response: "${askResponseContent}"`)
      
      // Check if the AI remembered
      if (askResponseContent.toLowerCase().includes('pizza')) {
        console.log('✅ SUCCESS: AI remembered your favorite food!')
        console.log('✅ Knowledge base storage and vectorization is working!')
      } else {
        console.log('❌ FAILED: AI did not remember your favorite food')
        console.log('❌ Knowledge base storage might not be working')
      }
      
    } else {
      console.log('❌ Failed to ask about favorite food')
    }
    
    // Step 3: Check database directly
    console.log('\n🔍 Step 3: Checking database for stored conversations...')
    
    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()
    
    try {
      const knowledgeBaseEntries = await prisma.$queryRaw`
        SELECT id, content, content_type, created_at
        FROM user_knowledge_base 
        WHERE user_id = ${testUserId}
        ORDER BY created_at DESC
        LIMIT 5
      `
      
      console.log(`📊 Found ${knowledgeBaseEntries.length} entries in knowledge base:`)
      knowledgeBaseEntries.forEach((entry, index) => {
        console.log(`  ${index + 1}. ${entry.content_type}: "${entry.content.substring(0, 100)}..."`)
        console.log(`     Created: ${entry.created_at}`)
      })
      
      if (knowledgeBaseEntries.length > 0) {
        console.log('✅ Knowledge base has stored conversations!')
      } else {
        console.log('❌ No conversations found in knowledge base')
      }
      
    } catch (dbError) {
      console.log('❌ Failed to check database:', dbError.message)
    } finally {
      await prisma.$disconnect()
    }
    
  } catch (error) {
    console.error('❌ Error testing knowledge base storage:', error.message)
  }
}

testKnowledgeBaseStorage()
