import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ragSystem } from '@/lib/rag-minimal'
import { fileProcessor } from '@/lib/file-processor'
import { getNamespace } from '@/lib/rag-namespace'
import crypto from 'crypto'

// File validation
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  'text/plain',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/csv',
  'application/json',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel'
]

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string
    
    // Validation
    if (!file || !userId) {
      return NextResponse.json({ 
        error: 'File and userId are required' 
      }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB` 
      }, { status: 400 })
    }

    // More flexible file type validation
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    const allowedExtensions = ['txt', 'pdf', 'docx', 'doc', 'csv', 'json', 'xlsx', 'xls']
    
    if (!ALLOWED_TYPES.includes(file.type) && !allowedExtensions.includes(fileExtension || '')) {
      return NextResponse.json({ 
        error: 'Unsupported file type. Supported: TXT, PDF, DOCX, DOC, CSV, JSON, XLSX, XLS' 
      }, { status: 400 })
    }

    // Generate file hash for duplicate detection
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex')

    // Check for duplicate
    const existingDoc = await prisma.user_documents.findFirst({
      where: {
        user_id: userId,
        file_hash: fileHash,
        is_active: true
      }
    })

    if (existingDoc) {
      return NextResponse.json({ 
        error: 'This file has already been uploaded',
        document: {
          id: existingDoc.id,
          original_name: existingDoc.original_name
        }
      }, { status: 409 })
    }

    // 1. Upload to external storage
    const uploadFormData = new FormData()
    uploadFormData.append('file_name', new Blob([fileBuffer]), file.name)
    
    const uploadResponse = await fetch('https://da.outreachdeal.com/upload.php', {
      method: 'POST',
      body: uploadFormData
    })
    
    if (!uploadResponse.ok) {
      throw new Error('External upload failed')
    }
    
    const uploadResult = await uploadResponse.json()
    
    if (!uploadResult.success) {
      throw new Error(uploadResult.error || 'External upload failed')
    }

    // 2. Create database record immediately
    const documentId = `doc_${userId}_${Date.now()}`
    const namespace = getNamespace('documents', userId)
    
    // For testing: Create user if doesn't exist
    try {
      await prisma.user.upsert({
        where: { id: userId },
        update: {},
        create: {
          id: userId,
          email: `${userId}@test.com`,
          name: 'Test User',
          emailVerified: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
    } catch (error) {
      console.log('User creation skipped:', error instanceof Error ? error.message : 'Unknown error')
    }
    
    const document = await prisma.user_documents.create({
      data: {
        id: documentId,
        user_id: userId,
        original_name: file.name,
        file_name: uploadResult.file_name,
        file_url: uploadResult.url,
        file_size: file.size,
        mime_type: file.type,
        content_summary: '', // Will be updated after processing
        processing_status: 'processing',
        file_hash: fileHash,
        pinecone_namespace: namespace,
        uploaded_at: new Date(),
        is_active: true
      }
    })

    // 3. Process asynchronously (don't block response)
    processDocumentAsync(documentId, file, userId, namespace)

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        original_name: document.original_name,
        status: 'processing',
        message: 'Document uploaded and processing started'
      }
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ 
      error: 'Upload failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

// FIXED: Complete async processing with actual content
async function processDocumentAsync(
  documentId: string,
  file: File,
  userId: string,
  namespace: string
) {
  try {
    console.log(`🔄 Processing document ${documentId}...`)
    
    // 1. Extract content
    const extractionResult = await fileProcessor.extractContent(file)
    
    if (!extractionResult.success) {
      console.log(`⚠️ Content extraction failed: ${extractionResult.error}`)
      console.log(`📄 Attempting to process document anyway with empty content...`)
      
      // Continue processing with empty content instead of failing
      const content = ''
      const contentSummary = 'Content extraction failed - document uploaded but not processed'
      
      // Update document status to failed but don't throw error
      await prisma.user_documents.update({
        where: { id: documentId },
        data: {
          content_summary: contentSummary,
          processing_status: 'failed',
          error_message: extractionResult.error || 'Content extraction failed'
        }
      })
      
      console.log(`❌ Document ${documentId} processing failed: ${extractionResult.error}`)
      return
    }

    const content = extractionResult.content
    console.log(`✅ Extracted ${content.length} characters`)
    
    // 2. Generate content summary (first 200 chars)
    const contentSummary = content.substring(0, 200) + (content.length > 200 ? '...' : '')
    
    // 3. Add to RAG system with chunking and metadata
    const result = await ragSystem.addDocumentWithChunking(
      content,
      {
        documentId,
        filename: file.name,
        type: file.type,
        size: file.size,
        csvMetadata: extractionResult.metadata?.csvMetadata, // Pass CSV metadata
        xlsxMetadata: extractionResult.metadata?.xlsxMetadata // Pass XLSX metadata
      },
      userId
    )

    if (!result.success) {
      throw new Error(result.error || 'Failed to add to RAG system')
    }

    // 4. FIXED: Store ONLY chunk metadata (no text duplication)
    if (result.chunks.length > 0) {
      await prisma.document_chunk_metadata.createMany({
        data: result.chunks.map((chunk, i) => ({
          id: `${documentId}_chunk_${i}`,
          document_id: documentId,
          user_id: userId,
          chunk_index: i,
          token_count: Math.ceil(chunk.text.length / 4), // Rough estimate
          pinecone_id: `${documentId}_chunk_${i}`
        }))
      })
    }

    // 5. Update document status
    await prisma.user_documents.update({
      where: { id: documentId },
      data: {
        content_summary: contentSummary,
        processing_status: 'completed',
        chunk_count: result.chunks.length,
        error_message: null
      }
    })
    
    console.log(`✅ Document ${documentId} processed: ${result.chunks.length} chunks`)

  } catch (error) {
    console.error(`❌ Processing failed for ${documentId}:`, error)
    await prisma.user_documents.update({
      where: { id: documentId },
      data: { 
        processing_status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown processing error'
      }
    })
  }
}