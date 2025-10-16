#!/usr/bin/env node

/**
 * Check if pgvector extension is available
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkVectorExtension() {
  try {
    console.log('🔍 Checking pgvector extension...')
    
    // Check if vector extension is available
    const extensions = await prisma.$queryRaw`
      SELECT extname FROM pg_extension WHERE extname LIKE '%vector%'
    `
    
    console.log('📊 Available vector extensions:', extensions)
    
    // Check vector data type
    const vectorType = await prisma.$queryRaw`
      SELECT typname FROM pg_type WHERE typname = 'vector'
    `
    
    console.log('📊 Vector data type available:', vectorType.length > 0)
    
    if (vectorType.length > 0) {
      // Check vector dimensions
      const dimensions = await prisma.$queryRaw`
        SELECT typname, typlen FROM pg_type WHERE typname = 'vector'
      `
      console.log('📊 Vector type info:', dimensions)
    }
    
  } catch (error) {
    console.error('❌ Error checking vector extension:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkVectorExtension()
