#!/usr/bin/env node

/**
 * Update database columns to use proper vector type
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateVectorColumns() {
  try {
    console.log('🔄 Updating vector columns to use proper pgvector type...')
    
    // Update user_knowledge_base.embedding column
    console.log('📝 Updating user_knowledge_base.embedding column...')
    await prisma.$executeRaw`
      ALTER TABLE user_knowledge_base 
      ALTER COLUMN embedding TYPE vector(1536) 
      USING embedding::vector(1536)
    `
    console.log('✅ Updated user_knowledge_base.embedding')
    
    // Update semantic_cache.query_embedding column
    console.log('📝 Updating semantic_cache.query_embedding column...')
    await prisma.$executeRaw`
      ALTER TABLE semantic_cache 
      ALTER COLUMN query_embedding TYPE vector(1536) 
      USING query_embedding::vector(1536)
    `
    console.log('✅ Updated semantic_cache.query_embedding')
    
    console.log('✅ All vector columns updated successfully!')
    
  } catch (error) {
    console.error('❌ Error updating vector columns:', error.message)
    
    // If the error is about invalid vector format, we need to clear the data first
    if (error.message.includes('invalid input syntax for type vector')) {
      console.log('🧹 Clearing existing embedding data and retrying...')
      
      try {
        // Clear embedding data
        await prisma.$executeRaw`UPDATE user_knowledge_base SET embedding = NULL`
        await prisma.$executeRaw`UPDATE semantic_cache SET query_embedding = NULL`
        
        // Now update the column types
        await prisma.$executeRaw`
          ALTER TABLE user_knowledge_base 
          ALTER COLUMN embedding TYPE vector(1536)
        `
        await prisma.$executeRaw`
          ALTER TABLE semantic_cache 
          ALTER COLUMN query_embedding TYPE vector(1536)
        `
        
        console.log('✅ Vector columns updated successfully after clearing data!')
      } catch (retryError) {
        console.error('❌ Error on retry:', retryError.message)
      }
    }
  } finally {
    await prisma.$disconnect()
  }
}

updateVectorColumns()
