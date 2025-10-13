"use client"

import { useEffect, useState } from 'react'
import { useProjectStore } from '@/stores/project-store'

type Activity = {
  id: string
  activity: string
  category: string
  description?: string | null
  metadata?: any
  createdAt: string
}

export default function ActivityFeed() {
  const { selectedProjectId } = useProjectStore()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)

  useEffect(() => {
    let aborted = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const url = new URL('/api/activity/user', window.location.origin)
        // Focus on project-related categories
        url.searchParams.set('includeCategories', 'CART,PAYMENT,ORDER,NAVIGATION,WISHLIST')
        url.searchParams.set('excludeCategories', 'AUTHENTICATION,ADMIN,API,ERROR,PROFILE')
        url.searchParams.set('limit', '5')
        const res = await fetch(url.toString())
        if (!res.ok) throw new Error('Failed to load activity')
        const data = await res.json()
        if (aborted) return
        setActivities(data?.data ?? [])
        setHasMore(data?.data?.length === 5)
      } catch (e: any) {
        if (aborted) return
        setError(e?.message || 'Failed to load activity')
      } finally {
        if (aborted) return
        setLoading(false)
      }
    }
    load()
    return () => {
      aborted = true
    }
  }, [selectedProjectId])

  const loadMore = async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const url = new URL('/api/activity/user', window.location.origin)
      url.searchParams.set('includeCategories', 'CART,PAYMENT,ORDER,NAVIGATION,WISHLIST')
      url.searchParams.set('excludeCategories', 'AUTHENTICATION,ADMIN,API,ERROR,PROFILE')
      url.searchParams.set('limit', '10')
      if (activities.length > 0) {
        url.searchParams.set('cursor', activities[activities.length - 1].id)
      }
      const res = await fetch(url.toString())
      if (!res.ok) throw new Error('Failed to load more activities')
      const data = await res.json()
      setActivities(prev => [...prev, ...(data?.data ?? [])])
      setHasMore(data?.data?.length === 10)
    } catch (e: any) {
      setError(e?.message || 'Failed to load more activities')
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <>
      <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900">
      {loading ? (
        <div className="p-4 text-sm text-gray-600 dark:text-gray-300">Loading…</div>
      ) : error ? (
        <div className="p-4 text-sm text-red-600">{error}</div>
      ) : activities.length === 0 ? (
        <div className="p-4 text-sm text-gray-600 dark:text-gray-300">
          {selectedProjectId ? 'No activity for this project yet.' : 'Select a project to view its activity history.'}
        </div>
      ) : (
        <>
          <ul className="divide-y divide-gray-200 dark:divide-white/10">
            {activities.map((a) => (
              <li key={a.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors" onClick={() => setSelectedActivity(a)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {renderTitle(a)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {renderSubtitle(a)}
                    </div>
                  </div>
                  <div className="shrink-0 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{a.category}</div>
                </div>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">{new Date(a.createdAt).toLocaleString()}</div>
              </li>
            ))}
          </ul>
          {hasMore && (
            <div className="p-4 border-t border-gray-200 dark:border-white/10">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="w-full py-2 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {loadingMore ? 'Loading...' : 'Show More'}
              </button>
            </div>
          )}
        </>
      )}
      </div>
      
      {/* Activity Detail Modal */}
      {selectedActivity && (
        <div className="fixed inset-0 z-50 bg-black/20 supports-[backdrop-filter]:backdrop-blur-md backdrop-blur-md flex items-center justify-center p-4" onClick={() => setSelectedActivity(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden border border-gray-200 dark:border-white/10 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 dark:border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Activity Details</h3>
                <button
                  onClick={() => setSelectedActivity(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Activity</label>
                  <div className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-1">
                    {renderTitle(selectedActivity)}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</label>
                  <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                    {selectedActivity.description || 'No description'}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Category</label>
                  <div className="text-sm text-gray-900 dark:text-gray-100 mt-1 uppercase tracking-wide">
                    {selectedActivity.category}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Timestamp</label>
                  <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                    {new Date(selectedActivity.createdAt).toLocaleString()}
                  </div>
                </div>
                
                {selectedActivity.metadata && Object.keys(selectedActivity.metadata).length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Details</label>
                    <div className="mt-2 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap overflow-auto">
                        {JSON.stringify(selectedActivity.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function renderTitle(a: Activity) {
  const humanize = (s: string) => s
    .toLowerCase()
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
  switch (a.activity) {
    case 'ADD_TO_WISHLIST':
      return 'Added to wishlist'
    case 'REMOVE_FROM_WISHLIST':
      return 'Removed from wishlist'
    case 'PAYMENT_INITIATED':
      return 'Payment initiated'
    case 'PAYMENT_SUCCESS':
      return 'Payment successful'
    case 'ORDER_CREATED':
      return 'Order placed'
    case 'ADD_TO_CART':
      return 'Added to cart'
    case 'CLEAR_CART':
      return 'Cleared cart'
    case 'APPLY_FILTERS':
      return 'Applied filters'
    case 'SEARCH':
      return 'Search'
    default:
      return humanize(a.activity)
  }
}

function renderSubtitle(a: Activity) {
  const m = a.metadata || {}
  switch (a.activity) {
    case 'PAYMENT_INITIATED': {
      const amount = typeof m.amount === 'number' ? (m.amount / 100).toFixed(2) : undefined
      const currency = typeof m.currency === 'string' ? m.currency.toUpperCase() : 'USD'
      const itemCount = typeof m.itemCount === 'number' ? m.itemCount : undefined
      return amount ? `$${amount} ${currency} • ${itemCount ?? 0} item(s)` : a.description || ''
    }
    case 'PAYMENT_SUCCESS': {
      const amount = typeof m.amount === 'number' ? (m.amount / 100).toFixed(2) : undefined
      const currency = typeof m.currency === 'string' ? m.currency.toUpperCase() : 'USD'
      return amount ? `$${amount} ${currency}` : a.description || ''
    }
    case 'ORDER_CREATED': {
      const total = typeof m.totalAmount === 'number' ? (m.totalAmount / 100).toFixed(2) : undefined
      const currency = typeof m.currency === 'string' ? m.currency.toUpperCase() : 'USD'
      const count = Array.isArray(m.items) ? m.items.length : m.itemCount
      return total ? `$${total} ${currency} • ${count ?? 0} item(s)` : a.description || ''
    }
    case 'ADD_TO_WISHLIST': {
      return m.siteName || a.description || ''
    }
    case 'ADD_TO_CART': {
      return m.siteName || a.description || ''
    }
    case 'REMOVE_FROM_WISHLIST': {
      return m.siteId || a.description || ''
    }
    case 'SEARCH':
      return a.description || ''
    default:
      return a.description || ''
  }
}


