import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        reviewProducts: {
          include: {
            product: { select: { id: true, slug: true, header: true } }
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
      }
    })

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    return NextResponse.json({ review })
  } catch (error) {
    console.error('Error fetching review:', error)
    return NextResponse.json({ error: 'Failed to load review' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      authorName,
      rating,
      bodyMarkdown,
      isApproved,
      displayOrder,
      tagIds = []
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

    // First, update the review
    const review = await prisma.review.update({
      where: { id },
      data: {
        authorName,
        rating,
        bodyMarkdown,
        isApproved,
        displayOrder
      }
    })

    // Then, update the tags
    // First, remove all existing tags
    await prisma.reviewTag.deleteMany({
      where: { reviewId: id }
    })

    // Then, add the new tags
    if (tagIds.length > 0) {
      await prisma.reviewTag.createMany({
        data: tagIds.map((tagId: string) => ({
          reviewId: id,
          tagId
        }))
      })
    }

    // Fetch the updated review with relations
    const updatedReview = await prisma.review.findUnique({
      where: { id },
      include: {
        reviewProducts: {
          include: {
            product: { select: { id: true, slug: true, header: true } }
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
      }
    })

    return NextResponse.json({ review: updatedReview })
  } catch (error) {
    console.error('Error updating review:', error)
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.review.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting review:', error)
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 })
  }
}