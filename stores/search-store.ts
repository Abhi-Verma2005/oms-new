import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { SearchItem } from '@/lib/search-data'

interface SearchState {
  isSearchOpen: boolean
  query: string
  results: SearchItem[]
  isLoading: boolean
  error: string | null
  recentSearches: string[]
  recentPages: SearchItem[]
}

interface SearchActions {
  setSearchOpen: (open: boolean) => void
  openSearch: () => void
  closeSearch: () => void
  toggleSearch: () => void
  setQuery: (query: string) => void
  setResults: (results: SearchItem[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  addRecentSearch: (search: string) => void
  addRecentPage: (page: SearchItem) => void
  clearSearch: () => void
  clearRecentSearches: () => void
  clearRecentPages: () => void
}

type SearchStore = SearchState & SearchActions

export const useSearchStore = create<SearchStore>()(
  persist(
    immer((set, get) => ({
      // Initial state
      isSearchOpen: false,
      query: '',
      results: [],
      isLoading: false,
      error: null,
      recentSearches: [],
      recentPages: [],

      // Actions
      setSearchOpen: (open: boolean) => {
        set((state) => {
          state.isSearchOpen = open
        })
      },

      openSearch: () => {
        set((state) => {
          state.isSearchOpen = true
        })
      },

      closeSearch: () => {
        set((state) => {
          state.isSearchOpen = false
          state.query = ''
          state.results = []
          state.error = null
        })
      },

      toggleSearch: () => {
        set((state) => {
          state.isSearchOpen = !state.isSearchOpen
          if (!state.isSearchOpen) {
            state.query = ''
            state.results = []
            state.error = null
          }
        })
      },

      setQuery: (query: string) => {
        set((state) => {
          state.query = query
        })
      },

      setResults: (results: SearchItem[]) => {
        set((state) => {
          state.results = results
        })
      },

      setLoading: (loading: boolean) => {
        set((state) => {
          state.isLoading = loading
        })
      },

      setError: (error: string | null) => {
        set((state) => {
          state.error = error
        })
      },

      addRecentSearch: (search: string) => {
        set((state) => {
          // Remove if already exists
          state.recentSearches = state.recentSearches.filter((s) => s !== search)
          // Add to beginning
          state.recentSearches.unshift(search)
          // Keep only last 10
          state.recentSearches = state.recentSearches.slice(0, 10)
        })
      },

      addRecentPage: (page: SearchItem) => {
        set((state) => {
          // Remove if already exists
          state.recentPages = state.recentPages.filter((p) => p.href !== page.href)
          // Add to beginning
          state.recentPages.unshift(page)
          // Keep only last 10
          state.recentPages = state.recentPages.slice(0, 10)
        })
      },

      clearSearch: () => {
        set((state) => {
          state.query = ''
          state.results = []
          state.error = null
          state.isLoading = false
        })
      },

      clearRecentSearches: () => {
        set((state) => {
          state.recentSearches = []
        })
      },

      clearRecentPages: () => {
        set((state) => {
          state.recentPages = []
        })
      },
    })),
    {
      name: 'search-storage',
      partialize: (state) => ({
        recentSearches: state.recentSearches,
        recentPages: state.recentPages,
      }),
    }
  )
)
