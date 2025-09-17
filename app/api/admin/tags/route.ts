import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tags = await prisma.tag.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            userTags: true,
            productTags: true,
            bonusRules: true
          }
        }
      }
    })

    return NextResponse.json({ tags })
  } catch (error: any) {
    console.error('Error fetching tags:', error)
    if (error?.code === 'P1001') {
      return NextResponse.json({ tags: [], warning: 'Database unreachable' })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, color, description } = body

    if (!name || !color) {
      return NextResponse.json({ error: 'Name and color are required' }, { status: 400 })
    }

    // Check if tag name already exists
    const existingTag = await prisma.tag.findUnique({
      where: { name }
    })

    if (existingTag) {
      return NextResponse.json({ error: 'Tag name already exists' }, { status: 400 })
    }

    const tag = await prisma.tag.create({
      data: {
        name,
        color,
        description,
        createdBy: session.user.id
      }
    })

    return NextResponse.json({ tag })
  } catch (error) {
    console.error('Error creating tag:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
