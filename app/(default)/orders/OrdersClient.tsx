"use client"

import React, { Suspense } from "react"
import OrdersTable, { type Order as UiOrder } from "./orders-table"
import OrdersSkeleton from "./orders-skeleton"
// Removed image import to avoid broken image on Orders page
import { SelectedItemsProvider } from '@/app/selected-items-context'
import { useLayout } from '@/contexts/LayoutContext'
import { useChat } from '@/contexts/chat-context'

function OrdersList() {
  const [data, setData] = React.useState<any>(null)
  const [loading, setLoading] = React.useState<boolean>(true)
  const [error, setError] = React.useState<string | null>(null)
  const [orders, setOrders] = React.useState<UiOrder[]>([])
  const [nextCursor, setNextCursor] = React.useState<string | null>(null)
  const [loadingMore, setLoadingMore] = React.useState(false)
  const { openSidebar } = useLayout()
  const { addMessage } = useChat()

  const mapOrders = React.useCallback((arr: any[]) => (arr ?? []).map((o: any, idx: number) => ({
    id: idx,
    image: undefined,
    order: `#${o.id.substring(0, 6)}`,
    date: new Date(o.createdAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
    customer: o.user?.name || '—',
    total: `${o.currency} ${(o.totalAmount / 100).toFixed(2)}`,
    status: o.status,
    items: String(o.items?.length ?? 0),
    location: '—',
    type: '—',
    description: '',
  } as UiOrder)), [] )

  React.useEffect(() => {
    fetch('/api/orders?limit=10').then(async (r) => {
      if (!r.ok) throw new Error('Failed to load orders')
      const j = await r.json()
      setData(j)
      setOrders(mapOrders(j.orders))
      setNextCursor(j.nextCursor || null)
    }).catch((e) => setError(e.message)).finally(() => setLoading(false))
  }, [mapOrders])

  const loadMore = async () => {
    if (loadingMore || !nextCursor) return
    setLoadingMore(true)
    try {
      const r = await fetch(`/api/orders?limit=10&cursor=${encodeURIComponent(nextCursor)}`)
      if (!r.ok) throw new Error('Failed to load more orders')
      const j = await r.json()
      setOrders(prev => [...prev, ...mapOrders(j.orders)])
      setNextCursor(j.nextCursor || null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoadingMore(false)
    }
  }

  // Check for recent payment success and send automatic AI message
  React.useEffect(() => {
    const checkPaymentSuccess = () => {
      try {
        const paymentSuccess = sessionStorage.getItem('recentPaymentSuccess')
        if (paymentSuccess) {
          const paymentData = JSON.parse(paymentSuccess)
          const timeDiff = Date.now() - paymentData.timestamp
          
          // Only trigger if payment was within the last 5 minutes
          if (timeDiff < 5 * 60 * 1000) {
            // Open the sidebar to show AI chat
            openSidebar()
            
            // Clear the payment success flag (message already sent from checkout)
            sessionStorage.removeItem('recentPaymentSuccess')
          }
        }
      } catch (error) {
        console.warn('Failed to check payment success:', error)
      }
    }

    // Check immediately and also after a short delay to ensure page is loaded
    checkPaymentSuccess()
    const timeoutId = setTimeout(checkPaymentSuccess, 1000)
    
    return () => clearTimeout(timeoutId)
  }, [openSidebar, addMessage])

  if (loading) return <OrdersSkeleton />
  if (error) return <div className="p-8 text-red-600">{error}</div>

  const hasMore = Boolean(nextCursor)

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
      <div className="sm:flex sm:justify-between sm:items-center mb-8">
        <div className="mb-4 sm:mb-0">
          <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Orders</h1>
          {/* Show success message if recent payment detected */}
          {(() => {
            try {
              const paymentSuccess = sessionStorage.getItem('recentPaymentSuccess')
              if (paymentSuccess) {
                const paymentData = JSON.parse(paymentSuccess)
                const timeDiff = Date.now() - paymentData.timestamp
                if (timeDiff < 5 * 60 * 1000) {
                  return (
                    <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <p className="text-sm text-green-800 dark:text-green-200">
                        🎉 Payment successful! Your order has been processed and will appear in the list below.
                      </p>
                    </div>
                  )
                }
              }
            } catch (error) {
              // Ignore errors
            }
            return null
          })()}
        </div>
      </div>
      <OrdersTable orders={orders} />
      <div className="mt-4">
        <button onClick={loadMore} disabled={loadingMore || !hasMore} className="w-full py-2 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50">
          {loadingMore ? 'Loading…' : hasMore ? 'Load More' : 'No more orders'}
        </button>
      </div>
    </div>
  )
}

export default function OrdersClient() {
  return (
    <SelectedItemsProvider>
      <Suspense fallback={<OrdersSkeleton />}>
        <OrdersList />
      </Suspense>
    </SelectedItemsProvider>
  )
}


