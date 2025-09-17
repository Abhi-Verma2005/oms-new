import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const tagId = searchParams.get('tagId')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: any = {
      isActive: true
    }

    if (search) {
      where.OR = [
        { header: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (tagId) {
      where.productTags = {
        some: {
          tagId: tagId
        }
      }
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        productTags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                color: true
              }
            }
          }
        }
      },
      orderBy: [
        { sortOrder: 'asc' },
        { header: 'asc' }
      ],
      take: limit
    })

    return NextResponse.json({ products })
  } catch (error) {
    console.error('Error searching products:', error)
    return NextResponse.json({ error: 'Failed to search products' }, { status: 500 })
  }
}
