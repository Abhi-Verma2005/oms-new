#!/usr/bin/env node

/**
 * 🧪 Check User Facts
 * Check if user_fact entries exist in the database
 */

console.log('🧪 Checking User Facts in Database...\n')

async function checkUserFacts() {
  try {
    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()
    
    console.log('📊 Checking all user_fact entries...')
    
    try {
      const userFacts = await prisma.$queryRaw`
        SELECT id, content, content_type, created_at, user_id
        FROM user_knowledge_base 
        WHERE content_type = 'user_fact'
        ORDER BY created_at DESC
        LIMIT 20
      `
      
      console.log(`📊 Found ${userFacts.length} user_fact entries:`)
      if (userFacts.length === 0) {
        console.log('❌ NO USER_FACT ENTRIES FOUND!')
        console.log('🔍 This explains why RAG retrieval is not working')
        console.log('🔍 Only conversation entries are being stored')
      } else {
        userFacts.forEach((entry, index) => {
          console.log(`  ${index + 1}. "${entry.content.substring(0, 80)}..."`)
          console.log(`     Created: ${entry.created_at}`)
          console.log(`     User ID: ${entry.user_id}`)
          console.log('')
        })
      }
      
    } catch (dbError) {
      console.log('❌ Database query failed:', dbError.message)
    }
    
    console.log('\n📊 Checking conversation entries...')
    
    try {
      const conversations = await prisma.$queryRaw`
        SELECT id, content, content_type, created_at, user_id
        FROM user_knowledge_base 
        WHERE content_type = 'conversation'
        ORDER BY created_at DESC
        LIMIT 10
      `
      
      console.log(`📊 Found ${conversations.length} conversation entries`)
      
    } catch (dbError) {
      console.log('❌ Database query failed:', dbError.message)
    } finally {
      await prisma.$disconnect()
    }
    
    console.log('\n📊 DIAGNOSIS:')
    console.log('🔍 If no user_fact entries exist:')
    console.log('  - The user_fact storage code is not executing')
    console.log('  - There might be an error in the storage process')
    console.log('  - The async storage might be failing silently')
    console.log('  - The embedding generation might be failing')
    
  } catch (error) {
    console.error('❌ Check user facts error:', error.message)
  }
}

checkUserFacts()
