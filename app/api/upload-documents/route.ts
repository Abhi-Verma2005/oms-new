import { NextRequest, NextResponse } from 'next/server'
import { extractDocumentContent } from '@/lib/document-extraction'

export const config = {
  api: {
    bodyParser: false, // Disable body parsing for file uploads
  },
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    console.log('📤 Uploading:', file.name, file.type, `${(file.size / 1024).toFixed(2)}KB`)

    // Convert to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Extract content
    const extraction = await extractDocumentContent(
      buffer,
      file.name,
      file.type
    )

    console.log('✅ Extraction:', {
      method: extraction.method,
      success: extraction.success,
      textLength: extraction.text.length,
      preview: extraction.text.substring(0, 100)
    })

    // Return processed file data
    return NextResponse.json({
      id: crypto.randomUUID(),
      name: file.name,
      type: file.type,
      size: file.size,
      extractedText: extraction.text,
      metadata: extraction.metadata,
      success: extraction.success,
      method: extraction.method,
      uploadedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
