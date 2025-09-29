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
        console.log('🛒 DEBUG: addItem called with site:', {
          site: site,
          siteId: site.id,
          siteName: site.name,
          currentItems: get().items,
          currentItemsLength: get().items.length
        })
        
        set((state) => {
          // Check if site already exists
          const existingItem = state.items.find(
            (item) => item.kind === 'site' && item.site?.id === site.id
          )
          
          if (existingItem) {
            // Update quantity if item exists
            existingItem.quantity += 1
            console.log('🛒 DEBUG: Updated existing item quantity:', {
              item: existingItem,
              newQuantity: existingItem.quantity
            })
          } else {
            // Add new item
            const newItem = {
              id: `${site.id}-${Date.now()}`,
              kind: 'site' as const,
              site,
              quantity: 1,
              addedAt: new Date(),
            }
            state.items.push(newItem)
            console.log('🛒 DEBUG: Added new item:', {
              newItem: newItem,
              totalItems: state.items.length
            })
          }
        })
        
        console.log('🛒 DEBUG: After addItem, cart state:', {
          items: get().items,
          itemsLength: get().items.length,
          totalItems: get().getTotalItems(),
          totalPrice: get().getTotalPrice()
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
              kind: 'product' as const,
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
        const total = get().items.reduce((acc, item) => acc + item.quantity, 0)
        console.log('🛒 DEBUG: getTotalItems called:', {
          items: get().items,
          itemsLength: get().items.length,
          total,
          itemsDetails: get().items.map(item => ({
            id: item.id,
            kind: item.kind,
            quantity: item.quantity,
            name: item.kind === 'site' ? item.site?.name : item.product?.name
          }))
        })
        return total
      },

      getTotalPrice: () => {
        const total = get().items.reduce((acc, item) => {
          if (item.kind === 'site' && item.site) {
            return acc + (item.site.publishing.price || 0) * item.quantity
          }
          if (item.kind === 'product' && item.product) {
            return acc + (item.product.priceDollars || 0) * item.quantity
          }
          return acc
        }, 0)
        console.log('🛒 DEBUG: getTotalPrice called:', {
          items: get().items,
          itemsLength: get().items.length,
          total,
          itemsDetails: get().items.map(item => ({
            id: item.id,
            kind: item.kind,
            quantity: item.quantity,
            price: item.kind === 'site' ? (item.site?.publishing?.price || 0) : (item.product?.priceDollars || 0),
            total: item.kind === 'site' ? (item.site?.publishing?.price || 0) * item.quantity : (item.product?.priceDollars || 0) * item.quantity
          }))
        })
        return total
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
      partialize: (state) => {
        console.log('🛒 DEBUG: Cart store partialize called:', {
          items: state.items,
          itemsLength: state.items.length,
          itemsStringified: JSON.stringify(state.items, null, 2)
        })
        return { items: state.items }
      },
      onRehydrateStorage: () => (state) => {
        console.log('🛒 DEBUG: Cart store rehydration completed:', {
          state: state,
          items: state?.items,
          itemsLength: state?.items?.length,
          itemsStringified: JSON.stringify(state?.items, null, 2)
        })
      }
    }
  )
)
