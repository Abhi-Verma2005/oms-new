import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '5')

    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: {
            productTags: true
          }
        }
      },
      orderBy: {
        productTags: {
          _count: 'desc'
        }
      },
      take: limit
    })

    return NextResponse.json({ tags })
  } catch (error) {
    console.error('Error fetching top tags:', error)
    return NextResponse.json({ error: 'Failed to fetch top tags' }, { status: 500 })
  }
}
