const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addConversationsTable() {
  console.log('🔄 Adding conversations table...')
  
  try {
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
    
    // Create a conversation for each existing user
    console.log('🔄 Creating conversations for existing users...')
    
    const users = await prisma.user.findMany({
      select: { id: true }
    })
    
    for (const user of users) {
      // Check if conversation already exists
      const existingConversation = await prisma.$queryRaw`
        SELECT id FROM conversations WHERE user_id = ${user.id} LIMIT 1
      `
      
      if (existingConversation.length === 0) {
        await prisma.$executeRaw`
          INSERT INTO conversations (user_id, messages, rag_context, user_context, documents, tool_history, performance, cache_data)
          VALUES (
            ${user.id},
            '[]'::jsonb,
            '{"sources": [], "cacheHit": false, "contextCount": 0}'::jsonb,
            '{"profile": {}, "aiInsights": {}, "interactions": 0, "lastInteraction": null}'::jsonb,
            '[]'::jsonb,
            '[]'::jsonb,
            '{"totalInteractions": 0, "avgResponseTime": 0, "cacheHitRate": 0}'::jsonb,
            '{}'::jsonb
          )
        `
      }
    }
    
    console.log(`✅ Created conversations for ${users.length} users`)
    console.log('🎉 Conversations table setup completed!')
    
  } catch (error) {
    console.error('❌ Setup failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

addConversationsTable()
  .catch((error) => {
    console.error('Setup failed:', error)
    process.exit(1)
  })
