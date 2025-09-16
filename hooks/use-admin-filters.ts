'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export interface FilterState {
  search: string
  status: string
  paymentStatus: string
  tagIds: string[]
  hasRoles: string
  dateFrom: string
  dateTo: string
  sortBy: string
  sortOrder: string
  page: number
  limit: number
}

export interface FilterOptions {
  searchPlaceholder?: string
  statusOptions?: { value: string; label: string }[]
  paymentStatusOptions?: { value: string; label: string }[]
  sortOptions?: { value: string; label: string }[]
  hasRolesOptions?: { value: string; label: string }[]
  enableDateRange?: boolean
  enableTags?: boolean
  enableRoles?: boolean
  defaultSort?: string
  defaultLimit?: number
}

const defaultFilterState: FilterState = {
  search: '',
  status: 'all',
  paymentStatus: 'all',
  tagIds: [],
  hasRoles: 'all',
  dateFrom: '',
  dateTo: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  page: 1,
  limit: 20
}

export function useAdminFilters(
  apiEndpoint: string,
  options: FilterOptions = {}
) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<any>(null)
  const [filters, setFilters] = useState<FilterState>(defaultFilterState)
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Initialize filters from URL params
  useEffect(() => {
    const urlFilters: Partial<FilterState> = {}
    
    // Parse URL parameters
    const sp = searchParams
    if (sp?.get('search')) urlFilters.search = sp.get('search')!
    if (sp?.get('status')) urlFilters.status = sp.get('status')!
    if (sp?.get('paymentStatus')) urlFilters.paymentStatus = sp.get('paymentStatus')!
    if (sp?.get('tagIds')) urlFilters.tagIds = sp.get('tagIds')!.split(',').filter(Boolean)
    if (sp?.get('hasRoles')) urlFilters.hasRoles = sp.get('hasRoles')!
    if (sp?.get('dateFrom')) urlFilters.dateFrom = sp.get('dateFrom')!
    if (sp?.get('dateTo')) urlFilters.dateTo = sp.get('dateTo')!
    if (sp?.get('sortBy')) urlFilters.sortBy = sp.get('sortBy')!
    if (sp?.get('sortOrder')) urlFilters.sortOrder = sp.get('sortOrder')!
    if (sp?.get('page')) urlFilters.page = parseInt(sp.get('page')!) || 1
    if (sp?.get('limit')) urlFilters.limit = parseInt(sp.get('limit')!) || 20

    // Apply defaults
    const newFilters = {
      ...defaultFilterState,
      ...(options.defaultSort && { 
        sortBy: options.defaultSort.split('-')[0],
        sortOrder: options.defaultSort.split('-')[1] || 'desc'
      }),
      ...(options.defaultLimit && { limit: options.defaultLimit }),
      ...urlFilters
    }

    setFilters(newFilters)
  }, [searchParams, options.defaultSort, options.defaultLimit])

  // Update URL when filters change
  const updateURL = useCallback((newFilters: FilterState) => {
    const params = new URLSearchParams()
    
    if (newFilters.search) params.set('search', newFilters.search)
    if (newFilters.status && newFilters.status !== 'all') params.set('status', newFilters.status)
    if (newFilters.paymentStatus && newFilters.paymentStatus !== 'all') params.set('paymentStatus', newFilters.paymentStatus)
    if (newFilters.tagIds.length > 0) params.set('tagIds', newFilters.tagIds.join(','))
    if (newFilters.hasRoles && newFilters.hasRoles !== 'all') params.set('hasRoles', newFilters.hasRoles)
    if (newFilters.dateFrom) params.set('dateFrom', newFilters.dateFrom)
    if (newFilters.dateTo) params.set('dateTo', newFilters.dateTo)
    if (newFilters.sortBy) params.set('sortBy', newFilters.sortBy)
    if (newFilters.sortOrder) params.set('sortOrder', newFilters.sortOrder)
    if (newFilters.page > 1) params.set('page', newFilters.page.toString())
    if (newFilters.limit !== 20) params.set('limit', newFilters.limit.toString())

    const queryString = params.toString()
    const newURL = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname
    
    router.replace(newURL, { scroll: false })
  }, [router])

  // Fetch data with current filters
  const fetchData = useCallback(async (currentFilters: FilterState) => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        page: currentFilters.page.toString(),
        limit: currentFilters.limit.toString(),
        sortBy: currentFilters.sortBy,
        sortOrder: currentFilters.sortOrder,
        ...(currentFilters.search && { 
          query: currentFilters.search,
          search: currentFilters.search 
        }),
        ...(currentFilters.status && currentFilters.status !== 'all' && { status: currentFilters.status }),
        ...(currentFilters.paymentStatus && currentFilters.paymentStatus !== 'all' && { paymentStatus: currentFilters.paymentStatus }),
        ...(currentFilters.tagIds.length > 0 && { tagIds: currentFilters.tagIds.join(',') }),
        ...(currentFilters.hasRoles && currentFilters.hasRoles !== 'all' && { hasRoles: currentFilters.hasRoles }),
        ...(currentFilters.dateFrom && { dateFrom: currentFilters.dateFrom }),
        ...(currentFilters.dateTo && { dateTo: currentFilters.dateTo })
      })

      const response = await fetch(`${apiEndpoint}?${params}`)
      if (!response.ok) throw new Error('Failed to fetch data')
      
      const result = await response.json()
      setData(result.data || result.users || result.orders || [])
      setPagination(result.pagination || null)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [apiEndpoint])

  // Debounced fetch for instant filtering
  const debouncedFetch = useCallback((newFilters: FilterState) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    
    debounceRef.current = setTimeout(() => {
      fetchData(newFilters)
    }, 300) // 300ms debounce
  }, [fetchData])

  // Update filters and trigger fetch
  const updateFilters = useCallback((updates: Partial<FilterState>, immediate = false) => {
    const newFilters = { ...filters, ...updates, page: 1 } // Reset to page 1 on filter change
    
    setFilters(newFilters)
    updateURL(newFilters)
    
    if (immediate) {
      fetchData(newFilters)
    } else {
      debouncedFetch(newFilters)
    }
  }, [filters, updateURL, fetchData, debouncedFetch])

  // Handle pagination
  const handlePageChange = useCallback((page: number) => {
    const newFilters = { ...filters, page }
    setFilters(newFilters)
    updateURL(newFilters)
    fetchData(newFilters)
  }, [filters, updateURL, fetchData])

  // Reset filters
  const resetFilters = useCallback(() => {
    const resetState = {
      ...defaultFilterState,
      ...(options.defaultSort && { 
        sortBy: options.defaultSort.split('-')[0],
        sortOrder: options.defaultSort.split('-')[1] || 'desc'
      }),
      ...(options.defaultLimit && { limit: options.defaultLimit })
    }
    
    setFilters(resetState)
    updateURL(resetState)
    fetchData(resetState)
  }, [options.defaultSort, options.defaultLimit, updateURL, fetchData])

  // Initial data fetch
  useEffect(() => {
    if (filters.search !== undefined) { // Only fetch when filters are initialized
      fetchData(filters)
    }
  }, []) // Only run once on mount

  // Handle tag toggle
  const toggleTag = useCallback((tagId: string) => {
    const newTagIds = filters.tagIds.includes(tagId)
      ? filters.tagIds.filter(id => id !== tagId)
      : [...filters.tagIds, tagId]
    
    updateFilters({ tagIds: newTagIds })
  }, [filters.tagIds, updateFilters])

  return {
    data,
    loading,
    pagination,
    filters,
    updateFilters,
    handlePageChange,
    resetFilters,
    toggleTag,
    // Convenience methods
    setSearch: (search: string) => updateFilters({ search }),
    setStatus: (status: string) => updateFilters({ status }),
    setPaymentStatus: (paymentStatus: string) => updateFilters({ paymentStatus }),
    setHasRoles: (hasRoles: string) => updateFilters({ hasRoles }),
    setDateRange: (dateFrom: string, dateTo: string) => updateFilters({ dateFrom, dateTo }),
    setSorting: (sortBy: string, sortOrder: string) => updateFilters({ sortBy, sortOrder })
  }
}
