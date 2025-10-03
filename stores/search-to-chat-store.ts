import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

interface SearchToChatState {
  // Query state
  pendingQuery: string | null
  isRedirecting: boolean
  
  // Auto-send state
  shouldAutoSend: boolean
  autoSendQuery: string | null
}

interface SearchToChatActions {
  // Query management
  setPendingQuery: (query: string | null) => void
  clearPendingQuery: () => void
  
  // Redirect state
  setRedirecting: (redirecting: boolean) => void
  
  // Auto-send functionality
  setAutoSend: (shouldSend: boolean, query?: string | null) => void
  clearAutoSend: () => void
  
  // Utility actions
  hasPendingQuery: () => boolean
  shouldAutoSendQuery: () => boolean
}

type SearchToChatStore = SearchToChatState & SearchToChatActions

export const useSearchToChatStore = create<SearchToChatStore>()(
  persist(
    immer((set, get) => ({
      // Initial state
      pendingQuery: null,
      isRedirecting: false,
      shouldAutoSend: false,
      autoSendQuery: null,

      // Query management
      setPendingQuery: (query: string | null) => {
        set((state) => {
          state.pendingQuery = query
        })
      },

      clearPendingQuery: () => {
        set((state) => {
          state.pendingQuery = null
        })
      },

      // Redirect state
      setRedirecting: (redirecting: boolean) => {
        set((state) => {
          state.isRedirecting = redirecting
        })
      },

      // Auto-send functionality
      setAutoSend: (shouldSend: boolean, query?: string | null) => {
        set((state) => {
          state.shouldAutoSend = shouldSend
          state.autoSendQuery = query || null
        })
      },

      clearAutoSend: () => {
        set((state) => {
          state.shouldAutoSend = false
          state.autoSendQuery = null
        })
      },

      // Utility actions
      hasPendingQuery: () => {
        return !!get().pendingQuery
      },

      shouldAutoSendQuery: () => {
        const state = get()
        return state.shouldAutoSend && !!state.autoSendQuery
      },
    })),
    {
      name: 'search-to-chat-storage',
      partialize: (state) => ({
        pendingQuery: state.pendingQuery,
        shouldAutoSend: state.shouldAutoSend,
        autoSendQuery: state.autoSendQuery,
      }),
    }
  )
)
