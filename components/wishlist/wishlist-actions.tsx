"use client"

import { useProjectStore } from '@/stores/project-store'

export function useWishlistAPI() {
  const { selectedProjectId } = useProjectStore()

  const add = async (payload: { siteId: string; siteName: string; siteUrl?: string; priceCents?: number; notes?: string }) => {
    const res = await fetch('/api/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, projectId: selectedProjectId ?? undefined }),
    })
    if (!res.ok) throw new Error('Failed to add to wishlist')
    return res.json()
  }

  const remove = async (siteId: string) => {
    const url = new URL('/api/wishlist', window.location.origin)
    url.searchParams.set('siteId', siteId)
    if (selectedProjectId) url.searchParams.set('projectId', selectedProjectId)
    const res = await fetch(url.toString(), { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to remove from wishlist')
    return res.json()
  }

  return { add, remove, projectId: selectedProjectId }
}


