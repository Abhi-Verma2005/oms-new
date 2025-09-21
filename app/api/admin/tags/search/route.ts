import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const limit = parseInt(searchParams.get('limit') || '10')

    const tags = await prisma.tag.findMany({
      where: {
        name: {
          contains: search,
          mode: 'insensitive'
        }
      },
      include: {
        _count: {
          select: {
            productTags: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      },
      take: limit
    })

    return NextResponse.json({ tags })
  } catch (error) {
    console.error('Error searching tags:', error)
    return NextResponse.json({ error: 'Failed to search tags' }, { status: 500 })
  }
}
