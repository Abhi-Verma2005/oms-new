'use client'

import { useState, useEffect } from 'react'

interface Tag {
  id: string
  name: string
  color: string
}

interface Review {
  id: string
  productId?: string
  authorName: string
  rating: number
  bodyMarkdown: string
  isApproved: boolean
  displayOrder: number
  createdAt: string
  updatedAt: string
  product?: {
    id: string
    slug: string
    header: string
  }
  reviewTags: Array<{
    id: string
    tag: Tag
  }>
}

interface ReviewsDisplayProps {
  productId?: string
  productTags?: string[] // Array of product tag IDs to filter reviews
  maxReviews?: number
  showGlobalReviews?: boolean // Show reviews not tied to specific products
}

export function ReviewsDisplay({ 
  productId, 
  productTags = [], 
  maxReviews = 10, 
  showGlobalReviews = true 
}: ReviewsDisplayProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchReviews()
  }, [productId, productTags])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      setError(null)

      // Build query parameters
      const params = new URLSearchParams({
        maxReviews: maxReviews.toString(),
        showGlobalReviews: showGlobalReviews.toString()
      })

      // If we have a specific product, get reviews for that product
      if (productId) {
        params.append('productId', productId)
      }

      // If we have product tags, pass them to the API
      if (productTags.length > 0) {
        params.append('productTags', productTags.join(','))
      }

      const response = await fetch(`/api/reviews?${params}`)
      const data = await response.json()

      if (response.ok) {
        setReviews(data.reviews)
      } else {
        setError(data.error || 'Failed to load reviews')
      }
    } catch (err) {
      console.error('Error fetching reviews:', err)
      setError('Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))
  }

  const renderMarkdown = (markdown: string) => {
    // Simple markdown rendering for basic formatting
    return markdown
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-sm">$1</code>')
      .replace(/\n/g, '<br />')
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Customer Reviews</h3>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="h-4 w-20 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  <div className="h-4 w-16 bg-gray-300 dark:bg-gray-600 rounded"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={fetchReviews}
          className="mt-2 text-sm text-violet-600 hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300"
        >
          Try again
        </button>
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">No reviews available yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Customer Reviews ({reviews.length})
        </h3>
        {productTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {productTags.map((tagId) => {
              // Find the tag name from the first review that has this tag
              const reviewWithTag = reviews.find(review => 
                review.reviewTags.some(rt => rt.tag.id === tagId)
              )
              const tag = reviewWithTag?.reviewTags.find(rt => rt.tag.id === tagId)?.tag
              
              if (!tag) return null
              
              return (
                <span
                  key={tagId}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                  style={{ backgroundColor: tag.color + '20', color: tag.color }}
                >
                  {tag.name}
                </span>
              )
            })}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="flex items-center">
                  {renderStars(review.rating)}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {review.authorName}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              {review.reviewTags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {review.reviewTags.map((reviewTag) => (
                    <span
                      key={reviewTag.id}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                      style={{ backgroundColor: reviewTag.tag.color + '20', color: reviewTag.tag.color }}
                    >
                      {reviewTag.tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            <div
              className="text-gray-700 dark:text-gray-300 prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ 
                __html: renderMarkdown(review.bodyMarkdown) 
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
