import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ 
        error: 'userId required' 
      }, { status: 400 })
    }

    // FIXED: Use database query (not Pinecone dummy search)
    const documents = await prisma.user_documents.findMany({
      where: { 
        user_id: userId, 
        is_active: true 
      },
      orderBy: { uploaded_at: 'desc' },
      select: {
        id: true,
        original_name: true,
        file_size: true,
        mime_type: true,
        processing_status: true,
        chunk_count: true,
        uploaded_at: true,
        error_message: true,
        content_summary: true
      }
    })

    return NextResponse.json({
      success: true,
      documents
    })

  } catch (error) {
    console.error('Get documents error:', error)
    return NextResponse.json({ 
      error: 'Failed to get documents' 
    }, { status: 500 })
  }
}
