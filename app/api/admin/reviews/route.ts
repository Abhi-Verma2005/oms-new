import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const tagId = searchParams.get('tagId')
    const isApproved = searchParams.get('isApproved')
    const search = searchParams.get('search')
    const stars = searchParams.get('stars')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Build where clause for filtering
    const where: any = {}
    
    if (productId) {
      where.reviewProducts = { some: { productId } }
    }
    
    if (isApproved !== null) {
      where.isApproved = isApproved === 'true'
    }
    
    if (search) {
      where.OR = [
        { authorName: { contains: search, mode: 'insensitive' } },
        { bodyMarkdown: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (stars) {
      const starRatings = stars.split(',').map(s => parseInt(s.trim())).filter(s => !isNaN(s) && s >= 1 && s <= 5)
      if (starRatings.length > 0) {
        where.rating = { in: starRatings }
      }
    }

    // If filtering by tag, we need to join with ReviewTag
    if (tagId) {
      where.reviewTags = {
        some: {
          tagId: tagId
        }
      }
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          reviewProducts: {
            include: {
              product: {
                select: { id: true, slug: true, header: true }
              }
            }
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
        skip,
        take: limit
      }),
      prisma.review.count({ where })
    ])

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json({ error: 'Failed to load reviews' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      authorName,
      rating,
      bodyMarkdown,
      isApproved = true,
      displayOrder = 0,
      tagIds = [],
      productIds = []
    } = body

    // Validate required fields
    if (!authorName || !rating || !bodyMarkdown) {
      return NextResponse.json(
        { error: 'Author name, rating, and body are required' },
        { status: 400 }
      )
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    const review = await prisma.review.create({
      data: {
        authorName,
        rating,
        bodyMarkdown,
        isApproved,
        displayOrder,
        reviewTags: {
          create: tagIds.map((tagId: string) => ({
            tag: { connect: { id: tagId } }
          }))
        },
        reviewProducts: {
          create: (Array.isArray(productIds) ? productIds : []).map((productId: string) => ({ product: { connect: { id: productId } } }))
        }
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
        },
        reviewProducts: {
          include: {
            product: { select: { id: true, slug: true, header: true } }
          }
        }
      }
    })

    return NextResponse.json({ review })
  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 })
  }
}