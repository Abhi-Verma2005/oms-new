"use client"

import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import type { Site } from '@/lib/sample-sites'

export interface WishlistItemUI {
  siteId: string
  siteName: string
  siteUrl?: string
  priceCents?: number | null
  addedAt: Date
}

interface WishlistState {
  items: WishlistItemUI[]
  isLoading: boolean
  error: string | null
}

type Action =
  | { type: 'LOAD'; payload: WishlistItemUI[] }
  | { type: 'ADD'; payload: WishlistItemUI }
  | { type: 'REMOVE'; payload: { siteId: string } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }

interface WishlistContextType {
  state: WishlistState
  addToWishlist: (site: Site) => Promise<void>
  removeFromWishlist: (siteId: string) => Promise<void>
  isInWishlist: (siteId: string) => boolean
}

const initialState: WishlistState = { items: [], isLoading: false, error: null }

function reducer(state: WishlistState, action: Action): WishlistState {
  switch (action.type) {
    case 'LOAD':
      return { ...state, items: action.payload }
    case 'ADD':
      if (state.items.some(i => i.siteId === action.payload.siteId)) return state
      return { ...state, items: [action.payload, ...state.items] }
    case 'REMOVE':
      return { ...state, items: state.items.filter(i => i.siteId !== action.payload.siteId) }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    default:
      return state
  }
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      dispatch({ type: 'SET_LOADING', payload: true })
      try {
        const res = await fetch('/api/wishlist', { cache: 'no-store' })
        const data = await res.json()
        const items: WishlistItemUI[] = (data.items || []).map((it: any) => ({
          siteId: it.siteId,
          siteName: it.siteName,
          siteUrl: it.siteUrl || undefined,
          priceCents: it.priceCents ?? null,
          addedAt: new Date(it.addedAt),
        }))
        if (!cancelled) dispatch({ type: 'LOAD', payload: items })
      } catch (e: any) {
        if (!cancelled) dispatch({ type: 'SET_ERROR', payload: e?.message || 'Failed to load wishlist' })
      } finally {
        if (!cancelled) dispatch({ type: 'SET_LOADING', payload: false })
      }
    })()
    return () => { cancelled = true }
  }, [])

  const addToWishlist = async (site: Site) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId: site.id, siteName: site.name, siteUrl: site.url, priceCents: site.publishing?.price ?? null }),
      })
      if (!res.ok) throw new Error('Failed to add to wishlist')
      dispatch({ type: 'ADD', payload: { siteId: site.id, siteName: site.name, siteUrl: site.url, priceCents: site.publishing?.price ?? null, addedAt: new Date() } })
    } catch (e: any) {
      dispatch({ type: 'SET_ERROR', payload: e?.message || 'Failed to add to wishlist' })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const removeFromWishlist = async (siteId: string) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const res = await fetch(`/api/wishlist?siteId=${encodeURIComponent(siteId)}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to remove from wishlist')
      dispatch({ type: 'REMOVE', payload: { siteId } })
    } catch (e: any) {
      dispatch({ type: 'SET_ERROR', payload: e?.message || 'Failed to remove from wishlist' })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const isInWishlist = (siteId: string) => state.items.some(i => i.siteId === siteId)

  const value = useMemo(() => ({ state, addToWishlist, removeFromWishlist, isInWishlist }), [state])
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used within a WishlistProvider')
  return ctx
}



