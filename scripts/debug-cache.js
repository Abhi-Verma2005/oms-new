#!/usr/bin/env node

/**
 * 🔍 Debug Cache Issues
 * Check what's in the semantic cache and why cache misses are happening
 */

const { PrismaClient } = require('@prisma/client')
const crypto = require('crypto')

console.log('🔍 Debugging Cache Issues...\n')

const prisma = new PrismaClient()

async function debugCache() {
  try {
    console.log('🔍 Checking semantic cache table...')
    
    // Check all cache entries
    const allCacheEntries = await prisma.$queryRaw`
      SELECT 
        id,
        user_id,
        query_hash,
        hit_count,
        created_at,
        expires_at,
        last_hit
      FROM semantic_cache
      ORDER BY created_at DESC
      LIMIT 10
    `
    
    console.log(`📊 Total cache entries: ${allCacheEntries.length}`)
    
    if (allCacheEntries.length > 0) {
      console.log('\n📝 Recent cache entries:')
      allCacheEntries.forEach((entry, index) => {
        console.log(`  ${index + 1}. User: ${entry.user_id}`)
        console.log(`     Query hash: ${entry.query_hash}`)
        console.log(`     Hit count: ${entry.hit_count}`)
        console.log(`     Created: ${entry.created_at}`)
        console.log(`     Expires: ${entry.expires_at}`)
        console.log(`     Last hit: ${entry.last_hit || 'Never'}`)
        console.log('')
      })
    } else {
      console.log('  ❌ No cache entries found')
    }
    
    // Check users table
    console.log('🔍 Checking users table...')
    const users = await prisma.$queryRaw`
      SELECT id, email, name
      FROM users
      WHERE email LIKE '%test%' OR email LIKE '%example%'
      ORDER BY created_at DESC
      LIMIT 5
    `
    
    console.log(`📊 Test users found: ${users.length}`)
    
    if (users.length > 0) {
      console.log('\n📝 Test users:')
      users.forEach((user, index) => {
        console.log(`  ${index + 1}. ID: ${user.id}`)
        console.log(`     Email: ${user.email}`)
        console.log(`     Name: ${user.name}`)
        console.log('')
      })
    }
    
    // Test query hash generation for "hi"
    const testMessage = 'hi'
    const testQueryHash = crypto.createHash('sha256').update(testMessage).digest('hex')
    console.log(`🔍 Test query hash for "${testMessage}": ${testQueryHash}`)
    
    // Check if this specific query exists in cache
    const specificCacheEntry = await prisma.$queryRaw`
      SELECT 
        id,
        user_id,
        query_hash,
        hit_count,
        created_at,
        expires_at
      FROM semantic_cache
      WHERE query_hash = ${testQueryHash}
      ORDER BY created_at DESC
    `
    
    console.log(`📊 Cache entries for "${testMessage}": ${specificCacheEntry.length}`)
    
    if (specificCacheEntry.length > 0) {
      console.log('\n📝 Cache entries for "hi":')
      specificCacheEntry.forEach((entry, index) => {
        console.log(`  ${index + 1}. User: ${entry.user_id}`)
        console.log(`     Hit count: ${entry.hit_count}`)
        console.log(`     Created: ${entry.created_at}`)
        console.log(`     Expires: ${entry.expires_at}`)
        console.log(`     Expired: ${new Date() > new Date(entry.expires_at) ? 'YES' : 'NO'}`)
      })
    } else {
      console.log('  ❌ No cache entries found for "hi"')
    }
    
    // Check knowledge base entries
    console.log('\n🔍 Checking knowledge base...')
    const knowledgeEntries = await prisma.$queryRaw`
      SELECT 
        id,
        user_id,
        content,
        content_type,
        created_at
      FROM user_knowledge_base
      ORDER BY created_at DESC
      LIMIT 5
    `
    
    console.log(`📊 Knowledge base entries: ${knowledgeEntries.length}`)
    
    if (knowledgeEntries.length > 0) {
      console.log('\n📝 Recent knowledge entries:')
      knowledgeEntries.forEach((entry, index) => {
        console.log(`  ${index + 1}. User: ${entry.user_id}`)
        console.log(`     Content: "${entry.content.substring(0, 50)}..."`)
        console.log(`     Type: ${entry.content_type}`)
        console.log(`     Created: ${entry.created_at}`)
        console.log('')
      })
    } else {
      console.log('  ❌ No knowledge base entries found')
    }
    
  } catch (error) {
    console.error('❌ Error debugging cache:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

debugCache()
