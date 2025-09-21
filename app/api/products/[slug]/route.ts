import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  _request: Request,
  { params }: any
) {
  try {
    const { slug } = params
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        features: { orderBy: { sortOrder: 'asc' } },
        productTags: { include: { tag: true } },
        reviewProducts: {
          where: { review: { isApproved: true } },
          orderBy: { review: { displayOrder: 'asc' } },
          include: {
            review: {
              include: {
                reviewTags: { include: { tag: true } }
              }
            }
          }
        },
      },
    })
    if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ product })
  } catch (e: any) {
    console.error('GET /api/products/[slug] error', e)
    return NextResponse.json({ error: 'Failed to load product' }, { status: 500 })
  }
}


