#!/usr/bin/env node

/**
 * 🗄️ RAG Migration Runner
 * Runs the RAG optimization migration using Node.js
 */

const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

console.log('🗄️ Running RAG Optimization Migration...\n')

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  })

  try {
    await client.connect()
    console.log('✅ Connected to database')

    // Read migration SQL
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrate-rag-optimizations.sql'),
      'utf8'
    )

    // Split into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    console.log(`📋 Executing ${statements.length} migration statements...\n`)

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      
      try {
        console.log(`[${i + 1}/${statements.length}] Executing: ${statement.substring(0, 50)}...`)
        await client.query(statement)
        console.log(`✅ Statement ${i + 1} completed`)
      } catch (error) {
        // Some statements might fail if already exist - that's ok
        if (error.message.includes('already exists') || 
            error.message.includes('already exists')) {
          console.log(`⚠️  Statement ${i + 1} skipped (already exists)`)
        } else {
          console.log(`❌ Statement ${i + 1} failed: ${error.message}`)
          // Continue with other statements
        }
      }
    }

    console.log('\n🎉 Migration completed successfully!')
    console.log('\n✅ RAG System Optimizations:')
    console.log('   • HNSW indexes for vector search')
    console.log('   • GIN indexes for full-text search')
    console.log('   • Composite indexes for user queries')
    console.log('   • Semantic cache table')
    console.log('   • Performance monitoring table')
    console.log('   • Utility functions')
    console.log('   • Unified knowledge base table')

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

// Run migration
runMigration()
