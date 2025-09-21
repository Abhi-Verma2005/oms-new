'use client'

import { useState, useEffect, useCallback } from 'react'
import { searchItems, type SearchItem } from '@/lib/search-data'

interface UseSearchOptions {
  debounceMs?: number
  minQueryLength?: number
  maxResults?: number
  userRoles?: string[]
  isAdmin?: boolean
}

interface UseSearchReturn {
  query: string
  setQuery: (query: string) => void
  results: SearchItem[]
  isLoading: boolean
  error: string | null
  clearSearch: () => void
  search: (query: string) => void
}

export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const {
    debounceMs = 300,
    minQueryLength = 1,
    maxResults = 50,
    userRoles = [],
    isAdmin = false
  } = options

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Debounced search function
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout
      return (searchQuery: string) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          if (searchQuery.length >= minQueryLength) {
            setIsLoading(true)
            setError(null)
            try {
              const searchResults = searchItems(searchQuery, userRoles, isAdmin).slice(0, maxResults)
              setResults(searchResults)
            } catch (err) {
              setError('Search failed. Please try again.')
              setResults([])
            } finally {
              setIsLoading(false)
            }
          } else {
            setResults([])
            setIsLoading(false)
          }
        }, debounceMs)
      }
    })(),
    [debounceMs, minQueryLength, maxResults, userRoles, isAdmin]
  )

  // Effect to trigger search when query changes
  useEffect(() => {
    debouncedSearch(query)
  }, [query, debouncedSearch])

  const clearSearch = useCallback(() => {
    setQuery('')
    setResults([])
    setError(null)
    setIsLoading(false)
  }, [])

  const search = useCallback((searchQuery: string) => {
    setQuery(searchQuery)
  }, [])

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    clearSearch,
    search
  }
}

// Hook for recent searches management
export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('recent-searches')
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved))
      } catch {
        setRecentSearches([])
      }
    }
  }, [])

  const addRecentSearch = useCallback((query: string) => {
    if (!query.trim()) return
    
    const newSearches = [query, ...recentSearches.filter(s => s !== query)].slice(0, 10)
    setRecentSearches(newSearches)
    localStorage.setItem('recent-searches', JSON.stringify(newSearches))
  }, [recentSearches])

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([])
    localStorage.removeItem('recent-searches')
  }, [])

  return {
    recentSearches,
    addRecentSearch,
    clearRecentSearches
  }
}

// Hook for recent pages management
export function useRecentPages() {
  const [recentPages, setRecentPages] = useState<SearchItem[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('recent-pages')
    if (saved) {
      try {
        setRecentPages(JSON.parse(saved))
      } catch {
        setRecentPages([])
      }
    }
  }, [])

  const addRecentPage = useCallback((page: SearchItem) => {
    const newPages = [page, ...recentPages.filter(p => p.id !== page.id)].slice(0, 5)
    setRecentPages(newPages)
    localStorage.setItem('recent-pages', JSON.stringify(newPages))
  }, [recentPages])

  const clearRecentPages = useCallback(() => {
    setRecentPages([])
    localStorage.removeItem('recent-pages')
  }, [])

  return {
    recentPages,
    addRecentPage,
    clearRecentPages
  }
}
