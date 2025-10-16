#!/usr/bin/env node

/**
 * 🧠 Test Embedding Generation
 * Tests the embedding generation functionality
 */

console.log('🧠 Testing Embedding Generation...\n')

async function testEmbeddingGeneration() {
  try {
    // Test embedding generation
    const { generateEmbedding } = require('../lib/embedding-utils')
    
    const testQueries = [
      'What are the best SEO strategies for my website?',
      'How can I improve my website performance?',
      'What are the current pricing options available?'
    ]
    
    for (const query of testQueries) {
      console.log(`📋 Testing: "${query}"`)
      const start = Date.now()
      
      try {
        const embedding = await generateEmbedding(query)
        const duration = Date.now() - start
        
        if (embedding && embedding.length === 1536) {
          console.log(`  ✅ Success: ${duration}ms, dimensions: ${embedding.length}`)
          console.log(`  📊 First 5 values: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`)
        } else {
          console.log(`  ❌ Invalid embedding: dimensions=${embedding?.length}`)
        }
      } catch (error) {
        console.log(`  ❌ Failed: ${error.message}`)
      }
      
      console.log('')
    }
    
    // Test batch embedding generation
    console.log('📋 Testing batch embedding generation...')
    try {
      const { OptimizedQueries } = require('../lib/rag/hybrid-search')
      if (OptimizedQueries && OptimizedQueries.batchGenerateEmbeddings) {
        const start = Date.now()
        const embeddings = await OptimizedQueries.batchGenerateEmbeddings(testQueries)
        const duration = Date.now() - start
        
        console.log(`  ✅ Batch generation: ${duration}ms for ${embeddings.length} embeddings`)
      } else {
        console.log('  ⚠️  Batch generation not available')
      }
    } catch (error) {
      console.log(`  ❌ Batch generation failed: ${error.message}`)
    }
    
    console.log('\n✅ Embedding generation test completed!')
    
  } catch (error) {
    console.error('❌ Embedding test failed:', error.message)
    process.exit(1)
  }
}

// Run test
testEmbeddingGeneration()
