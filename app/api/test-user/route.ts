import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // Get a test user from the database
    const user = await prisma.user.findFirst({
      select: { id: true, email: true }
    })
    
    if (!user) {
      return NextResponse.json({ error: 'No users found' }, { status: 404 })
    }
    
    return NextResponse.json({ 
      userId: user.id,
      email: user.email 
    })
    
  } catch (error) {
    console.error('Failed to get test user:', error)
    return NextResponse.json(
      { error: 'Failed to get test user' },
      { status: 500 }
    )
  }
}
