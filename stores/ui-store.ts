import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

interface UIState {
  // Theme
  theme: 'light' | 'dark' | 'system'
  
  // Sidebar states
  sidebarOpen: boolean
  mobileSidebarOpen: boolean
  
  // Modal states
  modals: {
    [key: string]: boolean
  }
  
  // Loading states
  loading: {
    [key: string]: boolean
  }
  
  // Toast/notification states
  toasts: Array<{
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    description?: string
    duration?: number
  }>
  
  // Layout preferences
  layout: {
    sidebarCollapsed: boolean
    sidebarWidth: number
    headerHeight: number
  }
  
  // Page states
  pageStates: {
    [pageKey: string]: any
  }
}

interface UIActions {
  // Theme actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  
  // Sidebar actions
  setSidebarOpen: (open: boolean) => void
  setMobileSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  toggleMobileSidebar: () => void
  
  // Modal actions
  openModal: (modalKey: string) => void
  closeModal: (modalKey: string) => void
  toggleModal: (modalKey: string) => void
  
  // Loading actions
  setLoading: (key: string, loading: boolean) => void
  
  // Toast actions
  addToast: (toast: Omit<UIState['toasts'][0], 'id'>) => void
  removeToast: (id: string) => void
  clearToasts: () => void
  
  // Layout actions
  setSidebarCollapsed: (collapsed: boolean) => void
  setSidebarWidth: (width: number) => void
  setHeaderHeight: (height: number) => void
  
  // Page state actions
  setPageState: (pageKey: string, state: any) => void
  clearPageState: (pageKey: string) => void
}

type UIStore = UIState & UIActions

export const useUIStore = create<UIStore>()(
  persist(
    immer((set, get) => ({
      // Initial state
      theme: 'system',
      sidebarOpen: true,
      mobileSidebarOpen: false,
      modals: {},
      loading: {},
      toasts: [],
      layout: {
        sidebarCollapsed: false,
        sidebarWidth: 256,
        headerHeight: 64,
      },
      pageStates: {},

      // Theme actions
      setTheme: (theme: 'light' | 'dark' | 'system') => {
        set((state) => {
          state.theme = theme
        })
      },

      // Sidebar actions
      setSidebarOpen: (open: boolean) => {
        set((state) => {
          state.sidebarOpen = open
        })
      },

      setMobileSidebarOpen: (open: boolean) => {
        set((state) => {
          state.mobileSidebarOpen = open
        })
      },

      toggleSidebar: () => {
        set((state) => {
          state.sidebarOpen = !state.sidebarOpen
        })
      },

      toggleMobileSidebar: () => {
        set((state) => {
          state.mobileSidebarOpen = !state.mobileSidebarOpen
        })
      },

      // Modal actions
      openModal: (modalKey: string) => {
        set((state) => {
          state.modals[modalKey] = true
        })
      },

      closeModal: (modalKey: string) => {
        set((state) => {
          state.modals[modalKey] = false
        })
      },

      toggleModal: (modalKey: string) => {
        set((state) => {
          state.modals[modalKey] = !state.modals[modalKey]
        })
      },

      // Loading actions
      setLoading: (key: string, loading: boolean) => {
        set((state) => {
          state.loading[key] = loading
        })
      },

      // Toast actions
      addToast: (toast) => {
        set((state) => {
          const id = Math.random().toString(36).substr(2, 9)
          state.toasts.push({
            id,
            duration: 5000,
            ...toast,
          })
        })
      },

      removeToast: (id: string) => {
        set((state) => {
          state.toasts = state.toasts.filter((toast) => toast.id !== id)
        })
      },

      clearToasts: () => {
        set((state) => {
          state.toasts = []
        })
      },

      // Layout actions
      setSidebarCollapsed: (collapsed: boolean) => {
        set((state) => {
          state.layout.sidebarCollapsed = collapsed
        })
      },

      setSidebarWidth: (width: number) => {
        set((state) => {
          state.layout.sidebarWidth = width
        })
      },

      setHeaderHeight: (height: number) => {
        set((state) => {
          state.layout.headerHeight = height
        })
      },

      // Page state actions
      setPageState: (pageKey: string, pageState: any) => {
        set((state) => {
          state.pageStates[pageKey] = pageState
        })
      },

      clearPageState: (pageKey: string) => {
        set((state) => {
          delete state.pageStates[pageKey]
        })
      },
    })),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        theme: state.theme,
        layout: state.layout,
        pageStates: state.pageStates,
      }),
    }
  )
)
