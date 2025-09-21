import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

type BulkMapBody = {
  reviewIds: string[]
  productIds?: string[]
  tagIds?: string[]
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as BulkMapBody
    const { reviewIds, productIds = [], tagIds = [] } = body

    if (!Array.isArray(reviewIds) || reviewIds.length === 0) {
      return NextResponse.json({ error: 'reviewIds are required' }, { status: 400 })
    }

    // Fetch all reviews once
    const reviews = await prisma.review.findMany({
      where: { id: { in: reviewIds } },
      include: {
        reviewTags: true,
      },
    })

    // Link reviews to products using ReviewProduct without duplicating reviews
    const productOps: Promise<any>[] = []
    if (productIds.length > 0) {
      for (const reviewId of reviewIds) {
        for (const productId of productIds) {
          productOps.push(
            prisma.reviewProduct.upsert({
              where: { reviewId_productId: { reviewId, productId } },
              create: { reviewId, productId },
              update: {},
            })
          )
        }
      }
    }

    // Assign tags to existing reviews (additive)
    const tagOps: Promise<any>[] = []
    if (tagIds.length > 0) {
      for (const reviewId of reviewIds) {
        for (const tagId of tagIds) {
          tagOps.push(
            prisma.reviewTag.upsert({
              where: { reviewId_tagId: { reviewId, tagId } },
              create: { reviewId, tagId },
              update: {},
            })
          )
        }
      }
    }

    await Promise.all([...productOps, ...tagOps])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error bulk mapping reviews:', error)
    return NextResponse.json({ error: 'Failed to map reviews' }, { status: 500 })
  }
}


