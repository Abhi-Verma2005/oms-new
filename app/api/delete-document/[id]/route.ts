import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ragSystem } from '@/lib/rag-minimal'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ 
        error: 'userId required' 
      }, { status: 400 })
    }

    // Verify ownership
    const document = await prisma.user_documents.findFirst({
      where: { 
        id: params.id,
        user_id: userId
      }
    })

    if (!document) {
      return NextResponse.json({ 
        error: 'Document not found or unauthorized' 
      }, { status: 404 })
    }

    // Delete from Pinecone
    await ragSystem.deleteUserDocument(params.id, userId)

    // Soft delete from database
    await prisma.user_documents.update({
      where: { id: params.id },
      data: { is_active: false }
    })

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    })

  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ 
      error: 'Failed to delete document' 
    }, { status: 500 })
  }
}
