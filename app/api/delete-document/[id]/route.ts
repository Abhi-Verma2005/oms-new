import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ragSystem } from '@/lib/rag-minimal'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
        id,
        user_id: userId
      }
    })

    if (!document) {
      return NextResponse.json({ 
        error: 'Document not found or unauthorized' 
      }, { status: 404 })
    }

    // Delete from Pinecone
    await ragSystem.deleteUserDocument(id, userId)

    // Delete CSV rows from database (if any)
    // Note: Cascade would work on hard delete, but we use soft delete
    try {
      // Use dynamic access in case Prisma client needs regeneration
      const csvRowModel = (prisma as any).csv_row
      if (csvRowModel && typeof csvRowModel.deleteMany === 'function') {
        const deletedRows = await csvRowModel.deleteMany({
          where: { document_id: id }
        })
        if (deletedRows && deletedRows.count > 0) {
          console.log(`🗑️ Deleted ${deletedRows.count} CSV rows for document ${id}`)
        }
      }
    } catch (csvDeleteError) {
      // CSV rows might not exist for this document type, or model not available
      // This is not critical - document will still be deleted
      console.warn(`⚠️ Could not delete CSV rows for document ${id}:`, csvDeleteError instanceof Error ? csvDeleteError.message : 'Unknown error')
      // Continue with deletion - this is not critical
    }

    // Soft delete from database
    await prisma.user_documents.update({
      where: { id },
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
