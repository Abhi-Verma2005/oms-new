'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useSearch, useRecentSearches, useRecentPages } from '@/hooks/use-search'
import { type SearchItem } from '@/lib/search-data'

interface SearchContextType {
  isSearchOpen: boolean
  openSearch: () => void
  closeSearch: () => void
  toggleSearch: () => void
  query: string
  setQuery: (query: string) => void
  results: SearchItem[]
  isLoading: boolean
  error: string | null
  recentSearches: string[]
  recentPages: SearchItem[]
  navigateToItem: (item: SearchItem) => void
  clearSearch: () => void
  clearRecentSearches: () => void
  clearRecentPages: () => void
}

const SearchContext = createContext<SearchContextType | undefined>(undefined)

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const router = useRouter()
  const { data: session } = useSession()
  
  // Get user roles and admin status
  const userRoles = (session?.user as any)?.roles || []
  const isAdmin = (session?.user as any)?.isAdmin || false
  
  const {
    query,
    setQuery,
    results,
    isLoading,
    error,
    clearSearch: clearSearchResults
  } = useSearch({
    userRoles,
    isAdmin
  })

  const {
    recentSearches,
    addRecentSearch,
    clearRecentSearches
  } = useRecentSearches()

  const {
    recentPages,
    addRecentPage,
    clearRecentPages
  } = useRecentPages()

  const openSearch = useCallback(() => {
    setIsSearchOpen(true)
  }, [])

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false)
    setQuery('')
  }, [setQuery])

  const toggleSearch = useCallback(() => {
    setIsSearchOpen(prev => !prev)
  }, [])

  const navigateToItem = useCallback((item: SearchItem) => {
    // Add to recent searches
    if (query.trim()) {
      addRecentSearch(query)
    }
    
    // Add to recent pages
    addRecentPage(item)
    
    // Navigate if it's a real page
    if (item.href !== '#') {
      router.push(item.href)
    }
    
    // Close search
    closeSearch()
  }, [query, addRecentSearch, addRecentPage, router, closeSearch])

  const clearSearch = useCallback(() => {
    clearSearchResults()
    setQuery('')
  }, [clearSearchResults, setQuery])

  const value: SearchContextType = {
    isSearchOpen,
    openSearch,
    closeSearch,
    toggleSearch,
    query,
    setQuery,
    results,
    isLoading,
    error,
    recentSearches,
    recentPages,
    navigateToItem,
    clearSearch,
    clearRecentSearches,
    clearRecentPages
  }

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  )
}

export function useSearchContext() {
  const context = useContext(SearchContext)
  if (context === undefined) {
    throw new Error('useSearchContext must be used within a SearchProvider')
  }
  return context
}
