# Document Deletion & Cleanup Flow

## Overview

This document describes the complete flow for deleting user-uploaded documents and cleaning up orphaned data in the system.

## Architecture

Documents are stored in three places:
1. **Database** (`user_documents` table) - Document metadata
2. **Database** (`document_chunk_metadata` table) - Chunk metadata
3. **Pinecone** - Vector embeddings for RAG search

## Current Deletion Flow

### 1. User-Initiated Deletion (Manual)

**UI Location:** AI Chatbot Sidebar → "Add Context" → Document List

**What happens:**
1. User clicks trash icon (🗑️) next to any document
2. Confirmation dialog: "Are you sure you want to delete this document?"
3. If confirmed:
   - `DELETE /api/delete-document/[id]?userId=...` is called
   - Document deleted from Pinecone vectors
   - Document soft-deleted in database (`is_active: false`)
   - Chunk metadata deleted via cascade

**Backend API:** `app/api/delete-document/[id]/route.ts`

```typescript
// Flow:
1. Verify document ownership
2. Delete from Pinecone (all chunks)
3. Soft delete from database
4. Return success
```

**Important:** Uses **soft delete** - document remains in database but marked inactive. This allows for recovery and prevents data loss.

### 2. Automatic Cleanup (Scheduled)

**Script:** `scripts/cleanup-orphaned-documents.js`

**Run Frequency:** Recommended weekly via cron

```bash
# Add to crontab:
0 2 * * 0 cd /path/to/oms && node oms-new/scripts/cleanup-orphaned-documents.js
```

**What it cleans:**

#### A. Soft-Deleted Documents (30+ days old)
- Finds documents where `is_active = false` and `uploaded_at < 30 days ago`
- Deletes all Pinecone vectors for those documents
- Deletes chunk metadata records
- Permanently deletes document records

#### B. Failed Documents (7+ days old)
- Finds documents with `processing_status = 'failed'` older than 7 days
- Permanently deletes (no soft delete needed)

#### C. Stuck Processing Documents (1+ hour old)
- Finds documents stuck in `processing` status for over 1 hour
- Marks them as `failed` with timeout error message
- Prevents zombie processing states

#### D. Orphaned Chunk Metadata
- Finds `document_chunk_metadata` records without matching documents
- Deletes orphaned chunks

#### E. Orphaned Pinecone Vectors
- Checks each user's Pinecone namespace
- Finds vectors without matching database documents
- Deletes orphaned vectors

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│  USER DELETES DOCUMENT                                   │
│  (AI Chatbot Sidebar)                                    │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  DELETE /api/delete-document/[id]                       │
│  1. Verify ownership                                     │
│  2. Delete Pinecone vectors                             │
│  3. Soft delete (is_active = false)                     │
│  4. Cascade delete chunks                               │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  DOCUMENT STATE                                          │
│  ✓ Pinecone: Deleted                                    │
│  ✓ Database: Soft deleted (is_active = false)           │
│  ✓ Chunks: Deleted                                      │
└─────────────────────────────────────────────────────────┘

                   │
                   ▼ (30 days later)
                   
┌─────────────────────────────────────────────────────────┐
│  CLEANUP SCRIPT RUNS                                     │
│  scripts/cleanup-orphaned-documents.js                   │
│  1. Find soft-deleted 30+ days old                      │
│  2. Perma-delete from all locations                     │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  DOCUMENT COMPLETELY REMOVED                             │
│  ✓ Pinecone: Gone                                       │
│  ✓ Database: Gone                                       │
│  ✓ Chunks: Gone                                         │
└─────────────────────────────────────────────────────────┘
```

## Edge Cases Handled

### 1. Stuck Processing
Documents stuck in `processing` status are automatically marked as `failed` after 1 hour.

### 2. Orphaned Data
Cleanup script removes chunks and vectors without matching documents.

### 3. Failed Uploads
Failed documents are kept for 7 days, then automatically deleted.

### 4. Large Documents
Pinecone deletion handles up to 10,000 chunks per document. For documents with more chunks, may need manual intervention.

### 5. Cascade Deletion
Database schema ensures chunk metadata is automatically deleted when documents are deleted:

```prisma
model document_chunk_metadata {
  document    user_documents @relation(fields: [document_id], references: [id], onDelete: Cascade)
}
```

## UI States

### Document Status Icons
- ✅ **Completed** - Green check, can be selected
- ⏳ **Processing** - Spinning loader, cannot select
- ❌ **Failed** - Red X, cannot select, shows delete button

### Delete Button
- Visible on ALL document types (completed, processing, failed)
- Red trash icon appears on hover
- Confirmation dialog prevents accidental deletion

## Testing the Deletion Flow

### Manual Test
```bash
# 1. Upload a test document via UI
# 2. Wait for processing
# 3. Click delete button
# 4. Verify:
#    - Document removed from UI
#    - Not searchable in RAG
#    - Still in database (soft deleted)
```

### Cleanup Script Test
```bash
# 1. Run cleanup script
cd oms-new
node scripts/cleanup-orphaned-documents.js

# 2. Check output for:
#    - Number of documents cleaned
#    - Pinecone deletions
#    - Orphaned data removal
```

### Database Verification
```sql
-- Check soft-deleted documents
SELECT id, original_name, uploaded_at, is_active 
FROM user_documents 
WHERE is_active = false;

-- Check orphaned chunks
SELECT dc.* FROM document_chunk_metadata dc
LEFT JOIN user_documents ud ON dc.document_id = ud.id
WHERE ud.id IS NULL;
```

## Monitoring

### Key Metrics to Track
1. **Document deletion rate** - How many documents are deleted daily
2. **Cleanup efficiency** - How many orphaned records cleaned per run
3. **Stuck processing rate** - How many documents get stuck
4. **Failed upload rate** - How many uploads fail

### Logs to Monitor
```
# User-initiated deletion
DELETE /api/delete-document/[id] - Success/Failure

# Cleanup script
cleanup-orphaned-documents.js - Cleanup summary

# Pinecone operations
🗑️ Deleting document [id] for user [userId]
✅ Deleted X chunks from Pinecone
```

## Security Considerations

### 1. Ownership Verification
Every deletion verifies `user_id` matches document owner:

```typescript
const document = await prisma.user_documents.findFirst({
  where: { id, user_id: userId }
})
if (!document) return { error: 'Unauthorized' }
```

### 2. Namespace Isolation
Pinecone vectors are deleted only from the user's namespace:

```typescript
const namespace = `documents_${userId}`
await pineconeIndex.namespace(namespace).deleteMany(chunkIds)
```

### 3. Soft Delete Safety
30-day grace period allows recovery of accidentally deleted documents.

## Troubleshooting

### Issue: Document not deleted from Pinecone
**Cause:** More than 10,000 chunks (Pinecone limit)

**Solution:** Increase `topK` in delete query or implement pagination:
```typescript
topK: 10000 // Current limit
```

### Issue: Orphaned chunks remain
**Cause:** Cascade deletion failed

**Solution:** Run cleanup script manually:
```bash
node scripts/cleanup-orphaned-documents.js
```

### Issue: Stuck processing documents
**Cause:** Process crashed during async processing

**Solution:** Script automatically marks as failed after 1 hour

### Issue: Database query timeout
**Cause:** Too many documents to query at once

**Solution:** Add batching to cleanup script:
```typescript
// Process in batches of 100
const batchSize = 100
for (let i = 0; i < documents.length; i += batchSize) {
  const batch = documents.slice(i, i + batchSize)
  // Process batch
}
```

## Future Improvements

### 1. Immediate Hard Delete Option
Add UI toggle: "Delete permanently" vs "Delete with 30-day recovery"

### 2. Pagination for Large Deletions
Implement pagination for documents with 10,000+ chunks

### 3. Bulk Deletion
Allow users to select multiple documents for deletion

### 4. Deletion History
Track deletion history for audit purposes

### 5. Recovery UI
Allow users to restore soft-deleted documents within 30 days

### 6. Automatic Compression
Compress soft-deleted documents to save space

### 7. Progressive Cleanup
Clean up older soft-deleted documents more aggressively (7/15/30 day tiers)

## Summary

**Current State:**
- ✅ Manual deletion via UI with confirmation
- ✅ Soft delete with 30-day recovery period
- ✅ Automatic cleanup of orphaned data
- ✅ Cascade deletion of related records
- ✅ Processing timeout handling
- ✅ Ownership verification

**Recommended Usage:**
- Users: Click delete button in AI sidebar for any document
- Admins: Run cleanup script weekly via cron
- Monitor: Track deletion metrics and stuck processing

This two-tier approach (soft delete + scheduled cleanup) provides a balance between user control and system maintenance while preventing accidental data loss.

