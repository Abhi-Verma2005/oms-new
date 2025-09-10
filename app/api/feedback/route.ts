import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!prisma || !(prisma as any).feedback) return NextResponse.json([])
  const items = await prisma?.feedback.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: 'desc' } })
  return NextResponse.json(items || [])
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { rating, comment, category, metadata } = await req.json()
  if (typeof rating !== 'number' || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Invalid rating' }, { status: 400 })
  }
  if (!prisma) return NextResponse.json({ error: 'Database not available' }, { status: 500 })
  try {
    const created = await (prisma as any).feedback.create({
      data: {
        userId: session.user.id,
        rating,
        comment: comment || null,
        category: category || null,
        metadata: metadata || undefined,
      }
    })
    return NextResponse.json(created)
  } catch (error) {
    console.error('Feedback creation error:', error)
    return NextResponse.json({ error: 'Failed to create feedback' }, { status: 500 })
  }
}


