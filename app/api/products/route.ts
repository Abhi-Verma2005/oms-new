import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const showOnShop2 = searchParams.get('shop2') === '1'
    const showOnLink = searchParams.get('link') === '1'
    const tag = searchParams.get('tag')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10) || 50, 100)

    const where: any = { isActive: true }
    if (showOnShop2) where.showOnShop2 = true
    if (showOnLink) where.showOnLinkBuilding = true
    if (tag) {
      where.productTags = { some: { tag: { name: tag } } }
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      take: limit,
      include: {
        features: { orderBy: { sortOrder: 'asc' } },
        productTags: { include: { tag: true } },
      },
    })

    return NextResponse.json({ products })
  } catch (e: any) {
    console.error('GET /api/products error', e)
    return NextResponse.json({ error: 'Failed to load products' }, { status: 500 })
  }
}


