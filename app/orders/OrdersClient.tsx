"use client"

import React, { Suspense } from "react"
import OrdersTable, { type Order as UiOrder } from "@/app/(default)/ecommerce/orders/orders-table"
import Image01 from '@/public/images/icon-01.svg'
import { SelectedItemsProvider } from '@/app/selected-items-context'

function OrdersList() {
  const [data, setData] = React.useState<any>(null)
  const [loading, setLoading] = React.useState<boolean>(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    fetch('/api/orders').then(async (r) => {
      if (!r.ok) throw new Error('Failed to load orders')
      const j = await r.json()
      setData(j)
    }).catch((e) => setError(e.message)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8">Loading orders...</div>
  if (error) return <div className="p-8 text-red-600">{error}</div>

  const orders: UiOrder[] = (data?.orders ?? []).map((o: any, idx: number) => ({
    id: idx,
    image: Image01,
    order: `#${o.id.substring(0, 6)}`,
    date: new Date(o.createdAt).toLocaleDateString(),
    customer: o.user?.name || '—',
    total: `${o.currency} ${o.totalAmount}`,
    status: o.status,
    items: String(o.items?.length ?? 0),
    location: '—',
    type: '—',
    description: '',
  }))

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
      <div className="sm:flex sm:justify-between sm:items-center mb-8">
        <div className="mb-4 sm:mb-0">
          <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Orders</h1>
        </div>
      </div>
      <OrdersTable orders={orders} />
    </div>
  )
}

export default function OrdersClient() {
  return (
    <SelectedItemsProvider>
      <Suspense fallback={<div className="p-8">Loading orders...</div>}>
        <OrdersList />
      </Suspense>
    </SelectedItemsProvider>
  )
}


