import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 Clear chat history request received')
    
    // Get user session
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id || 'anonymous'
    
    console.log(`👤 Clearing chat history for user: ${userId}`)
    
    // Clear chat history from localStorage (handled by frontend)
    // We don't need to clear anything from the database since:
    // 1. Knowledge base (user_knowledge_base) should be preserved
    // 2. Chat messages are stored in localStorage, not database
    // 3. Semantic cache can be preserved for performance
    
    // Optional: Clear semantic cache if desired (commented out to preserve performance)
    // await prisma.semanticCache.deleteMany({
    //   where: { userId }
    // })
    
    console.log('✅ Chat history clear request processed (knowledge base preserved)')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Chat history cleared while preserving your personal data',
      userId 
    })
    
  } catch (error) {
    console.error('❌ Error clearing chat history:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to clear chat history',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
