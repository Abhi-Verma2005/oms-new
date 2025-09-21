'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { 
  ArrowLeft, 
  User, 
  ShoppingCart, 
  CreditCard, 
  Tag as TagIcon, 
  Plus,
  Calendar,
  DollarSign,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  X,
  Edit,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'

interface Tag {
  id: string
  name: string
  color: string
}

interface User {
  id: string
  name: string
  email: string
  createdAt: string
  userTags: Array<{
    tag: Tag
    assignedAt: string
    notes?: string
  }>
}

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
  provider?: string
  reference?: string
  createdAt: string
}

interface OrderTag {
  id: string
  tag: Tag
  assignedBy: {
    name: string
    email: string
  }
  assignedAt: string
  notes?: string
}

interface Order {
  id: string
  status: string
  totalAmount: number
  currency: string
  createdAt: string
  updatedAt: string
  user: User
  items: OrderItem[]
  transactions: Transaction[]
  orderTags: OrderTag[]
}

export function OrderDetail() {
  const router = useRouter()
  const params = useParams()
  const orderId = params?.id as string

  const [order, setOrder] = useState<Order | null>(null)
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddTagOpen, setIsAddTagOpen] = useState(false)
  const [selectedTagId, setSelectedTagId] = useState('')
  const [tagNotes, setTagNotes] = useState('')

  const fetchOrder = async () => {
    if (!orderId) return

    try {
      const response = await fetch(`/api/admin/orders/${orderId}`)
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Order not found')
          router.push('/admin/orders')
          return
        }
        throw new Error('Failed to fetch order')
      }
      
      const data = await response.json()
      setOrder(data.order)
    } catch (error) {
      console.error('Error fetching order:', error)
      toast.error('Failed to fetch order')
      router.push('/admin/orders')
    } finally {
      setLoading(false)
    }
  }

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/admin/tags')
      if (!response.ok) throw new Error('Failed to fetch tags')
      const data = await response.json()
      setTags(data.tags || [])
    } catch (error) {
      console.error('Error fetching tags:', error)
    }
  }

  useEffect(() => {
    fetchOrder()
    fetchTags()
  }, [orderId])

  const handleAddTag = async () => {
    if (!selectedTagId || !order) {
      toast.error('Please select a tag')
      return
    }

    // Check if tag is already assigned
    const existingTag = order.orderTags.find(ot => ot.tag.id === selectedTagId)
    if (existingTag) {
      toast.error('This tag is already assigned to the order')
      return
    }

    try {
      const response = await fetch(`/api/admin/orders/${orderId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tagId: selectedTagId,
          notes: tagNotes
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add tag')
      }

      toast.success('Tag added successfully')
      setIsAddTagOpen(false)
      setSelectedTagId('')
      setTagNotes('')
      fetchOrder()
    } catch (error: any) {
      console.error('Error adding tag:', error)
      toast.error(error.message || 'Failed to add tag')
    }
  }

  const handleRemoveTag = async (tagId: string) => {
    if (!order) return

    if (!confirm('Are you sure you want to remove this tag from the order?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/orders/${orderId}/tags/${tagId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to remove tag')
      }

      toast.success('Tag removed successfully')
      fetchOrder()
    } catch (error: any) {
      console.error('Error removing tag:', error)
      toast.error(error.message || 'Failed to remove tag')
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; className: string; icon: any }> = {
      PENDING: { variant: 'secondary', className: '', icon: <Clock className="w-3 h-3 mr-1" /> },
      PAID: { variant: 'default', className: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-3 h-3 mr-1" /> },
      FAILED: { variant: 'destructive', className: '', icon: <XCircle className="w-3 h-3 mr-1" /> },
      CANCELLED: { variant: 'outline', className: '', icon: <X className="w-3 h-3 mr-1" /> }
    }
    
    const config = variants[status] || variants.PENDING
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.icon}{status}
      </Badge>
    )
  }

  const getPaymentStatusBadge = (transaction: Transaction) => {
    if (transaction.status === 'SUCCESS') {
      return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Paid</Badge>
    } else if (transaction.status === 'FAILED') {
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>
    } else {
      return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
    }
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount / 100)
  }

  const availableTags = tags.filter(tag => 
    !order?.orderTags.some(ot => ot.tag.id === tag.id)
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Order not found</p>
        <Button onClick={() => router.push('/admin/orders')} className="mt-4">
          Back to Orders
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/admin/orders')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Order {order.id}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Created on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusBadge(order.status)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Information */}
        <div className="lg:col-span-1">
          <Card className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
            <CardHeader className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
              <CardTitle className="flex items-center font-semibold text-gray-800 dark:text-gray-100">
                <User className="w-5 h-5 mr-2" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Name</Label>
                <p className="text-lg font-medium">{order.user.name || 'Unknown'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Email</Label>
                <p className="text-sm">{order.user.email}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Member Since</Label>
                <p className="text-sm">{new Date(order.user.createdAt).toLocaleDateString()}</p>
              </div>
              
              {order.user.userTags.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">User Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {order.user.userTags.map((userTag) => (
                      <div
                        key={userTag.tag.id}
                        className="inline-flex items-center px-2 py-1 rounded text-xs"
                        style={{ 
                          backgroundColor: `${userTag.tag.color}20`,
                          color: userTag.tag.color,
                          border: `1px solid ${userTag.tag.color}40`
                        }}
                      >
                        {userTag.tag.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Tags */}
          <Card className="mt-6 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
            <CardHeader className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center font-semibold text-gray-800 dark:text-gray-100">
                  <TagIcon className="w-5 h-5 mr-2" />
                  Order Tags
                </CardTitle>
                <Dialog open={isAddTagOpen} onOpenChange={setIsAddTagOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-violet-600 hover:bg-violet-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Tag
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Tag to Order</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="tagSelect">Select Tag</Label>
                        <Select value={selectedTagId} onValueChange={setSelectedTagId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a tag" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableTags.map(tag => (
                              <SelectItem key={tag.id} value={tag.id}>
                                <div className="flex items-center space-x-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: tag.color }}
                                  />
                                  <span>{tag.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="tagNotes">Notes (Optional)</Label>
                        <Textarea
                          id="tagNotes"
                          value={tagNotes}
                          onChange={(e) => setTagNotes(e.target.value)}
                          placeholder="Add notes about this tag assignment..."
                          rows={3}
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setIsAddTagOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddTag} className="bg-violet-600 hover:bg-violet-700">
                          Add Tag
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              {order.orderTags.length > 0 ? (
                <div className="space-y-3">
                  {order.orderTags.map((orderTag) => (
                    <div
                      key={orderTag.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700/60 bg-gray-50 dark:bg-gray-900/20"
                      style={{ borderColor: `${orderTag.tag.color}40` }}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: orderTag.tag.color }}
                        />
                        <div>
                          <div className="font-medium">{orderTag.tag.name}</div>
                          <div className="text-sm text-gray-500">
                            Added by {orderTag.assignedBy.name} on {new Date(orderTag.assignedAt).toLocaleDateString()}
                          </div>
                          {orderTag.notes && (
                            <div className="text-sm text-gray-600 mt-1">{orderTag.notes}</div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveTag(orderTag.tag.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No tags assigned to this order</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Summary */}
          <Card className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
            <CardHeader className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
              <CardTitle className="flex items-center font-semibold text-gray-800 dark:text-gray-100">
                <ShoppingCart className="w-5 h-5 mr-2" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Order Total</Label>
                  <p className="text-2xl font-bold flex items-center">
                    <DollarSign className="w-6 h-6 mr-1" />
                    {formatCurrency(order.totalAmount, order.currency)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Items</Label>
                  <p className="text-2xl font-bold flex items-center">
                    <Package className="w-6 h-6 mr-1" />
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <Label className="text-sm font-medium text-gray-500 mb-3 block">Order Items</Label>
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700/60 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                      <div>
                        <div className="font-medium">{item.siteName}</div>
                        <div className="text-sm text-gray-500">
                          {item.withContent ? 'With Content' : 'Without Content'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{item.quantity}x</div>
                        <div className="text-sm text-gray-500">
                          {formatCurrency(item.priceCents, order.currency)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
            <CardHeader className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
              <CardTitle className="flex items-center font-semibold text-gray-800 dark:text-gray-100">
                <CreditCard className="w-5 h-5 mr-2" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              {order.transactions.length > 0 ? (
                <div className="space-y-4">
                  {order.transactions.map((transaction) => (
                    <div key={transaction.id} className="p-4 border border-gray-200 dark:border-gray-700/60 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getPaymentStatusBadge(transaction)}
                          <span className="text-sm text-gray-500">
                            {new Date(transaction.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="font-medium">
                          {formatCurrency(transaction.amount, transaction.currency)}
                        </div>
                      </div>
                      {transaction.provider && (
                        <div className="text-sm text-gray-500">
                          Provider: {transaction.provider}
                        </div>
                      )}
                      {transaction.reference && (
                        <div className="text-sm text-gray-500">
                          Reference: {transaction.reference}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No payment transactions found</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
