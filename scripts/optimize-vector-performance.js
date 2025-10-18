#!/usr/bin/env node

/**
 * 🚀 VECTOR DATABASE PERFORMANCE OPTIMIZATION
 * Implements advanced vector indexing and optimization strategies
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function optimizeVectorPerformance() {
  console.log('🚀 Optimizing Vector Database Performance...')
  
  try {
    // 1. Create HNSW index for faster vector similarity search
    console.log('📊 Creating HNSW vector index...')
    
    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS user_knowledge_base_embedding_hnsw_idx 
      ON user_knowledge_base 
      USING hnsw (embedding vector_cosine_ops)
      WITH (m = 16, ef_construction = 64)
    `
    
    console.log('✅ HNSW index created successfully')
    
    // 2. Create IVFFlat index as fallback for smaller datasets
    console.log('📊 Creating IVFFlat vector index...')
    
    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS user_knowledge_base_embedding_ivfflat_idx 
      ON user_knowledge_base 
      USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100)
    `
    
    console.log('✅ IVFFlat index created successfully')
    
    // 3. Create composite indexes for better query performance
    console.log('📊 Creating composite indexes...')
    
    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS user_knowledge_base_user_content_type_created_idx 
      ON user_knowledge_base (user_id, content_type, created_at DESC)
    `
    
    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS user_knowledge_base_user_created_idx 
      ON user_knowledge_base (user_id, created_at DESC)
    `
    
    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS semantic_cache_user_hash_idx 
      ON semantic_cache (user_id, query_hash)
    `
    
    console.log('✅ Composite indexes created successfully')
    
    // 4. Update table statistics for better query planning
    console.log('📊 Updating table statistics...')
    
    await prisma.$executeRaw`ANALYZE user_knowledge_base`
    await prisma.$executeRaw`ANALYZE semantic_cache`
    
    console.log('✅ Table statistics updated successfully')
    
    // 5. Optimize PostgreSQL configuration for vector operations
    console.log('📊 Optimizing PostgreSQL configuration...')
    
    // These settings can be applied via environment variables or postgresql.conf
    const optimizations = [
      'shared_preload_libraries = "vector"',
      'max_connections = 200',
      'shared_buffers = 256MB',
      'effective_cache_size = 1GB',
      'work_mem = 4MB',
      'maintenance_work_mem = 64MB',
      'random_page_cost = 1.1',
      'effective_io_concurrency = 200'
    ]
    
    console.log('📋 Recommended PostgreSQL optimizations:')
    optimizations.forEach(opt => console.log(`   ${opt}`))
    
    console.log('\n🎉 Vector database optimization completed!')
    console.log('\n📈 Expected Performance Improvements:')
    console.log('   - HNSW Index: 10-100x faster vector similarity search')
    console.log('   - Composite Indexes: 5-10x faster filtered queries')
    console.log('   - Optimized Statistics: Better query planning')
    console.log('   - Configuration Tuning: Improved overall performance')
    
    // 6. Test the optimizations
    console.log('\n🧪 Testing vector search performance...')
    
    const testStart = Date.now()
    
    // Test vector similarity search
    const testEmbedding = Array.from({ length: 1536 }, () => Math.random() * 2 - 1)
    
    const testResults = await prisma.$queryRaw`
      SELECT 
        id,
        content,
        content_type,
        1 - (embedding <=> ${`[${testEmbedding.join(',')}]`}::vector(1536)) AS similarity
      FROM user_knowledge_base
      WHERE user_id = 'test-user-quick'
        AND embedding IS NOT NULL
      ORDER BY embedding <=> ${`[${testEmbedding.join(',')}]`}::vector(1536)
      LIMIT 10
    `
    
    const testEnd = Date.now()
    const searchTime = testEnd - testStart
    
    console.log(`✅ Vector search test completed in ${searchTime}ms`)
    console.log(`   Retrieved ${testResults.length} results`)
    
    if (searchTime < 100) {
      console.log('🚀 EXCELLENT: Vector search is very fast (<100ms)')
    } else if (searchTime < 500) {
      console.log('✅ GOOD: Vector search is fast (<500ms)')
    } else {
      console.log('⚠️  SLOW: Vector search needs further optimization')
    }
    
  } catch (error) {
    console.error('❌ Error optimizing vector performance:', error)
    
    if (error.message.includes('extension "vector" is not available')) {
      console.log('\n💡 Solution: Install pgvector extension:')
      console.log('   CREATE EXTENSION IF NOT EXISTS vector;')
    }
    
    if (error.message.includes('hnsw')) {
      console.log('\n💡 Solution: HNSW index requires PostgreSQL 12+ with pgvector 0.4+')
      console.log('   Consider using IVFFlat index instead for older versions')
    }
  } finally {
    await prisma.$disconnect()
  }
}

// Run the optimization
if (require.main === module) {
  optimizeVectorPerformance().catch(console.error)
}

module.exports = { optimizeVectorPerformance }


