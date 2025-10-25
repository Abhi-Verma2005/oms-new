const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function migrateToMinimal() {
  console.log('🔄 Starting migration to minimal schema...')
  
  try {
    // Add default values to existing tables
    console.log('📝 Adding default values to existing tables...')
    
    // Update bonus_grants with default reason
    await prisma.$executeRaw`
      UPDATE bonus_grants 
      SET reason = 'Legacy grant' 
      WHERE reason IS NULL
    `
    
    // Update orders with default total
    await prisma.$executeRaw`
      UPDATE orders 
      SET total = 0 
      WHERE total IS NULL
    `
    
    console.log('✅ Default values added successfully')
    
    // Create conversations table
    console.log('📦 Creating conversations table...')
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        messages JSONB NOT NULL DEFAULT '[]'::jsonb,
        rag_context JSONB DEFAULT '{}'::jsonb,
        user_context JSONB DEFAULT '{}'::jsonb,
        documents JSONB DEFAULT '[]'::jsonb,
        tool_history JSONB DEFAULT '[]'::jsonb,
        performance JSONB DEFAULT '{}'::jsonb,
        cache_data JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `
    
    // Create indexes
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id)
    `
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at)
    `
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_conversations_rag ON conversations USING GIN (rag_context)
    `
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_conversations_user_context ON conversations USING GIN (user_context)
    `
    
    console.log('✅ Conversations table created with indexes')
    
    // Migrate existing AI data to conversations
    console.log('🔄 Migrating existing AI data...')
    
    const users = await prisma.user.findMany({
      select: { id: true }
    })
    
    for (const user of users) {
      // Create a conversation for each user
      await prisma.conversation.create({
        data: {
          userId: user.id,
          messages: [],
          ragContext: {
            sources: [],
            cacheHit: false,
            contextCount: 0
          },
          userContext: {
            profile: {},
            aiInsights: {},
            interactions: 0,
            lastInteraction: null
          },
          documents: [],
          toolHistory: [],
          performance: {
            totalInteractions: 0,
            avgResponseTime: 0,
            cacheHitRate: 0
          },
          cacheData: {}
        }
      })
    }
    
    console.log(`✅ Created conversations for ${users.length} users`)
    console.log('🎉 Migration completed successfully!')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

migrateToMinimal()
  .catch((error) => {
    console.error('Migration failed:', error)
    process.exit(1)
  })

