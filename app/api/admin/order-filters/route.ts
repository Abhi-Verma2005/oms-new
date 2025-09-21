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

    const filters = await prisma.orderFilter.findMany({
      where: {
        OR: [
          { userId: session.user.id },
          { isPublic: true }
        ]
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({ filters })
  } catch (error) {
    console.error('Error fetching order filters:', error)
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
    const { name, filters, isPublic = false } = body

    if (!name || !filters) {
      return NextResponse.json({ error: 'Name and filters are required' }, { status: 400 })
    }

    // Check if filter name already exists for this user
    const existingFilter = await prisma.orderFilter.findFirst({
      where: {
        userId: session.user.id,
        name
      }
    })

    if (existingFilter) {
      return NextResponse.json({ error: 'Filter name already exists' }, { status: 400 })
    }

    const orderFilter = await prisma.orderFilter.create({
      data: {
        name,
        filters,
        isPublic,
        userId: session.user.id
      }
    })

    return NextResponse.json({ filter: orderFilter })
  } catch (error) {
    console.error('Error creating order filter:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
