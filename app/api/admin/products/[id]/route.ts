import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const product = await prisma.product.findUnique({ where: { id }, include: { features: { orderBy: { sortOrder: 'asc' } }, productTags: { include: { tag: true } }, reviews: true } })
    if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ product })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { header, subheader, descriptionMarkdown, pricePerMonthCents, discountPercent, finalPricePerMonthCents, currency, badge, showOnShop2, showOnLinkBuilding, isActive, sortOrder, features = [], tagIds = [] } = body

    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.product.update({
        where: { id },
        data: {
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
        },
      })
      await tx.productFeature.deleteMany({ where: { productId: id } })
      if (features.length) {
        await tx.productFeature.createMany({ data: features.map((f: any, idx: number) => ({ productId: id, title: f.title, value: f.value ?? null, icon: f.icon ?? null, sortOrder: f.sortOrder ?? idx })) })
      }
      await tx.productTag.deleteMany({ where: { productId: id } })
      if (tagIds.length) {
        await tx.productTag.createMany({ data: tagIds.map((tagId: string) => ({ productId: id, tagId })) })
      }
      return p
    })
    return NextResponse.json({ product: updated })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.product.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}


