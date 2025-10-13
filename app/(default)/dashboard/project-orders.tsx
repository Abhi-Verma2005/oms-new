'use client'

import { useEffect, useMemo, useState } from 'react'
import { useProjectStore } from '@/stores/project-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Calendar, Package, DollarSign, Eye } from 'lucide-react'

interface OrderItem {
  id: string
  quantity: number
  priceCents: number
  siteId: string
  siteName: string
  withContent: boolean
}

interface Transaction {
  id: string
  status: string
  amount: number
  currency: string
  createdAt: string
}

interface Order {
  id: string
  status: 'PAID' | 'FAILED' | 'CANCELLED' | 'PENDING'
  totalAmount: number
  currency: string
  createdAt: string
  items: OrderItem[]
  transactions: Transaction[]
}

export default function ProjectOrders() {
  const { selectedProject, selectedProjectId } = useProjectStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [openOrder, setOpenOrder] = useState<Order | null>(null)

  useEffect(() => {
    if (!selectedProjectId) {
      setOrders([])
      return
    }
    let active = true
    setLoading(true)
    fetch(`/api/orders?projectId=${encodeURIComponent(selectedProjectId)}`)
      .then((r) => r.json())
      .then((j) => {
        if (!active) return
        setOrders(j.orders || [])
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [selectedProjectId])

  const formatCurrency = (amount: number, currency: string = 'USD') =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount / 100)

  const statusBadge = (status: Order['status']) => {
    switch (status) {
      case 'PAID':
        return <Badge className="bg-green-100 text-green-800">PAID</Badge>
      case 'FAILED':
        return <Badge variant="destructive">FAILED</Badge>
      case 'CANCELLED':
        return <Badge variant="outline">CANCELLED</Badge>
      default:
        return <Badge variant="secondary">PENDING</Badge>
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl text-gray-800 dark:text-gray-100 font-semibold">Project Orders</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {selectedProject ? `Orders for ${selectedProject.name}` : 'Select a project to view its orders'}
          </p>
        </div>
      </div>

      {!selectedProjectId ? (
        <Card>
          <CardContent className="p-6 text-sm text-gray-600 dark:text-gray-300">
            Choose a project to see related orders.
          </CardContent>
        </Card>
      ) : loading ? (
        <Card>
          <CardContent className="p-6">Loading orders…</CardContent>
        </Card>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-gray-600 dark:text-gray-300">
            No orders yet for this project.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {orders.map((o) => (
            <Card key={o.id} className="hover:shadow-md transition">
              <CardHeader className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
                <CardTitle className="text-base">Order #{o.id.substring(0, 6)}</CardTitle>
                {statusBadge(o.status)}
              </CardHeader>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <Calendar className="w-4 h-4" />
                  {new Date(o.createdAt).toLocaleString()}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <Package className="w-4 h-4" />
                  {o.items.reduce((s, it) => s + it.quantity, 0)} items
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100 font-medium">
                  <DollarSign className="w-4 h-4" />
                  {formatCurrency(o.totalAmount, o.currency)}
                </div>
                <div className="pt-2">
                  <Button size="sm" variant="outline" onClick={() => setOpenOrder(o)}>
                    <Eye className="w-4 h-4 mr-2" /> View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!openOrder} onOpenChange={(v) => !v && setOpenOrder(null)}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          {openOrder && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle>Order #{openOrder.id.substring(0, 6)}</DialogTitle>
              </DialogHeader>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Status</span>
                  {statusBadge(openOrder.status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Total</span>
                  <span className="font-medium">{formatCurrency(openOrder.totalAmount, openOrder.currency)}</span>
                </div>
                <div className="pt-2">
                  <div className="text-sm font-medium mb-2">Items</div>
                  <div className="space-y-2">
                    {openOrder.items.map((it) => (
                      <div key={it.id} className="flex items-center justify-between text-sm">
                        <div>
                          <div className="font-medium">{it.siteName}</div>
                          <div className="text-gray-500">{it.withContent ? 'With Content' : 'Without Content'}</div>
                        </div>
                        <div className="text-right">
                          <div>{it.quantity}x</div>
                          <div className="text-gray-500">{formatCurrency(it.priceCents, openOrder.currency)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {openOrder.transactions?.length > 0 && (
                  <div className="pt-2">
                    <div className="text-sm font-medium mb-2">Payments</div>
                    <div className="space-y-2 text-sm">
                      {openOrder.transactions.map((t) => (
                        <div key={t.id} className="flex items-center justify-between">
                          <span className="text-gray-500">{new Date(t.createdAt).toLocaleString()}</span>
                          <span className="font-medium">{formatCurrency(t.amount, t.currency)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}


