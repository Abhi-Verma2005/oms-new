import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const productTags = searchParams.get('productTags')?.split(',') || []
    const maxReviews = parseInt(searchParams.get('maxReviews') || '10')
    const showGlobalReviews = searchParams.get('showGlobalReviews') !== 'false'

    // Build where clause
    // Important: If productId is present, we should return reviews mapped to that product
    // regardless of tag filters. Tag-based filtering should ONLY apply to global reviews.
    const where: any = {
      isApproved: true
    }

    if (productId) {
      // Linked via ReviewProduct mapping (new schema)
      where.reviewProducts = { some: { productId } }
    } else if (productTags.length > 0) {
      // Only apply tag filter when not fetching for a specific product
      where.reviewTags = {
        some: { tagId: { in: productTags } }
      }
    }

    const reviews = await prisma.review.findMany({
      where,
      include: {
        reviewProducts: {
          include: { product: { select: { id: true, slug: true, header: true } } }
        },
        reviewTags: {
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
        { displayOrder: 'asc' },
        { createdAt: 'desc' }
      ],
      take: maxReviews
    })

    // If we want to show global reviews and we have a product, add them
    let finalReviews = reviews

    if (showGlobalReviews && productId) {
      const globalReviews = await prisma.review.findMany({
        where: {
          // Global reviews have no product mapping, only tags
          reviewProducts: { none: {} },
          isApproved: true,
          ...(productTags.length > 0 && {
            reviewTags: { some: { tagId: { in: productTags } } }
          })
        },
        include: {
          reviewTags: {
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
          { displayOrder: 'asc' },
          { createdAt: 'desc' }
        ],
        take: maxReviews
      })

      // Combine and deduplicate
      const existingIds = new Set(reviews.map(r => r.id))
      const uniqueGlobalReviews = globalReviews.filter(r => !existingIds.has(r.id))
      
      finalReviews = [...reviews, ...uniqueGlobalReviews]
        .sort((a, b) => {
          if (a.displayOrder !== b.displayOrder) {
            return a.displayOrder - b.displayOrder
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
        .slice(0, maxReviews)
    }

    return NextResponse.json({ reviews: finalReviews })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json({ error: 'Failed to load reviews' }, { status: 500 })
  }
}
