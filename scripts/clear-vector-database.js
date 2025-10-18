#!/usr/bin/env node

/**
 * Clear Vector Database Script
 * Completely clears all vector embeddings and knowledge base data
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearVectorDatabase() {
  console.log('🧹 Starting complete vector database cleanup...');
  
  try {
    // Clear all user knowledge base entries
    console.log('🗑️  Clearing user knowledge base...');
    const deletedKnowledge = await prisma.$executeRaw`
      DELETE FROM user_knowledge_base
    `;
    console.log(`✅ Deleted ${deletedKnowledge} knowledge base entries`);
    
    // Clear all semantic cache entries
    console.log('🗑️  Clearing semantic cache...');
    const deletedCache = await prisma.$executeRaw`
      DELETE FROM semantic_cache
    `;
    console.log(`✅ Deleted ${deletedCache} cache entries`);
    
    // Clear conversation memory if table exists
    console.log('🗑️  Clearing conversation memory...');
    let deletedMemory = 0;
    try {
      deletedMemory = await prisma.$executeRaw`
        DELETE FROM conversation_memory
      `;
      console.log(`✅ Deleted ${deletedMemory} memory entries`);
    } catch (error) {
      console.log('⚠️  Conversation memory table does not exist, skipping...');
    }
    
    // Clear user activity logs if table exists
    console.log('🗑️  Clearing user activity logs...');
    let deletedActivity = 0;
    try {
      deletedActivity = await prisma.$executeRaw`
        DELETE FROM user_activity_log
      `;
      console.log(`✅ Deleted ${deletedActivity} activity log entries`);
    } catch (error) {
      console.log('⚠️  User activity log table does not exist, skipping...');
    }
    
    // Clear test users if User table exists
    console.log('🗑️  Clearing test users...');
    let deletedUsers = 0;
    try {
      deletedUsers = await prisma.$executeRaw`
        DELETE FROM "User" WHERE id LIKE 'test-%' OR id LIKE 'ultra-test-%'
      `;
      console.log(`✅ Deleted ${deletedUsers} test users`);
    } catch (error) {
      console.log('⚠️  User table does not exist, skipping...');
    }
    
    // Reset any sequences or counters if User table exists
    console.log('🔄 Resetting database sequences...');
    try {
      await prisma.$executeRaw`
        SELECT setval(pg_get_serial_sequence('"User"', 'id'), 1, false)
      `;
      console.log('✅ Database sequences reset');
    } catch (error) {
      console.log('⚠️  Could not reset sequences, skipping...');
    }
    
    console.log('✅ Vector database completely cleared!');
    console.log('📊 Summary:');
    console.log(`   - Knowledge base entries: ${deletedKnowledge}`);
    console.log(`   - Cache entries: ${deletedCache}`);
    console.log(`   - Memory entries: ${deletedMemory}`);
    console.log(`   - Activity logs: ${deletedActivity}`);
    console.log(`   - Test users: ${deletedUsers}`);
    
  } catch (error) {
    console.error('❌ Error clearing vector database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
if (require.main === module) {
  clearVectorDatabase()
    .then(() => {
      console.log('🎉 Database cleanup completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Database cleanup failed:', error);
      process.exit(1);
    });
}

module.exports = { clearVectorDatabase };
