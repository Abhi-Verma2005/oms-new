"use client"

import React, { createContext, useContext, useEffect, useReducer, ReactNode } from 'react'
import type { Site } from '@/lib/sample-sites'
import { useProjectStore } from '@/stores/project-store'

export interface CartProductItemData { id: string; name: string; priceDollars: number }
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

type CartAction =
  | { type: 'ADD_ITEM'; payload: { site: Site } }
  | { type: 'ADD_PRODUCT'; payload: { product: CartProductItemData } }
  | { type: 'REMOVE_ITEM'; payload: { siteId: string } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_OPEN'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOAD_CART'; payload: CartItem[] }

interface CartContextType {
  state: CartState
  addItem: (site: Site) => void
  addProduct: (product: CartProductItemData) => void
  removeItem: (siteId: string) => void
  clearCart: () => void
  toggleCart: () => void
  openCart: () => void
  closeCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
  isItemInCart: (siteId: string) => boolean
}

const initialState: CartState = {
  items: [],
  isOpen: false,
  isLoading: false,
  error: null,
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { site } = action.payload
      if (state.items.some(i => i.kind === 'site' && i.site && i.site.id === site.id)) return state
      return {
        ...state,
        items: [...state.items, { id: `${site.id}-${Date.now()}`, kind: 'site', site, quantity: 1, addedAt: new Date() }],
      }
    }
    case 'ADD_PRODUCT': {
      const { product } = action.payload
      if (state.items.some(i => i.kind === 'product' && i.product && i.product.id === product.id)) return state
      return {
        ...state,
        items: [...state.items, { id: `${product.id}-${Date.now()}`, kind: 'product', product, quantity: 1, addedAt: new Date() }],
      }
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(i => !(i.kind === 'site' && i.site?.id === action.payload.siteId) && !(i.kind === 'product' && i.product?.id === action.payload.siteId)) }
    case 'CLEAR_CART':
      return { ...state, items: [] }
    case 'SET_OPEN':
      return { ...state, isOpen: action.payload }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'LOAD_CART':
      return { ...state, items: action.payload }
    default:
      return state
  }
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState)
  const { selectedProjectId } = useProjectStore()
  const storageKey = `cart:${selectedProjectId || 'default'}`

  // Load cart for the current project on mount and whenever project changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved).map((item: any) => ({ ...item, addedAt: new Date(item.addedAt) }))
        dispatch({ type: 'LOAD_CART', payload: parsed })
      } else {
        dispatch({ type: 'LOAD_CART', payload: [] })
      }
    } catch {
      // noop
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId])

  // Persist cart scoped to current project
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(state.items)) } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.items, selectedProjectId])

  const addItem = (site: Site) => {
    dispatch({ type: 'ADD_ITEM', payload: { site } })
    // Log activity asynchronously
    setTimeout(() => {
      try {
        fetch('/api/activity/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            activity: 'ADD_TO_CART',
            category: 'CART',
            description: `Added ${site.name}`,
            metadata: { siteId: site.id, siteName: site.name, priceCents: site.publishing?.price ?? undefined }
          })
        }).catch(() => {})
        // Notify AI sidebar (if present) to present cart action card immediately
        try { window.dispatchEvent(new Event('AI_CART_ITEM_ADDED')) } catch {}
      } catch {}
    }, 0)
  }
  const addProduct = (product: CartProductItemData) => {
    dispatch({ type: 'ADD_PRODUCT', payload: { product } })
    // Log activity asynchronously
    setTimeout(() => {
      try {
        fetch('/api/activity/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            activity: 'ADD_TO_CART',
            category: 'CART',
            description: `Added ${product.name}`,
            metadata: { productId: product.id, priceDollars: product.priceDollars }
          })
        }).catch(() => {})
      } catch {}
    }, 0)
  }
  const removeItem = (siteId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { siteId } })
    // Log activity asynchronously
    setTimeout(() => {
      try {
        fetch('/api/activity/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            activity: 'REMOVE_FROM_CART',
            category: 'CART',
            description: `Removed ${siteId}`,
            metadata: { siteId }
          })
        }).catch(() => {})
      } catch {}
    }, 0)
  }
  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' })
    // Log activity asynchronously
    setTimeout(() => {
      try {
        fetch('/api/activity/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            activity: 'CLEAR_CART',
            category: 'CART',
            description: 'Cleared cart',
            metadata: { itemCount: state.items.length }
          })
        }).catch(() => {})
      } catch {}
    }, 0)
  }
  const toggleCart = () => dispatch({ type: 'SET_OPEN', payload: !state.isOpen })
  const openCart = () => dispatch({ type: 'SET_OPEN', payload: true })
  const closeCart = () => dispatch({ type: 'SET_OPEN', payload: false })
  const getTotalItems = () => state.items.reduce((acc, it) => acc + it.quantity, 0)
  const getTotalPrice = () => state.items.reduce((acc, it) => {
    if (it.kind === 'site' && it.site) return acc + (it.site.publishing.price || 0) * it.quantity
    if (it.kind === 'product' && it.product) return acc + (it.product.priceDollars || 0) * it.quantity
    return acc
  }, 0)
  const isItemInCart = (siteId: string) => state.items.some(it => (it.kind === 'site' && it.site?.id === siteId) || (it.kind === 'product' && it.product?.id === siteId))

  const value: CartContextType = { state, addItem, addProduct, removeItem, clearCart, toggleCart, openCart, closeCart, getTotalItems, getTotalPrice, isItemInCart }
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within a CartProvider')
  return ctx
}


