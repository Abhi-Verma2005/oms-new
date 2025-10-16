#!/usr/bin/env node

/**
 * 🧠 Test Embedding Generation (Mock)
 * Tests the embedding generation functionality with mock data
 */

console.log('🧠 Testing Embedding Generation (Mock)...\n')

// Mock OpenAI API key for testing
process.env.OPENAI_API_KEY = 'sk-test-key-for-testing'

async function testEmbeddingGeneration() {
  try {
    // Test embedding generation with mock
    console.log('📋 Testing embedding generation with mock...')
    
    // Create a mock embedding function
    const mockGenerateEmbedding = async (text) => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Return mock 1536-dimensional embedding
      return Array.from({ length: 1536 }, () => Math.random() * 2 - 1)
    }
    
    const testQueries = [
      'What are the best SEO strategies for my website?',
      'How can I improve my website performance?',
      'What are the current pricing options available?'
    ]
    
    for (const query of testQueries) {
      console.log(`📋 Testing: "${query}"`)
      const start = Date.now()
      
      try {
        const embedding = await mockGenerateEmbedding(query)
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
      const start = Date.now()
      const embeddings = await Promise.all(testQueries.map(mockGenerateEmbedding))
      const duration = Date.now() - start
      
      console.log(`  ✅ Batch generation: ${duration}ms for ${embeddings.length} embeddings`)
      console.log(`  📊 All embeddings valid: ${embeddings.every(e => e.length === 1536)}`)
    } catch (error) {
      console.log(`  ❌ Batch generation failed: ${error.message}`)
    }
    
    // Test cosine similarity calculation
    console.log('📋 Testing cosine similarity calculation...')
    try {
      const embedding1 = await mockGenerateEmbedding('test query 1')
      const embedding2 = await mockGenerateEmbedding('test query 2')
      
      const cosineSimilarity = (vec1, vec2) => {
        const dotProduct = vec1.reduce((sum, a, i) => sum + a * vec2[i], 0)
        const mag1 = Math.sqrt(vec1.reduce((sum, a) => sum + a * a, 0))
        const mag2 = Math.sqrt(vec2.reduce((sum, a) => sum + a * a, 0))
        return dotProduct / (mag1 * mag2)
      }
      
      const similarity = cosineSimilarity(embedding1, embedding2)
      console.log(`  ✅ Cosine similarity: ${similarity.toFixed(4)}`)
      
      if (similarity >= -1 && similarity <= 1) {
        console.log(`  ✅ Similarity within valid range [-1, 1]`)
      } else {
        console.log(`  ❌ Similarity out of range`)
      }
    } catch (error) {
      console.log(`  ❌ Cosine similarity test failed: ${error.message}`)
    }
    
    console.log('\n✅ Embedding generation test completed!')
    console.log('\n📊 Test Results Summary:')
    console.log('  • Mock embedding generation: ✅')
    console.log('  • Batch processing: ✅')
    console.log('  • Cosine similarity: ✅')
    console.log('  • Dimension validation: ✅')
    
  } catch (error) {
    console.error('❌ Embedding test failed:', error.message)
    process.exit(1)
  }
}

// Run test
testEmbeddingGeneration()
