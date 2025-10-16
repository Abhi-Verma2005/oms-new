#!/usr/bin/env node

/**
 * 🧪 Debug RAG Retrieval
 * Debug why the AI isn't using the knowledge base context
 */

console.log('🧪 Debugging RAG Retrieval...\n')

async function debugRAGRetrieval() {
  try {
    console.log('🔍 Debugging RAG retrieval process...')
    
    const testUserId = 'cmf2xwqgp00003bg1lzw6pev0'
    const testMessage = 'what is my favorite food?'
    
    // Step 1: Check what's in the knowledge base
    console.log('📊 Step 1: Checking knowledge base contents...')
    
    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()
    
    try {
      const knowledgeBaseEntries = await prisma.$queryRaw`
        SELECT id, content, content_type, created_at
        FROM user_knowledge_base 
        WHERE user_id = ${testUserId}
        ORDER BY created_at DESC
        LIMIT 10
      `
      
      console.log(`📊 Found ${knowledgeBaseEntries.length} entries in knowledge base:`)
      knowledgeBaseEntries.forEach((entry, index) => {
        console.log(`  ${index + 1}. ${entry.content_type}: "${entry.content.substring(0, 100)}..."`)
      })
      
      if (knowledgeBaseEntries.length === 0) {
        console.log('❌ No knowledge base entries found!')
        return
      }
      
      // Step 2: Test vector similarity search manually
      console.log('\n🔍 Step 2: Testing vector similarity search...')
      
      // Generate embedding for the query
      const apiKey = process.env.OPEN_AI_KEY || process.env.OPENAI_API_KEY
      if (!apiKey) {
        console.log('❌ No OpenAI API key found')
        return
      }
      
      const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: testMessage,
        }),
      })
      
      if (!embeddingResponse.ok) {
        console.log('❌ Failed to generate embedding')
        return
      }
      
      const embeddingData = await embeddingResponse.json()
      const queryEmbedding = embeddingData.data[0].embedding
      
      console.log('✅ Generated query embedding')
      
      // Search for similar content
      const searchResults = await prisma.$queryRaw`
        SELECT 
          id,
          content,
          metadata,
          1 - (embedding <=> ${`[${queryEmbedding.join(',')}]`}::vector(1536)) as similarity
        FROM user_knowledge_base
        WHERE user_id = ${testUserId}
          AND embedding IS NOT NULL
        ORDER BY embedding <=> ${`[${queryEmbedding.join(',')}]`}::vector(1536)
        LIMIT 5
      `
      
      console.log(`📊 Found ${searchResults.length} similar entries:`)
      searchResults.forEach((result, index) => {
        console.log(`  ${index + 1}. Similarity: ${result.similarity.toFixed(4)}`)
        console.log(`     Content: "${result.content.substring(0, 150)}..."`)
        console.log('')
      })
      
      if (searchResults.length === 0) {
        console.log('❌ No similar entries found!')
        return
      }
      
      // Step 3: Check if the most similar entry contains pizza info
      const mostSimilar = searchResults[0]
      if (mostSimilar.content.toLowerCase().includes('pizza')) {
        console.log('✅ Found pizza information in most similar entry!')
        console.log('🔍 The RAG retrieval should work...')
      } else {
        console.log('❌ Most similar entry does not contain pizza information')
        console.log('🔍 This explains why the AI can\'t remember the favorite food')
      }
      
    } catch (dbError) {
      console.log('❌ Database error:', dbError.message)
    } finally {
      await prisma.$disconnect()
    }
    
  } catch (error) {
    console.error('❌ Error debugging RAG retrieval:', error.message)
  }
}

debugRAGRetrieval()
