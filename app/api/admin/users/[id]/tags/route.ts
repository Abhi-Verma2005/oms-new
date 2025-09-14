import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { tagId, notes, expiresAt } = body

    if (!tagId) {
      return NextResponse.json({ error: 'Tag ID is required' }, { status: 400 })
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if tag exists
    const tag = await prisma.tag.findUnique({
      where: { id: tagId }
    })

    if (!tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
    }

    // Check if tag is already assigned to this user
    const existingUserTag = await prisma.userTag.findUnique({
      where: {
        userId_tagId: {
          userId: id,
          tagId: tagId
        }
      }
    })

    if (existingUserTag) {
      return NextResponse.json({ error: 'Tag is already assigned to this user' }, { status: 400 })
    }

    const userTag = await prisma.userTag.create({
      data: {
        userId: id,
        tagId: tagId,
        assignedBy: session.user.id,
        notes: notes || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      },
      include: {
        tag: true
      }
    })

    return NextResponse.json({ userTag })
  } catch (error) {
    console.error('Error adding tag to user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
