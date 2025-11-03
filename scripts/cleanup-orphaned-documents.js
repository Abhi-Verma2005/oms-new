#!/usr/bin/env node

/**
 * Cleanup Orphaned Documents
 * 
 * This script finds and cleans up:
 * 1. Soft-deleted documents (is_active = false) older than 30 days
 * 2. Failed documents older than 7 days
 * 3. Processing documents stuck for over 1 hour
 * 4. Document chunks in database without matching Pinecone vectors
 * 5. Pinecone vectors without matching database records
 */

const { PrismaClient } = require('@prisma/client')
const { Pinecone } = require('@pinecone-database/pinecone')
require('dotenv').config({ path: '.env.local' })

const prisma = new PrismaClient()

// Initialize Pinecone
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || 'test-key'
})

let pineconeIndex = null

async function initializePinecone() {
  try {
    const indexName = 'oms-knowledge-base'
    pineconeIndex = pinecone.index(indexName)
    console.log('✅ Connected to Pinecone')
    return true
  } catch (error) {
    console.error('❌ Failed to initialize Pinecone:', error)
    return false
  }
}

async function cleanupOrphanedDocuments() {
  console.log('🧹 Starting orphaned documents cleanup...\n')
  
  try {
    // 1. Clean up soft-deleted documents older than 30 days
    console.log('1️⃣ Checking for soft-deleted documents...')
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const softDeleted = await prisma.user_documents.findMany({
      where: {
        is_active: false,
        uploaded_at: {
          lt: thirtyDaysAgo
        }
      }
    })
    
    if (softDeleted.length > 0) {
      console.log(`   Found ${softDeleted.length} soft-deleted documents older than 30 days`)
      
      // Delete from Pinecone first
      if (pineconeIndex) {
        for (const doc of softDeleted) {
          await deleteFromPinecone(doc.id, doc.user_id)
        }
      }
      
      // Delete chunk metadata (explicit deletion for clarity)
      await prisma.document_chunk_metadata.deleteMany({
        where: {
          document_id: { in: softDeleted.map(d => d.id) }
        }
      })
      
      // Delete CSV rows (explicit deletion - cascade would work but being explicit)
      const deletedCSVRows = await prisma.csv_row.deleteMany({
        where: {
          document_id: { in: softDeleted.map(d => d.id) }
        }
      })
      if (deletedCSVRows.count > 0) {
        console.log(`   🗑️  Deleted ${deletedCSVRows.count} CSV rows`)
      }
      
      // Delete the documents (will cascade to related records)
      const deleted = await prisma.user_documents.deleteMany({
        where: {
          id: { in: softDeleted.map(d => d.id) }
        }
      })
      
      console.log(`   ✅ Deleted ${deleted.count} soft-deleted documents`)
    } else {
      console.log('   ℹ️  No soft-deleted documents to clean up')
    }
    
    // 2. Clean up failed documents older than 7 days
    console.log('\n2️⃣ Checking for failed documents...')
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const failedDocs = await prisma.user_documents.findMany({
      where: {
        processing_status: 'failed',
        uploaded_at: {
          lt: sevenDaysAgo
        }
      }
    })
    
    if (failedDocs.length > 0) {
      console.log(`   Found ${failedDocs.length} failed documents older than 7 days`)
      
      // Delete CSV rows for failed documents
      const deletedCSVRows = await prisma.csv_row.deleteMany({
        where: {
          document_id: { in: failedDocs.map(d => d.id) }
        }
      })
      if (deletedCSVRows.count > 0) {
        console.log(`   🗑️  Deleted ${deletedCSVRows.count} CSV rows`)
      }
      
      // Delete chunk metadata
      await prisma.document_chunk_metadata.deleteMany({
        where: {
          document_id: { in: failedDocs.map(d => d.id) }
        }
      })
      
      const deleted = await prisma.user_documents.deleteMany({
        where: {
          id: { in: failedDocs.map(d => d.id) }
        }
      })
      
      console.log(`   ✅ Deleted ${deleted.count} failed documents`)
    } else {
      console.log('   ℹ️  No failed documents to clean up')
    }
    
    // 3. Clean up stuck processing documents (older than 1 hour)
    console.log('\n3️⃣ Checking for stuck processing documents...')
    const oneHourAgo = new Date()
    oneHourAgo.setHours(oneHourAgo.getHours() - 1)
    
    const stuckDocs = await prisma.user_documents.findMany({
      where: {
        processing_status: 'processing',
        uploaded_at: {
          lt: oneHourAgo
        }
      }
    })
    
    if (stuckDocs.length > 0) {
      console.log(`   Found ${stuckDocs.length} stuck processing documents`)
      
      // Update them to failed status
      const updated = await prisma.user_documents.updateMany({
        where: {
          id: { in: stuckDocs.map(d => d.id) }
        },
        data: {
          processing_status: 'failed',
          error_message: 'Processing timeout - stuck for over 1 hour'
        }
      })
      
      console.log(`   ✅ Marked ${updated.count} documents as failed`)
    } else {
      console.log('   ℹ️  No stuck processing documents found')
    }
    
    // 4. Clean up orphaned chunk metadata and CSV rows without corresponding documents
    console.log('\n4️⃣ Checking for orphaned chunk metadata and CSV rows...')
    const allDocIds = await prisma.user_documents.findMany({
      select: { id: true }
    })
    const validDocIds = new Set(allDocIds.map(d => d.id))
    
    const orphanedChunks = await prisma.document_chunk_metadata.findMany({
      where: {
        document_id: {
          notIn: Array.from(validDocIds)
        }
      }
    })
    
    if (orphanedChunks.length > 0) {
      console.log(`   Found ${orphanedChunks.length} orphaned chunk metadata records`)
      
      const deleted = await prisma.document_chunk_metadata.deleteMany({
        where: {
          id: { in: orphanedChunks.map(c => c.id) }
        }
      })
      
      console.log(`   ✅ Deleted ${deleted.count} orphaned chunks`)
    } else {
      console.log('   ℹ️  No orphaned chunk metadata found')
    }
    
    // Check for orphaned CSV rows
    const orphanedCSVRows = await prisma.csv_row.findMany({
      where: {
        document_id: {
          notIn: Array.from(validDocIds)
        }
      }
    })
    
    if (orphanedCSVRows.length > 0) {
      console.log(`   Found ${orphanedCSVRows.length} orphaned CSV rows`)
      
      const deleted = await prisma.csv_row.deleteMany({
        where: {
          id: { in: orphanedCSVRows.map(r => r.id) }
        }
      })
      
      console.log(`   ✅ Deleted ${deleted.count} orphaned CSV rows`)
    } else {
      console.log('   ℹ️  No orphaned CSV rows found')
    }
    
    // 5. Check for Pinecone vectors without database records
    if (pineconeIndex) {
      console.log('\n5️⃣ Checking for orphaned Pinecone vectors...')
      
      // Get all unique user IDs
      const allUsers = await prisma.user_documents.findMany({
        select: { user_id: true },
        distinct: ['user_id']
      })
      
      let totalOrphaned = 0
      
      for (const user of allUsers) {
        const userDocs = await prisma.user_documents.findMany({
          where: { user_id: user.user_id },
          select: { id: true }
        })
        const userDocIds = new Set(userDocs.map(d => d.id))
        
        // Query Pinecone for all vectors in this user's namespace
        const namespace = `documents_${user.user_id}`
        const results = await pineconeIndex.namespace(namespace).query({
          vector: new Array(1536).fill(0),
          topK: 10000,
          includeMetadata: true
        })
        
        const orphanedIds = []
        for (const match of results.matches || []) {
          const docId = match.metadata?.documentId
          if (docId && !userDocIds.has(docId)) {
            orphanedIds.push(match.id)
          }
        }
        
        if (orphanedIds.length > 0) {
          console.log(`   Found ${orphanedIds.length} orphaned vectors for user ${user.user_id}`)
          
          await pineconeIndex.namespace(namespace).deleteMany(orphanedIds)
          console.log(`   ✅ Deleted ${orphanedIds.length} orphaned Pinecone vectors`)
          totalOrphaned += orphanedIds.length
        }
      }
      
      if (totalOrphaned === 0) {
        console.log('   ℹ️  No orphaned Pinecone vectors found')
      }
    }
    
    console.log('\n✅ Cleanup completed successfully!')
    
  } catch (error) {
    console.error('\n❌ Cleanup failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

async function deleteFromPinecone(documentId, userId) {
  try {
    const namespace = `documents_${userId}`
    
    const results = await pineconeIndex.namespace(namespace).query({
      vector: new Array(1536).fill(0),
      filter: { documentId: { $eq: documentId } },
      topK: 10000,
      includeMetadata: true
    })
    
    const chunkIds = results.matches?.map(m => m.id) || []
    
    if (chunkIds.length > 0) {
      await pineconeIndex.namespace(namespace).deleteMany(chunkIds)
    }
  } catch (error) {
    console.error(`   ⚠️  Failed to delete from Pinecone for doc ${documentId}:`, error.message)
  }
}

// Run cleanup
async function main() {
  const hasPinecone = await initializePinecone()
  
  if (!hasPinecone) {
    console.log('⚠️  Warning: Pinecone connection failed. Will skip Pinecone cleanup.')
  }
  
  await cleanupOrphanedDocuments()
}

main().catch(console.error)

