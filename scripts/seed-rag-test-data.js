#!/usr/bin/env node

/**
 * 🌱 RAG TEST DATA SEEDER
 * Seeds the database with test data for RAG performance testing
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const TEST_USERS = [
  {
    id: 'test-user-1',
    email: 'test1@example.com',
    name: 'Test User One',
  },
  {
    id: 'test-user-2', 
    email: 'test2@example.com',
    name: 'Test User Two',
  },
  {
    id: 'test-user-3',
    email: 'test3@example.com', 
    name: 'Test User Three',
  },
  {
    id: 'test-user-quick',
    email: 'quick@example.com',
    name: 'Quick Test User',
  }
]

const TEST_KNOWLEDGE_BASE = [
  {
    content_type: 'user_fact',
    content: 'My name is Test User One and I am 25 years old',
    metadata: { source: 'user_profile', timestamp: new Date().toISOString() },
    topics: ['personal', 'identity'],
  },
  {
    content_type: 'user_fact', 
    content: 'My name is Test User Two and I am 30 years old',
    metadata: { source: 'user_profile', timestamp: new Date().toISOString() },
    topics: ['personal', 'identity'],
  },
  {
    content_type: 'user_fact',
    content: 'My name is Test User Three and I am 35 years old', 
    metadata: { source: 'user_profile', timestamp: new Date().toISOString() },
    topics: ['personal', 'identity'],
  },
  {
    content_type: 'user_fact',
    content: 'My name is Quick Test User and I am 28 years old',
    metadata: { source: 'user_profile', timestamp: new Date().toISOString() },
    topics: ['personal', 'identity'],
  },
  {
    content_type: 'conversation',
    content: 'User: What websites do you recommend?\nAssistant: Based on your interests, I recommend checking out tech blogs like TechCrunch and product sites like Product Hunt. These have high traffic and good SEO potential.',
    metadata: { source: 'chat_conversation', timestamp: new Date().toISOString() },
    topics: ['websites', 'recommendations'],
  },
  {
    content_type: 'conversation',
    content: 'User: What are the pricing options?\nAssistant: Our website packages range from $99/month for basic sites to $499/month for premium packages with advanced SEO features.',
    metadata: { source: 'chat_conversation', timestamp: new Date().toISOString() },
    topics: ['pricing', 'packages'],
  },
  {
    content_type: 'conversation',
    content: 'User: Show me high-traffic websites\nAssistant: Here are some high-traffic websites in our catalog: NewsHub.com (500K monthly visitors), TechDaily.net (300K visitors), and BusinessInsider.org (750K visitors).',
    metadata: { source: 'chat_conversation', timestamp: new Date().toISOString() },
    topics: ['high_traffic', 'websites'],
  },
]

// Mock embedding generator (in real implementation, this would call OpenAI)
function generateMockEmbedding(text) {
  // Generate a deterministic "embedding" based on text content
  const hash = text.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)
  
  // Generate 1536-dimensional vector based on hash
  const embedding = []
  for (let i = 0; i < 1536; i++) {
    embedding.push(Math.sin(hash + i) * 0.1)
  }
  
  return embedding
}

async function seedTestData() {
  console.log('🌱 Seeding RAG test data...')
  
  try {
    // Create test users
    console.log('👥 Creating test users...')
    for (const user of TEST_USERS) {
      try {
        await prisma.user.upsert({
          where: { id: user.id },
          update: user,
          create: user,
        })
        console.log(`  ✅ Created/updated user: ${user.name}`)
      } catch (error) {
        console.log(`  ⚠️  User ${user.name} already exists or error: ${error.message}`)
      }
    }
    
    // Create knowledge base entries for each user
    console.log('📚 Creating knowledge base entries...')
    
    for (const user of TEST_USERS) {
      for (const kbEntry of TEST_KNOWLEDGE_BASE) {
        try {
          // Generate mock embedding
          const embedding = generateMockEmbedding(kbEntry.content)
          
          await prisma.$executeRaw`
            INSERT INTO user_knowledge_base (user_id, content, content_type, embedding, metadata, topics, created_at)
            VALUES (
              ${user.id},
              ${kbEntry.content},
              ${kbEntry.content_type},
              ${`[${embedding.join(',')}]`}::vector(1536),
              ${JSON.stringify(kbEntry.metadata)}::jsonb,
              ${kbEntry.topics},
              NOW()
            )
            ON CONFLICT DO NOTHING
          `
          
          console.log(`  ✅ Added ${kbEntry.content_type} for ${user.name}`)
        } catch (error) {
          console.log(`  ⚠️  Error adding ${kbEntry.content_type} for ${user.name}: ${error.message}`)
        }
      }
    }
    
    // Create some semantic cache entries for testing
    console.log('💾 Creating semantic cache entries...')
    
    const cacheEntries = [
      {
        query: 'What is my name?',
        response: { answer: 'Your name is Test User One', sources: ['user_profile'], confidence: 0.95 },
      },
      {
        query: 'Show me website recommendations',
        response: { answer: 'I recommend TechCrunch and Product Hunt for high traffic and SEO', sources: ['conversation'], confidence: 0.90 },
      },
    ]
    
    for (const user of TEST_USERS) {
      for (const cacheEntry of cacheEntries) {
        try {
          const queryHash = require('crypto').createHash('sha256').update(cacheEntry.query + user.id).digest('hex')
          const embedding = generateMockEmbedding(cacheEntry.query)
          const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
          
          await prisma.$executeRaw`
            INSERT INTO semantic_cache (user_id, query_hash, query_embedding, cached_response, expires_at, created_at)
            VALUES (
              ${user.id},
              ${queryHash},
              ${`[${embedding.join(',')}]`}::vector(1536),
              ${JSON.stringify(cacheEntry.response)}::jsonb,
              ${expiresAt},
              NOW()
            )
            ON CONFLICT (user_id, query_hash) DO NOTHING
          `
          
          console.log(`  ✅ Added cache entry for ${user.name}: "${cacheEntry.query}"`)
        } catch (error) {
          console.log(`  ⚠️  Error adding cache entry for ${user.name}: ${error.message}`)
        }
      }
    }
    
    console.log('\n🎉 Test data seeding completed!')
    console.log(`📊 Created:`)
    console.log(`  - ${TEST_USERS.length} test users`)
    console.log(`  - ${TEST_USERS.length * TEST_KNOWLEDGE_BASE.length} knowledge base entries`)
    console.log(`  - ${TEST_USERS.length * cacheEntries.length} semantic cache entries`)
    
    console.log('\n🚀 Ready for RAG performance testing!')
    console.log('Run: node scripts/quick-rag-test.js')
    
  } catch (error) {
    console.error('❌ Error seeding test data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seeder
if (require.main === module) {
  seedTestData().catch(console.error)
}

module.exports = { seedTestData }


