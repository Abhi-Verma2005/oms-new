#!/usr/bin/env node

/**
 * 🏥 RAG System Health Check Script
 * Validates all components of the RAG system are working correctly
 */

const { execSync } = require('child_process')

console.log('🏥 RAG System Health Check')
console.log('==========================\n')

// Health check results
const healthChecks = {
  database: false,
  vectorExtension: false,
  indexes: false,
  openai: false,
  cohere: false,
  ragPipeline: false,
  embeddingGeneration: false,
  hybridSearch: false,
  caching: false
}

/**
 * Test database connectivity
 */
async function checkDatabase() {
  console.log('🗄️  Checking database connectivity...')
  
  try {
    execSync('psql $DATABASE_URL -c "SELECT 1;"', { stdio: 'pipe' })
    console.log('  ✅ Database connection successful')
    healthChecks.database = true
  } catch (error) {
    console.log('  ❌ Database connection failed')
    return false
  }
  
  return true
}

/**
 * Check pgvector extension
 */
async function checkVectorExtension() {
  console.log('🧮 Checking pgvector extension...')
  
  try {
    const result = execSync('psql $DATABASE_URL -c "SELECT * FROM pg_extension WHERE extname = \'vector\';"', { 
      stdio: 'pipe', 
      encoding: 'utf8' 
    })
    
    if (result.includes('vector')) {
      console.log('  ✅ pgvector extension installed')
      healthChecks.vectorExtension = true
      return true
    } else {
      console.log('  ❌ pgvector extension not found')
      return false
    }
  } catch (error) {
    console.log('  ❌ Could not check pgvector extension')
    return false
  }
}

/**
 * Check database indexes
 */
async function checkIndexes() {
  console.log('📊 Checking database indexes...')
  
  try {
    const indexes = execSync('psql $DATABASE_URL -c "SELECT indexname FROM pg_indexes WHERE tablename = \'user_knowledge_base\';"', { 
      stdio: 'pipe', 
      encoding: 'utf8' 
    })
    
    const requiredIndexes = [
      'idx_knowledge_hnsw',
      'idx_knowledge_fulltext',
      'idx_knowledge_user'
    ]
    
    const missingIndexes = requiredIndexes.filter(index => !indexes.includes(index))
    
    if (missingIndexes.length === 0) {
      console.log('  ✅ All required indexes found')
      healthChecks.indexes = true
      return true
    } else {
      console.log(`  ❌ Missing indexes: ${missingIndexes.join(', ')}`)
      return false
    }
  } catch (error) {
    console.log('  ❌ Could not check database indexes')
    return false
  }
}

/**
 * Check OpenAI API connectivity
 */
async function checkOpenAI() {
  console.log('🤖 Checking OpenAI API...')
  
  if (!process.env.OPENAI_API_KEY) {
    console.log('  ❌ OpenAI API key not configured')
    return false
  }
  
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      }
    })
    
    if (response.ok) {
      console.log('  ✅ OpenAI API accessible')
      healthChecks.openai = true
      return true
    } else {
      console.log(`  ❌ OpenAI API error: ${response.status}`)
      return false
    }
  } catch (error) {
    console.log(`  ❌ OpenAI API connection failed: ${error.message}`)
    return false
  }
}

/**
 * Check Cohere API connectivity
 */
async function checkCohere() {
  console.log('🎯 Checking Cohere API...')
  
  if (!process.env.COHERE_API_KEY) {
    console.log('  ⚠️  Cohere API key not configured (reranking will use fallback)')
    healthChecks.cohere = false
    return true // Not critical
  }
  
  try {
    const response = await fetch('https://api.cohere.ai/v1/rerank', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.COHERE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'rerank-english-v3.0',
        query: 'test',
        documents: ['test document'],
        topN: 1
      })
    })
    
    if (response.ok) {
      console.log('  ✅ Cohere API accessible')
      healthChecks.cohere = true
      return true
    } else {
      console.log(`  ❌ Cohere API error: ${response.status}`)
      return false
    }
  } catch (error) {
    console.log(`  ❌ Cohere API connection failed: ${error.message}`)
    return false
  }
}

/**
 * Test embedding generation
 */
async function testEmbeddingGeneration() {
  console.log('🧠 Testing embedding generation...')
  
  try {
    const { generateEmbedding } = require('../lib/embedding-utils')
    const embedding = await generateEmbedding('test query')
    
    if (embedding && embedding.length === 1536) {
      console.log('  ✅ Embedding generation works')
      healthChecks.embeddingGeneration = true
      return true
    } else {
      console.log('  ❌ Invalid embedding dimensions')
      return false
    }
  } catch (error) {
    console.log(`  ❌ Embedding generation failed: ${error.message}`)
    return false
  }
}

/**
 * Test hybrid search
 */
async function testHybridSearch() {
  console.log('🔍 Testing hybrid search...')
  
  try {
    const { hybridSearch } = require('../lib/rag/hybrid-search')
    const results = await hybridSearch('test-user', 'test query', {
      semanticWeight: 0.7,
      keywordWeight: 0.3,
      topK: 5,
      minSimilarity: 0.5
    })
    
    console.log(`  ✅ Hybrid search works (${results.length} results)`)
    healthChecks.hybridSearch = true
    return true
  } catch (error) {
    console.log(`  ❌ Hybrid search failed: ${error.message}`)
    return false
  }
}

/**
 * Test semantic caching
 */
async function testCaching() {
  console.log('💾 Testing semantic caching...')
  
  try {
    const { semanticCache } = require('../lib/rag/semantic-cache')
    
    // Test cache miss
    const result1 = await semanticCache.get('test-user', 'test query')
    
    // Test cache set
    await semanticCache.set('test-user', 'test query', {
      query: 'test query',
      relevantDocs: [],
      userContext: {},
      metadata: { test: true }
    })
    
    // Test cache hit
    const result2 = await semanticCache.get('test-user', 'test query')
    
    if (result2) {
      console.log('  ✅ Semantic caching works')
      healthChecks.caching = true
      return true
    } else {
      console.log('  ❌ Semantic caching not working')
      return false
    }
  } catch (error) {
    console.log(`  ❌ Semantic caching failed: ${error.message}`)
    return false
  }
}

/**
 * Test complete RAG pipeline
 */
async function testRAGPipeline() {
  console.log('🚀 Testing RAG pipeline...')
  
  try {
    const { ragPipeline } = require('../lib/rag/rag-pipeline')
    const context = await ragPipeline.getContext('test-user', 'test query', {
      useCache: true,
      topK: 5,
      minRelevance: 0.6,
      enableReranking: true
    })
    
    if (context && context.query && context.relevantDocs) {
      console.log('  ✅ RAG pipeline works')
      console.log(`     📊 Docs retrieved: ${context.metadata.totalDocs}`)
      console.log(`     📊 Cache hit: ${context.metadata.cacheHit ? 'Yes' : 'No'}`)
      healthChecks.ragPipeline = true
      return true
    } else {
      console.log('  ❌ RAG pipeline returned invalid result')
      return false
    }
  } catch (error) {
    console.log(`  ❌ RAG pipeline failed: ${error.message}`)
    return false
  }
}

/**
 * Generate health report
 */
function generateHealthReport() {
  console.log('\n📊 Health Check Report')
  console.log('======================')
  
  const checks = [
    { name: 'Database Connection', status: healthChecks.database },
    { name: 'pgvector Extension', status: healthChecks.vectorExtension },
    { name: 'Database Indexes', status: healthChecks.indexes },
    { name: 'OpenAI API', status: healthChecks.openai },
    { name: 'Cohere API', status: healthChecks.cohere },
    { name: 'Embedding Generation', status: healthChecks.embeddingGeneration },
    { name: 'Hybrid Search', status: healthChecks.hybridSearch },
    { name: 'Semantic Caching', status: healthChecks.caching },
    { name: 'RAG Pipeline', status: healthChecks.ragPipeline }
  ]
  
  let passedChecks = 0
  let totalChecks = checks.length
  
  checks.forEach(check => {
    const status = check.status ? '✅' : '❌'
    console.log(`${status} ${check.name}`)
    if (check.status) passedChecks++
  })
  
  console.log(`\n📈 Overall Health: ${passedChecks}/${totalChecks} checks passed`)
  
  const healthPercentage = (passedChecks / totalChecks) * 100
  
  if (healthPercentage >= 90) {
    console.log('🎉 EXCELLENT: RAG system is healthy and ready for production!')
  } else if (healthPercentage >= 70) {
    console.log('⚠️  GOOD: RAG system is mostly functional with minor issues')
  } else if (healthPercentage >= 50) {
    console.log('🔧 FAIR: RAG system has significant issues that need attention')
  } else {
    console.log('❌ POOR: RAG system is not functional and needs immediate fixes')
  }
  
  // Recommendations
  console.log('\n🔧 Recommendations:')
  
  if (!healthChecks.database) {
    console.log('• Fix database connection - check DATABASE_URL environment variable')
  }
  
  if (!healthChecks.vectorExtension) {
    console.log('• Install pgvector extension: CREATE EXTENSION vector;')
  }
  
  if (!healthChecks.indexes) {
    console.log('• Create missing database indexes - run migration script')
  }
  
  if (!healthChecks.openai) {
    console.log('• Configure OpenAI API key - check OPENAI_API_KEY environment variable')
  }
  
  if (!healthChecks.cohere) {
    console.log('• Configure Cohere API key for better reranking performance')
  }
  
  if (healthPercentage >= 90) {
    console.log('• System is ready for production deployment!')
    console.log('• Monitor performance metrics regularly')
    console.log('• Set up alerting for critical failures')
  }
}

/**
 * Main health check function
 */
async function runHealthCheck() {
  try {
    await checkDatabase()
    await checkVectorExtension()
    await checkIndexes()
    await checkOpenAI()
    await checkCohere()
    await testEmbeddingGeneration()
    await testHybridSearch()
    await testCaching()
    await testRAGPipeline()
    
    generateHealthReport()
    
  } catch (error) {
    console.error(`❌ Health check failed: ${error.message}`)
    process.exit(1)
  }
}

// Run health check
runHealthCheck()
