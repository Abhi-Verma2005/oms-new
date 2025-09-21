'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Tag {
  id: string
  name: string
  color: string
}

interface Product {
  id: string
  slug: string
  header: string
  productTags: Array<{
    id: string
    tag: Tag
  }>
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
  reviewTags: Array<{
    id: string
    tag: Tag
  }>
}

interface SelectedProducts {
  [tagId: string]: string[] // tagId -> productIds
  global: string[] // globally selected products
}

export function ReviewMapping() {
  const router = useRouter()
  const notify = (title: string, body: string, priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' = 'NORMAL') => {
    if (typeof window === 'undefined') return
    const now = new Date().toISOString()
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2)}`
    const detail = { id, title, body, imageUrl: undefined, typeId: 'custom', isActive: true, isGlobal: true, targetUserIds: [] as string[], priority, createdAt: now, updatedAt: now, type: { id: 'custom', name: 'custom', displayName: 'Notification' } }
    window.dispatchEvent(new CustomEvent('preview-notification', { detail }))
  }
  const searchParams = useSearchParams()
  
  const [reviews, setReviews] = useState<Review[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [topTags, setTopTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  
  // Selection state
  const [selectedReviews, setSelectedReviews] = useState<string[]>([])
  const [selectedProducts, setSelectedProducts] = useState<SelectedProducts>({ global: [] })
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [reviewSearchQuery, setReviewSearchQuery] = useState('')
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([])
  const [selectedStars, setSelectedStars] = useState<number[]>([])
  
  // API-based search state
  const [tagSearchQuery, setTagSearchQuery] = useState('')
  const [searchedTags, setSearchedTags] = useState<Tag[]>([])
  const [tagProducts, setTagProducts] = useState<Record<string, Product[]>>({})
  const [productSearchQueries, setProductSearchQueries] = useState<Record<string, string>>({})
  const [loadingTags, setLoadingTags] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState<Record<string, boolean>>({})
  
  // UI state
  const [activeTab, setActiveTab] = useState('by-tags')
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchData()
  }, [])

  // Load filters from URL on initial mount only
  const didInitFromURL = useRef(false)
  useEffect(() => {
    if (didInitFromURL.current) return
    didInitFromURL.current = true

    const tagIds = searchParams?.getAll('tags') || []
    if (tagIds.length > 0) {
      tagIds.forEach(tagId => {
        loadTagFromURL(tagId)
      })
    }

    const r = searchParams?.get('r') || ''
    if (r) setReviewSearchQuery(r)

    const starsParam = searchParams?.get('stars')
    if (starsParam) {
      const parsed = starsParam.split(',').map(s => parseInt(s, 10)).filter(n => !isNaN(n))
      setSelectedStars(parsed)
    }

    const tab = searchParams?.get('tab')
    if (tab === 'by-tags' || tab === 'global-search') setActiveTab(tab)

    const tagQ = searchParams?.get('tag') || ''
    if (tagQ) setTagSearchQuery(tagQ)

    const globalQ = searchParams?.get('q') || ''
    if (globalQ) setSearchQuery(globalQ)

    // Preselect reviews from URL
    const preSel = searchParams?.getAll('sel') || []
    const selCsv = searchParams?.get('selected')
    const combined = new Set<string>([...preSel, ...(selCsv ? selCsv.split(',') : [])].filter(Boolean))
    if (combined.size > 0) {
      setSelectedReviews(Array.from(combined))
    }

    // product search per tag: multiple pt params encoded as tagId:query
    const pts = searchParams?.getAll('pt') || []
    if (pts.length > 0) {
      const map: Record<string, string> = {}
      pts.forEach(entry => {
        const idx = entry.indexOf(':')
        if (idx > 0) {
          const tagId = entry.slice(0, idx)
          const q = entry.slice(idx + 1)
          if (tagId && q) map[tagId] = q
        }
      })
      if (Object.keys(map).length > 0) setProductSearchQueries(map)
    }
  }, [searchParams])

  // Sync selected filters to URL (replace to avoid history spam)
  useEffect(() => {
    // Build params
    const params = new URLSearchParams()

    // expanded tags
    Array.from(expandedTags).forEach(id => params.append('tags', id))

    if (reviewSearchQuery) params.set('r', reviewSearchQuery)
    if (selectedStars.length > 0) params.set('stars', selectedStars.join(','))
    if (activeTab) params.set('tab', activeTab)
    if (tagSearchQuery) params.set('tag', tagSearchQuery)
    if (searchQuery) params.set('q', searchQuery)

    // product search per tag
    Object.entries(productSearchQueries).forEach(([tagId, q]) => {
      if (q) params.append('pt', `${tagId}:${q}`)
    })

    // selected reviews
    selectedReviews.forEach(id => params.append('sel', id))

    const current = searchParams?.toString()
    const next = params.toString()
    if (current !== next) {
      router.replace(`?${next}`, { scroll: false })
    }
  }, [expandedTags, reviewSearchQuery, selectedStars, activeTab, tagSearchQuery, searchQuery, productSearchQueries, selectedReviews, router, searchParams])

  // Debounced review search with star filtering
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (reviewSearchQuery.trim()) {
        searchReviews(reviewSearchQuery, selectedStars)
      } else {
        filterReviewsByStars(reviews, selectedStars)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [reviewSearchQuery, selectedStars, reviews])

  // Debounced product search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        const filtered = products.filter(product =>
          product.header.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.slug.toLowerCase().includes(searchQuery.toLowerCase())
        )
        setFilteredProducts(filtered)
      } else {
        setFilteredProducts(products)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, products])

  // Initialize filtered reviews when reviews change
  useEffect(() => {
    setFilteredReviews(reviews)
  }, [reviews])

  // Debounced tag search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchTags(tagSearchQuery)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [tagSearchQuery])

  // Debounced product search within tags
  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = []
    
    Object.entries(productSearchQueries).forEach(([tagId, query]) => {
      const timeoutId = setTimeout(() => {
        searchProductsInTag(tagId, query)
      }, 300)
      timeouts.push(timeoutId)
    })

    return () => {
      timeouts.forEach(clearTimeout)
    }
  }, [productSearchQueries])

  // When reviews are selected, preselect their already mapped products
  useEffect(() => {
    if (selectedReviews.length === 0) return
    if (products.length === 0 || tags.length === 0) return

    // Build set of mapped productIds for the selected reviews
    const mappedProductIds = new Set<string>()
    for (const r of reviews) {
      if (!selectedReviews.includes(r.id)) continue
      const rp = (r as any).reviewProducts as Array<{ product: { id: string } }>
      if (Array.isArray(rp)) {
        rp.forEach(x => x?.product?.id && mappedProductIds.add(x.product.id))
      }
    }
    if (mappedProductIds.size === 0) return

    setSelectedProducts(prev => {
      const next: any = { ...prev }
      // Global selection: union with existing
      next.global = Array.from(new Set([...(prev.global || []), ...Array.from(mappedProductIds)]))

      // Per-tag selection: union mapped IDs that belong to the tag
      for (const tag of tags) {
        const tagProductIds = products
          .filter(p => p.productTags?.some((pt: any) => pt.tag?.id === tag.id))
          .map(p => p.id)
        const mappedInTag = Array.from(mappedProductIds).filter(id => tagProductIds.includes(id))
        if (mappedInTag.length > 0) {
          next[tag.id] = Array.from(new Set([...(prev[tag.id] || []), ...mappedInTag]))
        }
      }
      return next
    })
  }, [selectedReviews, reviews, products, tags])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [reviewsRes, productsRes, tagsRes, topTagsRes] = await Promise.all([
        fetch('/api/admin/reviews'),
        fetch('/api/admin/products'),
        fetch('/api/admin/tags'),
        fetch('/api/admin/tags/top?limit=5')
      ])

      const [reviewsData, productsData, tagsData, topTagsData] = await Promise.all([
        reviewsRes.json(),
        productsRes.json(),
        tagsRes.json(),
        topTagsRes.json()
      ])

      if (reviewsRes.ok) setReviews(reviewsData.reviews || [])
      if (productsRes.ok) setProducts(productsData.products || [])
      if (tagsRes.ok) setTags(tagsData.tags || [])
      if (topTagsRes.ok) setTopTags(topTagsData.tags || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Deprecated direct updateURL; URL syncing happens in the sync effect above

  const loadTagFromURL = async (tagId: string) => {
    if (!tagProducts[tagId]) {
      await searchProductsInTag(tagId, '')
    }
    setExpandedTags(prev => new Set([...prev, tagId]))
  }

  const searchReviews = async (query: string, stars: number[] = []) => {
    try {
      const params = new URLSearchParams({
        search: query
      })
      if (stars.length > 0) {
        params.append('stars', stars.join(','))
      }
      
      const response = await fetch(`/api/admin/reviews?${params}`)
      const data = await response.json()
      if (response.ok) {
        setFilteredReviews(data.reviews || [])
      }
    } catch (error) {
      console.error('Error searching reviews:', error)
    }
  }

  const filterReviewsByStars = (reviewsToFilter: Review[], stars: number[]) => {
    if (stars.length === 0) {
      setFilteredReviews(reviewsToFilter)
    } else {
      const filtered = reviewsToFilter.filter(review => stars.includes(review.rating))
      setFilteredReviews(filtered)
    }
  }

  const searchTags = async (query: string) => {
    if (!query.trim()) {
      setSearchedTags([])
      return
    }

    try {
      setLoadingTags(true)
      const response = await fetch(`/api/admin/tags/search?search=${encodeURIComponent(query)}&limit=10`)
      const data = await response.json()
      if (response.ok) {
        setSearchedTags(data.tags || [])
      }
    } catch (error) {
      console.error('Error searching tags:', error)
    } finally {
      setLoadingTags(false)
    }
  }

  const searchProductsInTag = async (tagId: string, query: string) => {
    try {
      setLoadingProducts(prev => ({ ...prev, [tagId]: true }))
      const params = new URLSearchParams({
        tagId,
        limit: '50'
      })
      if (query.trim()) {
        params.append('search', query)
      }
      
      const response = await fetch(`/api/admin/products/search?${params}`)
      const data = await response.json()
      if (response.ok) {
        setTagProducts(prev => ({ ...prev, [tagId]: data.products || [] }))
      }
    } catch (error) {
      console.error('Error searching products in tag:', error)
    } finally {
      setLoadingProducts(prev => ({ ...prev, [tagId]: false }))
    }
  }

  const handleReviewSelection = (reviewId: string) => {
    setSelectedReviews(prev =>
      prev.includes(reviewId)
        ? prev.filter(id => id !== reviewId)
        : [...prev, reviewId]
    )
  }

  const handleSelectAllReviews = () => {
    if (selectedReviews.length === filteredReviews.length) {
      setSelectedReviews([])
    } else {
      setSelectedReviews(filteredReviews.map(r => r.id))
    }
  }

  const handleProductSelection = (productId: string, tagId?: string) => {
    if (tagId) {
      setSelectedProducts(prev => ({
        ...prev,
        [tagId]: prev[tagId]?.includes(productId)
          ? prev[tagId].filter(id => id !== productId)
          : [...(prev[tagId] || []), productId]
      }))
    } else {
      setSelectedProducts(prev => ({
        ...prev,
        global: prev.global.includes(productId)
          ? prev.global.filter(id => id !== productId)
          : [...prev.global, productId]
      }))
    }
  }

  const handleSelectAllProductsInTag = (tagId: string) => {
    const tagProducts = products.filter(p => p.productTags.some(pt => pt.tag.id === tagId))
    const allSelected = tagProducts.every(p => selectedProducts[tagId]?.includes(p.id))
    
    if (allSelected) {
      setSelectedProducts(prev => ({
        ...prev,
        [tagId]: []
      }))
    } else {
      setSelectedProducts(prev => ({
        ...prev,
        [tagId]: tagProducts.map(p => p.id)
      }))
    }
  }

  const handleSelectAllGlobal = () => {
    const allSelected = filteredProducts.every(p => selectedProducts.global.includes(p.id))
    
    if (allSelected) {
      setSelectedProducts(prev => ({
        ...prev,
        global: []
      }))
    } else {
      setSelectedProducts(prev => ({
        ...prev,
        global: filteredProducts.map(p => p.id)
      }))
    }
  }

  const handleApplyMapping = async () => {
    if (selectedReviews.length === 0) {
      notify('Selection required', 'Please select at least one review', 'HIGH')
      return
    }

    const allSelectedProducts = [
      ...selectedProducts.global,
      ...Object.values(selectedProducts).flat()
    ].filter((id, index, arr) => arr.indexOf(id) === index) // Remove duplicates

    if (allSelectedProducts.length === 0) {
      notify('Selection required', 'Please select at least one product', 'HIGH')
      return
    }

    try {
      const res = await fetch('/api/admin/reviews/bulk-map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewIds: selectedReviews,
          productIds: allSelectedProducts
        })
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to map reviews')
      }
      
      // Reset selections
      setSelectedReviews([])
      setSelectedProducts({ global: [] })
      
      // Refresh data
      fetchData()
      
      notify('Mapping applied', `Mapped ${selectedReviews.length} review(s) to ${allSelectedProducts.length} product(s)`, 'NORMAL') 
    } catch (error) {
      console.error('Error applying mapping:', error)
      notify('Failed to apply mapping', 'An unexpected error occurred.', 'HIGH')
    }
  }

  const getProductsByTag = (tagId: string) => {
    // Use API-searched products if available, otherwise fall back to filtered products
    if (tagProducts[tagId]) {
      return tagProducts[tagId]
    }
    return filteredProducts.filter(p => p.productTags.some(pt => pt.tag.id === tagId))
  }

  const getSelectedCount = () => {
    const allSelected = [
      ...selectedProducts.global,
      ...Object.values(selectedProducts).flat()
    ].filter((id, index, arr) => arr.indexOf(id) === index)
    return allSelected.length
  }

  const toggleTagExpansion = (tagId: string) => {
    setExpandedTags(prev => {
      const newSet = new Set(prev)
      if (newSet.has(tagId)) {
        newSet.delete(tagId)
      } else {
        newSet.add(tagId)
        // Load products when expanding
        if (!tagProducts[tagId]) {
          searchProductsInTag(tagId, '')
        }
      }
      return newSet
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Review Mapping</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Map reviews to products for smart visibility control
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {selectedReviews.length} review(s) selected
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {getSelectedCount()} product(s) selected
          </div>
          <Button 
            onClick={handleApplyMapping}
            disabled={selectedReviews.length === 0 || getSelectedCount() === 0}
            className="bg-violet-600 hover:bg-violet-700"
          >
            Apply Mapping
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reviews Selection */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Select Reviews</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllReviews}
                >
                  {selectedReviews.length === filteredReviews.length ? 'Deselect All' : 'Select All'}
                </Button>
              </CardTitle>
              <div className="mt-3 space-y-3">
                <Input
                  placeholder="Search reviews..."
                  value={reviewSearchQuery}
                  onChange={(e) => setReviewSearchQuery(e.target.value)}
                  className="w-full"
                />
                
                <div>
                  <Label className="text-sm font-medium">Filter by Rating</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[5, 4, 3, 2, 1].map((star) => (
                      <button
                        key={star}
                        onClick={() => {
                          if (selectedStars.includes(star)) {
                            setSelectedStars(prev => prev.filter(s => s !== star))
                          } else {
                            setSelectedStars(prev => [...prev, star])
                          }
                        }}
                        className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm border transition-colors ${
                          selectedStars.includes(star)
                            ? 'bg-violet-100 border-violet-300 text-violet-700 dark:bg-violet-900/20 dark:border-violet-600 dark:text-violet-300'
                            : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        <div className="flex">
                          {[...Array(star)].map((_, i) => (
                            <svg key={i} className="w-3 h-3 fill-current text-yellow-400" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span>{star}</span>
                      </button>
                    ))}
                    {selectedStars.length > 0 && (
                      <button
                        onClick={() => setSelectedStars([])}
                        className="px-3 py-1 rounded-full text-sm border border-gray-300 text-gray-700 hover:bg-gray-200 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
                
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {filteredReviews.length} review(s) found
                </p>
              </div>
            </CardHeader>
            <CardContent className="max-h-96 overflow-y-auto">
              <div className="space-y-2">
                {filteredReviews.map((review) => (
                  <div
                    key={review.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedReviews.includes(review.id)
                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                    onClick={() => handleReviewSelection(review.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        checked={selectedReviews.includes(review.id)}
                        onChange={() => handleReviewSelection(review.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <div className="flex">
                            {Array.from({ length: 5 }, (_, i) => (
                              <svg
                                key={i}
                                className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {review.authorName}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {review.bodyMarkdown.replace(/[#*`]/g, '').substring(0, 100)}...
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Product Selection */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 rounded-lg border border-gray-200 dark:border-gray-700/60 bg-gray-50 dark:bg-gray-800/60 p-1 shadow-inner">
              <TabsTrigger
                value="by-tags"
                className="text-sm rounded-md px-3 py-1.5 border border-transparent data-[state=active]:border-violet-500 data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:translate-y-[1px] transition-all duration-150 ease-out hover:bg-black/5 dark:hover:bg-white/5"
              >
                By Tags
              </TabsTrigger>
              <TabsTrigger
                value="global-search"
                className="text-sm rounded-md px-3 py-1.5 border border-transparent data-[state=active]:border-violet-500 data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:translate-y-[1px] transition-all duration-150 ease-out hover:bg-black/5 dark:hover:bg-white/5"
              >
                Global Search
              </TabsTrigger>
            </TabsList>

            <TabsContent value="by-tags" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="tag-search">Search Tags</Label>
                  <Input
                    id="tag-search"
                    placeholder="Search for tags..."
                    value={tagSearchQuery}
                    onChange={(e) => setTagSearchQuery(e.target.value)}
                    className="mt-1"
                  />
                  {loadingTags && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Searching tags...
                    </p>
                  )}
                  {!loadingTags && tagSearchQuery && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {searchedTags.length} tag(s) found
                    </p>
                  )}
                </div>
                
                {/* Display top tags by default */}
                {!tagSearchQuery && topTags.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">Top Tags</h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Most products</span>
                    </div>
                    {topTags.map((tag) => {
                      const tagProducts = getProductsByTag(tag.id)
                      const isExpanded = expandedTags.has(tag.id)
                      const selectedInTag = selectedProducts[tag.id] || []
                      const allSelected = tagProducts.length > 0 && tagProducts.every(p => selectedInTag.includes(p.id))
                      const productSearchQuery = productSearchQueries[tag.id] || ''
                      const isLoadingProducts = loadingProducts[tag.id] || false

                      return (
                        <Card key={tag.id}>
                          <CardHeader 
                            className="cursor-pointer"
                            onClick={() => toggleTagExpansion(tag.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Badge 
                                  style={{ backgroundColor: tag.color + '20', color: tag.color }}
                                  className="border-0"
                                >
                                  {tag.name}
                                </Badge>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {tagProducts.length} products
                                </span>
                                {selectedInTag.length > 0 && (
                                  <span className="text-sm text-violet-600 dark:text-violet-400">
                                    {selectedInTag.length} selected
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                {tagProducts.length > 0 && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleSelectAllProductsInTag(tag.id)
                                    }}
                                  >
                                    {allSelected ? 'Deselect All' : 'Select All'}
                                  </Button>
                                )}
                                <svg
                                  className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </div>
                          </CardHeader>
                          {isExpanded && (
                            <CardContent>
                              <div className="space-y-3">
                                {/* Product search within tag */}
                                <div>
                                  <Input
                                    placeholder={`Search products in ${tag.name}...`}
                                    value={productSearchQuery}
                                    onChange={(e) => {
                                      const query = e.target.value
                                      setProductSearchQueries(prev => ({ ...prev, [tag.id]: query }))
                                    }}
                                    className="w-full"
                                  />
                                  {isLoadingProducts && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      Searching products...
                                    </p>
                                  )}
                                  {!isLoadingProducts && productSearchQuery && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      {tagProducts.length} product(s) found
                                    </p>
                                  )}
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {tagProducts.map((product) => (
                                    <div
                                      key={product.id}
                                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                                        selectedInTag.includes(product.id)
                                          ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                      }`}
                                      onClick={() => handleProductSelection(product.id, tag.id)}
                                    >
                                      <div className="flex items-start space-x-3">
                                        <Checkbox
                                          checked={selectedInTag.includes(product.id)}
                                          onChange={() => handleProductSelection(product.id, tag.id)}
                                        />
                                        <div className="flex-1 min-w-0">
                                          <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                            {product.header}
                                          </h4>
                                          <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {product.slug}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </CardContent>
                          )}
                        </Card>
                      )
                    })}
                  </div>
                )}
                
                {/* Display searched tags */}
                {tagSearchQuery && searchedTags.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Search Results</h3>
                    {searchedTags.map((tag) => {
                      const tagProducts = getProductsByTag(tag.id)
                      const isExpanded = expandedTags.has(tag.id)
                      const selectedInTag = selectedProducts[tag.id] || []
                      const allSelected = tagProducts.length > 0 && tagProducts.every(p => selectedInTag.includes(p.id))
                      const productSearchQuery = productSearchQueries[tag.id] || ''
                      const isLoadingProducts = loadingProducts[tag.id] || false

                  return (
                    <Card key={tag.id}>
                      <CardHeader 
                        className="cursor-pointer"
                        onClick={() => toggleTagExpansion(tag.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Badge 
                              style={{ backgroundColor: tag.color + '20', color: tag.color }}
                              className="border-0"
                            >
                              {tag.name}
                            </Badge>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {tagProducts.length} products
                            </span>
                            {selectedInTag.length > 0 && (
                              <span className="text-sm text-violet-600 dark:text-violet-400">
                                {selectedInTag.length} selected
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            {tagProducts.length > 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleSelectAllProductsInTag(tag.id)
                                }}
                              >
                                {allSelected ? 'Deselect All' : 'Select All'}
                              </Button>
                            )}
                            <svg
                              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </CardHeader>
                      {isExpanded && (
                        <CardContent>
                          <div className="space-y-3">
                            {/* Product search within tag */}
                            <div>
                              <Input
                                placeholder={`Search products in ${tag.name}...`}
                                value={productSearchQuery}
                                onChange={(e) => {
                                  const query = e.target.value
                                  setProductSearchQueries(prev => ({ ...prev, [tag.id]: query }))
                                }}
                                className="w-full"
                              />
                              {isLoadingProducts && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  Searching products...
                                </p>
                              )}
                              {!isLoadingProducts && productSearchQuery && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {tagProducts.length} product(s) found
                                </p>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {tagProducts.map((product) => (
                              <div
                                key={product.id}
                                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                                  selectedInTag.includes(product.id)
                                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                                onClick={() => handleProductSelection(product.id, tag.id)}
                              >
                                <div className="flex items-start space-x-3">
                                  <Checkbox
                                    checked={selectedInTag.includes(product.id)}
                                    onChange={() => handleProductSelection(product.id, tag.id)}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                      {product.header}
                                    </h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {product.slug}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  )
                })}
                </div>
                )}
                
                {/* Empty state */}
                {!tagSearchQuery && topTags.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">No tags available</p>
                  </div>
                )}
                
                {tagSearchQuery && searchedTags.length === 0 && !loadingTags && (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">No tags found for "{tagSearchQuery}"</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="global-search" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="search">Search Products</Label>
                  <Input
                    id="search"
                    placeholder="Search by product name or slug..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {filteredProducts.length} product(s) found
                  </p>
                </div>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Search Results</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAllGlobal}
                        disabled={filteredProducts.length === 0}
                      >
                        {filteredProducts.every(p => selectedProducts.global.includes(p.id)) ? 'Deselect All' : 'Select All'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="max-h-96 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {filteredProducts.map((product) => (
                        <div
                          key={product.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedProducts.global.includes(product.id)
                              ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                          onClick={() => handleProductSelection(product.id)}
                        >
                          <div className="flex items-start space-x-3">
                            <Checkbox
                              checked={selectedProducts.global.includes(product.id)}
                              onChange={() => handleProductSelection(product.id)}
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {product.header}
                              </h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {product.slug}
                              </p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {product.productTags.map((pt) => (
                                  <Badge
                                    key={pt.id}
                                    variant="outline"
                                    className="text-xs"
                                    style={{ borderColor: pt.tag.color + '40', color: pt.tag.color }}
                                  >
                                    {pt.tag.name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
