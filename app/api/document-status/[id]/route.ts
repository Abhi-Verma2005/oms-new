import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const document = await prisma.user_documents.findUnique({
      where: { id },
      select: {
        id: true,
        original_name: true,
        processing_status: true,
        chunk_count: true,
        error_message: true,
        uploaded_at: true,
        content_summary: true
      }
    })

    if (!document) {
      return NextResponse.json({ 
        error: 'Document not found' 
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      document
    })

  } catch (error) {
    console.error('Status check error:', error)
    return NextResponse.json({ 
      error: 'Failed to get document status' 
    }, { status: 500 })
  }
}
