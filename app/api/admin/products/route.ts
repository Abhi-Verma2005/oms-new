import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: { 
        features: { orderBy: { sortOrder: 'asc' } }, 
        productTags: { include: { tag: true } }, 
        _count: { select: { reviewProducts: true } }
      },
    })
    return NextResponse.json({ products })
  } catch (e) {
    console.error(e)
    const code = (e as any)?.code
    if (code === 'P1001') {
      // Database unreachable – return empty list so the UI can still load
      return NextResponse.json({ products: [], warning: 'Database unreachable' })
    }
    return NextResponse.json({ error: 'Failed to load products' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { header, subheader, descriptionMarkdown, pricePerMonthCents, discountPercent, finalPricePerMonthCents, currency, badge, showOnShop2, showOnLinkBuilding, isActive, sortOrder, features = [], tagIds = [] } = body

    const product = await prisma.product.create({
      data: {
        slug: body.slug,
        header, subheader, descriptionMarkdown: descriptionMarkdown ?? null,
        pricePerMonthCents: pricePerMonthCents ?? null,
        discountPercent: discountPercent ?? null,
        finalPricePerMonthCents: finalPricePerMonthCents ?? null,
        currency: currency || 'USD',
        badge: badge ?? null,
        showOnShop2: !!showOnShop2,
        showOnLinkBuilding: !!showOnLinkBuilding,
        isActive: isActive !== false,
        sortOrder: sortOrder ?? 0,
        features: { create: features.map((f: any, idx: number) => ({ title: f.title, value: f.value ?? null, icon: f.icon ?? null, sortOrder: f.sortOrder ?? idx })) },
        productTags: { create: tagIds.map((tagId: string) => ({ tag: { connect: { id: tagId } } })) },
      },
      include: { features: true, productTags: { include: { tag: true } } },
    })
    return NextResponse.json({ product })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}


