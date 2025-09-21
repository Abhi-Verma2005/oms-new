import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { Site } from '@/lib/sample-sites'

export interface CartProductItemData { 
  id: string
  name: string
  priceDollars: number 
}

export interface CartItem {
  id: string
  kind: 'site' | 'product'
  site?: Site
  product?: CartProductItemData
  quantity: number
  addedAt: Date
}

interface CartState {
  items: CartItem[]
  isOpen: boolean
  isLoading: boolean
  error: string | null
}

interface CartActions {
  addItem: (site: Site) => void
  addProduct: (product: CartProductItemData) => void
  removeItem: (siteId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  toggleCart: () => void
  openCart: () => void
  closeCart: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  getTotalItems: () => number
  getTotalPrice: () => number
  isItemInCart: (siteId: string) => boolean
}

type CartStore = CartState & CartActions

export const useCartStore = create<CartStore>()(
  persist(
    immer((set, get) => ({
      // Initial state
      items: [],
      isOpen: false,
      isLoading: false,
      error: null,

      // Actions
      addItem: (site: Site) => {
        set((state) => {
          // Check if site already exists
          const existingItem = state.items.find(
            (item) => item.kind === 'site' && item.site?.id === site.id
          )
          
          if (existingItem) {
            // Update quantity if item exists
            existingItem.quantity += 1
          } else {
            // Add new item
            state.items.push({
              id: `${site.id}-${Date.now()}`,
              kind: 'site',
              site,
              quantity: 1,
              addedAt: new Date(),
            })
          }
        })
      },

      addProduct: (product: CartProductItemData) => {
        set((state) => {
          // Check if product already exists
          const existingItem = state.items.find(
            (item) => item.kind === 'product' && item.product?.id === product.id
          )
          
          if (existingItem) {
            // Update quantity if item exists
            existingItem.quantity += 1
          } else {
            // Add new item
            state.items.push({
              id: `${product.id}-${Date.now()}`,
              kind: 'product',
              product,
              quantity: 1,
              addedAt: new Date(),
            })
          }
        })
      },

      removeItem: (siteId: string) => {
        set((state) => {
          state.items = state.items.filter(
            (item) =>
              !(item.kind === 'site' && item.site?.id === siteId) &&
              !(item.kind === 'product' && item.product?.id === siteId)
          )
        })
      },

      updateQuantity: (itemId: string, quantity: number) => {
        set((state) => {
          const item = state.items.find((item) => item.id === itemId)
          if (item) {
            if (quantity <= 0) {
              // Remove item if quantity is 0 or negative
              state.items = state.items.filter((item) => item.id !== itemId)
            } else {
              item.quantity = quantity
            }
          }
        })
      },

      clearCart: () => {
        set((state) => {
          state.items = []
        })
      },

      toggleCart: () => {
        set((state) => {
          state.isOpen = !state.isOpen
        })
      },

      openCart: () => {
        set((state) => {
          state.isOpen = true
        })
      },

      closeCart: () => {
        set((state) => {
          state.isOpen = false
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

      getTotalItems: () => {
        return get().items.reduce((acc, item) => acc + item.quantity, 0)
      },

      getTotalPrice: () => {
        return get().items.reduce((acc, item) => {
          if (item.kind === 'site' && item.site) {
            return acc + (item.site.publishing.price || 0) * item.quantity
          }
          if (item.kind === 'product' && item.product) {
            return acc + (item.product.priceDollars || 0) * item.quantity
          }
          return acc
        }, 0)
      },

      isItemInCart: (siteId: string) => {
        return get().items.some(
          (item) =>
            (item.kind === 'site' && item.site?.id === siteId) ||
            (item.kind === 'product' && item.product?.id === siteId)
        )
      },
    })),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
)
