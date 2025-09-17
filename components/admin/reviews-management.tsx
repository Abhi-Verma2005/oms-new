'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface Tag {
  id: string
  name: string
  color: string
}

interface Product {
  id: string
  slug: string
  header: string
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
  product?: Product
  reviewProducts?: Array<{ product: Product }>
  reviewTags: Array<{
    id: string
    tag: Tag
  }>
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

export function ReviewsManagement() {
  const router = useRouter()
  const [reviews, setReviews] = useState<Review[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    productId: '',
    tagId: '',
    isApproved: ''
  })

  // Add review modal state
  const [showAddReviewModal, setShowAddReviewModal] = useState(false)
  const [newReview, setNewReview] = useState({
    authorName: '',
    rating: 5,
    bodyMarkdown: '',
  })
  const [submitting, setSubmitting] = useState(false)

  // Local toast helper using NotificationContext preview event
  const notify = (title: string, body: string, priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' = 'NORMAL') => {
    if (typeof window === 'undefined') return
    const now = new Date().toISOString()
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2)}`
    const detail = {
      id,
      title,
      body,
      imageUrl: undefined,
      typeId: 'custom',
      isActive: true,
      isGlobal: true,
      targetUserIds: [] as string[],
      priority,
      createdAt: now,
      updatedAt: now,
      type: { id: 'custom', name: 'custom', displayName: 'Notification' },
    }
    window.dispatchEvent(new CustomEvent('preview-notification', { detail }))
  }
  
  // Bulk assignment state
  const [selectedReviews, setSelectedReviews] = useState<string[]>([])
  const [showBulkAssignment, setShowBulkAssignment] = useState(false)
  const [bulkAssignmentType, setBulkAssignmentType] = useState<'product' | 'tags'>('product')
  const [bulkProductId, setBulkProductId] = useState('')
  const [bulkTagIds, setBulkTagIds] = useState<string[]>([])

  useEffect(() => {
    fetchReviews()
    fetchProducts()
    fetchTags()
  }, [pagination.page, filters])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.productId && { productId: filters.productId }),
        ...(filters.tagId && { tagId: filters.tagId }),
        ...(filters.isApproved && { isApproved: filters.isApproved })
      })

      const response = await fetch(`/api/admin/reviews?${params}`)
      const data = await response.json()

      if (response.ok) {
        setReviews(data.reviews)
        setPagination(data.pagination)
      } else {
        console.error('Error fetching reviews:', data.error)
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/admin/products')
      const data = await response.json()
      if (response.ok) {
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/admin/tags')
      const data = await response.json()
      if (response.ok) {
        setTags(data.tags || [])
      }
    } catch (error) {
      console.error('Error fetching tags:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return

    try {
      const response = await fetch(`/api/admin/reviews/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchReviews()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete review')
      }
    } catch (error) {
      console.error('Error deleting review:', error)
      alert('Failed to delete review')
    }
  }

  const handleToggleApproval = async (review: Review) => {
    try {
      const response = await fetch(`/api/admin/reviews/${review.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...review,
          isApproved: !review.isApproved
        })
      })

      if (response.ok) {
        fetchReviews()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to update review')
      }
    } catch (error) {
      console.error('Error updating review:', error)
      alert('Failed to update review')
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      productId: '',
      tagId: '',
      isApproved: ''
    })
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleSelectReview = (reviewId: string) => {
    setSelectedReviews(prev => 
      prev.includes(reviewId) 
        ? prev.filter(id => id !== reviewId)
        : [...prev, reviewId]
    )
  }

  const handleSelectAll = () => {
    if (selectedReviews.length === reviews.length) {
      setSelectedReviews([])
    } else {
      setSelectedReviews(reviews.map(r => r.id))
    }
  }

  const handleAddReview = async (mapAfter: boolean) => {
    if (!newReview.authorName.trim() || !newReview.bodyMarkdown.trim()) {
      notify('Missing information', 'Please fill in all required fields', 'HIGH')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName: newReview.authorName,
          rating: newReview.rating,
          bodyMarkdown: newReview.bodyMarkdown,
          isApproved: true,
          displayOrder: 0,
          tagIds: [],
          productIds: []
        })
      })

      if (response.ok) {
        const data = await response.json()
        const createdId = data?.review?.id as string | undefined
        setShowAddReviewModal(false)
        setNewReview({
          authorName: '',
          rating: 5,
          bodyMarkdown: ''
        })
        notify('Review created', 'Your review has been created successfully.', 'NORMAL')
        if (mapAfter && createdId) {
          router.push(`/admin/reviews/mapping?sel=${encodeURIComponent(createdId)}`)
        } else {
          fetchReviews()
        }
      } else {
        const error = await response.json()
        notify('Failed to create review', error.error || 'Unknown error', 'HIGH')
      }
    } catch (error) {
      console.error('Error creating review:', error)
      notify('Failed to create review', 'An unexpected error occurred.', 'HIGH')
    } finally {
      setSubmitting(false)
    }
  }

  const handleBulkAssignment = async () => {
    if (selectedReviews.length === 0) return

    try {
      const promises = selectedReviews.map(reviewId => {
        const data = bulkAssignmentType === 'product' 
          ? { productId: bulkProductId || null }
          : { tagIds: bulkTagIds }

        return fetch(`/api/admin/reviews/${reviewId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
      })

      await Promise.all(promises)
      
      // Reset bulk assignment state
      setSelectedReviews([])
      setShowBulkAssignment(false)
      setBulkProductId('')
      setBulkTagIds([])
      
      // Refresh reviews
      fetchReviews()
      notify('Updated', 'Reviews updated successfully.', 'NORMAL')
    } catch (error) {
      console.error('Error in bulk assignment:', error)
      notify('Failed to update reviews', 'An unexpected error occurred.', 'HIGH')
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

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Reviews Management</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Manage product reviews and their visibility across different products
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => window.open('/admin/reviews/mapping', '_blank')}
              variant="outline"
              className="px-4"
            >
              Advanced Mapping
            </Button>
            <button
              type="button"
              onClick={() => setShowAddReviewModal(true)}
              className="rounded-md bg-violet-600 px-4 py-2 text-center text-sm font-semibold text-white shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
            >
              Add Review
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 bg-white dark:bg-gray-800 shadow rounded-lg p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Search
            </label>
            <input
              type="text"
              id="search"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search by author or content..."
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="productId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Product
            </label>
            <select
              id="productId"
              value={filters.productId}
              onChange={(e) => handleFilterChange('productId', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
            >
              <option value="">All Products</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.header}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="tagId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tag
            </label>
            <select
              id="tagId"
              value={filters.tagId}
              onChange={(e) => handleFilterChange('tagId', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
            >
              <option value="">All Tags</option>
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="isApproved" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Status
            </label>
            <select
              id="isApproved"
              value={filters.isApproved}
              onChange={(e) => handleFilterChange('isApproved', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
            >
              <option value="">All Status</option>
              <option value="true">Approved</option>
              <option value="false">Pending</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex justify-between">
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Clear Filters
          </button>
          
          {selectedReviews.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedReviews.length} selected
              </span>
              <Button
                onClick={() => setShowBulkAssignment(true)}
                size="sm"
                variant="outline"
              >
                Assign Visibility
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Reviews Table */}
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedReviews.length === reviews.length && reviews.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-violet-600 shadow-sm focus:border-violet-300 focus:ring focus:ring-violet-200 focus:ring-opacity-50"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Review
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Tags
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        Loading...
                      </td>
                    </tr>
                  ) : reviews.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        No reviews found
                      </td>
                    </tr>
                  ) : (
                    reviews.map((review) => (
                      <tr key={review.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedReviews.includes(review.id)}
                            onChange={() => handleSelectReview(review.id)}
                            className="rounded border-gray-300 text-violet-600 shadow-sm focus:border-violet-300 focus:ring focus:ring-violet-200 focus:ring-opacity-50"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className="flex items-center">
                                {renderStars(review.rating)}
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {review.authorName}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                {review.bodyMarkdown.replace(/[#*`]/g, '').substring(0, 100)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {review.product && (
                              <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700">{review.product.header}</span>
                            )}
                            {review.reviewProducts?.map((rp, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700">{rp.product.header}</span>
                            ))}
                            {!review.product && (!review.reviewProducts || review.reviewProducts.length === 0) && (
                              <span>Global</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
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
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              review.isApproved
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            }`}
                          >
                            {review.isApproved ? 'Approved' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                const params = new URLSearchParams({ sel: review.id })
                                router.push(`/admin/reviews/mapping?${params.toString()}`)
                              }}
                              className="text-violet-600 dark:text-violet-400"
                            >
                              Map
                            </button>
                            <button
                              onClick={() => router.push(`/admin/reviews/${review.id}`)}
                              className="text-blue-600 dark:text-blue-400"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleToggleApproval(review)}
                              className={`text-sm ${
                                review.isApproved
                                  ? 'text-yellow-600 dark:text-yellow-400'
                                  : 'text-green-600 dark:text-green-400'
                              }`}
                            >
                              {review.isApproved ? 'Unapprove' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleDelete(review.id)}
                              className="text-red-600 dark:text-red-400"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} results
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.pages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Review Dialog removed */}

      {/* Bulk Assignment Dialog */}
      <Dialog open={showBulkAssignment} onOpenChange={setShowBulkAssignment}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Visibility</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Assignment Type</Label>
              <div className="flex space-x-4 mt-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="product"
                    checked={bulkAssignmentType === 'product'}
                    onChange={(e) => setBulkAssignmentType(e.target.value as 'product')}
                    className="mr-2"
                  />
                  Assign to Product
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="tags"
                    checked={bulkAssignmentType === 'tags'}
                    onChange={(e) => setBulkAssignmentType(e.target.value as 'tags')}
                    className="mr-2"
                  />
                  Assign to Tags
                </label>
              </div>
            </div>

            {bulkAssignmentType === 'product' && (
              <div>
                <Label htmlFor="bulkProduct">Product</Label>
                <select
                  id="bulkProduct"
                  value={bulkProductId}
                  onChange={(e) => setBulkProductId(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
                >
                  <option value="">No Product (Global Review)</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.header}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {bulkAssignmentType === 'tags' && (
              <div>
                <Label>Tags</Label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto mt-2">
                  {tags.map((tag) => (
                    <label key={tag.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={bulkTagIds.includes(tag.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setBulkTagIds(prev => [...prev, tag.id])
                          } else {
                            setBulkTagIds(prev => prev.filter(id => id !== tag.id))
                          }
                        }}
                        className="rounded border-gray-300 text-violet-600 shadow-sm focus:border-violet-300 focus:ring focus:ring-violet-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{tag.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="text-sm text-gray-600 dark:text-gray-400">
              This will affect {selectedReviews.length} selected review{selectedReviews.length !== 1 ? 's' : ''}.
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkAssignment(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkAssignment}>
              Apply Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Review Modal */}
      {showAddReviewModal && (
        <div className="fixed inset-0 bg-black/20 dark:bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add New Review</h2>
              <button
                onClick={() => setShowAddReviewModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Author Name *
                </label>
                <input
                  type="text"
                  value={newReview.authorName}
                  onChange={(e) => setNewReview(prev => ({ ...prev, authorName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter author name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Rating *
                </label>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                      className={`w-8 h-8 ${
                        star <= newReview.rating ? 'text-yellow-400' : 'text-gray-300'
                      } hover:text-yellow-400 transition-colors`}
                    >
                      <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Review Content (Markdown) *
                </label>
                <textarea
                  value={newReview.bodyMarkdown}
                  onChange={(e) => setNewReview(prev => ({ ...prev, bodyMarkdown: e.target.value }))}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter review content in Markdown format"
                />
              </div>

              {/* Mapping/assignment fields intentionally removed. */}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddReviewModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAddReview(false)}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
              >
                {submitting ? 'Creating...' : 'Create'}
              </button>
              <button
                onClick={() => handleAddReview(true)}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
              >
                {submitting ? 'Creating...' : 'Create & Map'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Review Form Component
interface ReviewFormProps {
  review: Review | null
  products: Product[]
  tags: Tag[]
  onClose: () => void
  onSave: () => void
}

function ReviewForm({ review, products, tags, onClose, onSave }: ReviewFormProps) {
  const [formData, setFormData] = useState({
    authorName: review?.authorName || '',
    rating: review?.rating || 5,
    bodyMarkdown: review?.bodyMarkdown || '',
    isApproved: review?.isApproved ?? true,
    displayOrder: review?.displayOrder || 0,
    productId: review?.productId || '',
    tagIds: review?.reviewTags.map(rt => rt.tag.id) || []
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = review ? `/api/admin/reviews/${review.id}` : '/api/admin/reviews'
      const method = review ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        onSave()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to save review')
      }
    } catch (error) {
      console.error('Error saving review:', error)
      alert('Failed to save review')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {review ? 'Edit Review' : 'Add Review'}
        </DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="authorName">Author Name</Label>
            <Input
              id="authorName"
              value={formData.authorName}
              onChange={(e) => setFormData(prev => ({ ...prev, authorName: e.target.value }))}
              required
              placeholder="Enter author name"
            />
          </div>

          <div>
            <Label htmlFor="rating">Rating</Label>
            <select
              id="rating"
              value={formData.rating}
              onChange={(e) => setFormData(prev => ({ ...prev, rating: parseInt(e.target.value) }))}
              required
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
            >
              {[1, 2, 3, 4, 5].map((rating) => (
                <option key={rating} value={rating}>
                  {rating} Star{rating !== 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <Label htmlFor="bodyMarkdown">Review Content</Label>
          <Textarea
            id="bodyMarkdown"
            rows={4}
            value={formData.bodyMarkdown}
            onChange={(e) => setFormData(prev => ({ ...prev, bodyMarkdown: e.target.value }))}
            required
            placeholder="Write your review content here..."
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="displayOrder">Display Order</Label>
            <Input
              id="displayOrder"
              type="number"
              value={formData.displayOrder}
              onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
              placeholder="0"
            />
          </div>

          <div className="flex items-center">
            <input
              id="isApproved"
              type="checkbox"
              checked={formData.isApproved}
              onChange={(e) => setFormData(prev => ({ ...prev, isApproved: e.target.checked }))}
              className="rounded border-gray-300 text-violet-600 shadow-sm focus:border-violet-300 focus:ring focus:ring-violet-200 focus:ring-opacity-50"
            />
            <Label htmlFor="isApproved" className="ml-2">
              Approved
            </Label>
          </div>
        </div>

        {/* Mapping Section - Only show when editing */}
        {review && (
          <div className="space-y-4 border-t pt-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">Visibility Mapping</h4>
            
            <div>
              <Label htmlFor="productId">Assign to Product</Label>
              <select
                id="productId"
                value={formData.productId}
                onChange={(e) => setFormData(prev => ({ ...prev, productId: e.target.value }))}
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
              >
                <option value="">No Product (Global Review)</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.header}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="mb-2">Assign to Tags (for product filtering)</Label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {tags.map((tag) => (
                  <label key={tag.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.tagIds.includes(tag.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({ ...prev, tagIds: [...prev.tagIds, tag.id] }))
                        } else {
                          setFormData(prev => ({ ...prev, tagIds: prev.tagIds.filter(id => id !== tag.id) }))
                        }
                      }}
                      className="rounded border-gray-300 text-violet-600 shadow-sm focus:border-violet-300 focus:ring focus:ring-violet-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{tag.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : (review ? 'Update' : 'Create')}
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}
