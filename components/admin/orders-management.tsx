'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  ShoppingCart, 
  Search, 
  Filter, 
  Save, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  Tag as TagIcon,
  User,
  Calendar,
  DollarSign,
  Package,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  MoreHorizontal,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'
import { useAdminFilters } from '@/hooks/use-admin-filters'

interface Tag {
  id: string
  name: string
  color: string
}

interface User {
  id: string
  name: string
  email: string
  userTags: Array<{
    tag: Tag
  }>
}

interface OrderItem {
  id: string
  quantity: number
  priceCents: number
  siteName: string
  withContent: boolean
}

interface Transaction {
  id: string
  status: string
  amount: number
  provider?: string
}

interface OrderTag {
  tag: Tag
  assignedBy: {
    name: string
    email: string
  }
  assignedAt: string
}

interface Order {
  id: string
  status: string
  totalAmount: number
  currency: string
  createdAt: string
  user: User
  items: OrderItem[]
  transactions: Transaction[]
  orderTags: OrderTag[]
}

interface OrderFilter {
  id: string
  name: string
  filters: any
  isPublic: boolean
  user: {
    name: string
    email: string
  }
}

interface Pagination {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PAID', label: 'Paid' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'CANCELLED', label: 'Cancelled' }
]

const paymentStatusOptions = [
  { value: 'all', label: 'All Payments' },
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Payment Pending' },
  { value: 'failed', label: 'Payment Failed' }
]

const sortOptions = [
  { value: 'createdAt-desc', label: 'Newest First' },
  { value: 'createdAt-asc', label: 'Oldest First' },
  { value: 'totalAmount-desc', label: 'Amount: High to Low' },
  { value: 'totalAmount-asc', label: 'Amount: Low to High' },
  { value: 'user-asc', label: 'Customer: A to Z' },
  { value: 'user-desc', label: 'Customer: Z to A' }
]

export function OrdersManagement() {
  const router = useRouter()
  const [tags, setTags] = useState<Tag[]>([])
  const [savedFilters, setSavedFilters] = useState<OrderFilter[]>([])
  
  // Use standardized filtering
  const {
    data: orders,
    loading,
    pagination,
    filters,
    updateFilters,
    handlePageChange,
    resetFilters,
    toggleTag,
    setSearch,
    setStatus,
    setPaymentStatus,
    setSorting
  } = useAdminFilters('/api/admin/orders', {
    searchPlaceholder: 'Search orders, customers, or order IDs...',
    statusOptions: [
      { value: 'all', label: 'All Statuses' },
      { value: 'pending', label: 'Pending' },
      { value: 'processing', label: 'Processing' },
      { value: 'shipped', label: 'Shipped' },
      { value: 'delivered', label: 'Delivered' },
      { value: 'cancelled', label: 'Cancelled' }
    ],
    paymentStatusOptions: [
      { value: 'all', label: 'All Payments' },
      { value: 'pending', label: 'Pending' },
      { value: 'paid', label: 'Paid' },
      { value: 'failed', label: 'Failed' },
      { value: 'refunded', label: 'Refunded' }
    ],
    sortOptions: [
      { value: 'createdAt-desc', label: 'Newest First' },
      { value: 'createdAt-asc', label: 'Oldest First' },
      { value: 'total-desc', label: 'Highest Total' },
      { value: 'total-asc', label: 'Lowest Total' },
      { value: 'user-asc', label: 'Customer A-Z' },
      { value: 'user-desc', label: 'Customer Z-A' }
    ],
    enableDateRange: true,
    enableTags: true,
    defaultSort: 'createdAt-desc',
    defaultLimit: 20
  });
  
  // Saved filters
  const [isSaveFilterOpen, setIsSaveFilterOpen] = useState(false)
  const [filterName, setFilterName] = useState('')
  const [isPublicFilter, setIsPublicFilter] = useState(false)
  const [applyingFilterId, setApplyingFilterId] = useState('')

  const currentPage = pagination?.page || 1


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

  const fetchSavedFilters = async () => {
    try {
      const response = await fetch('/api/admin/order-filters')
      if (!response.ok) throw new Error('Failed to fetch saved filters')
      const data = await response.json()
      setSavedFilters(data.filters || [])
    } catch (error) {
      console.error('Error fetching saved filters:', error)
    }
  }

  useEffect(() => {
    fetchTags()
    fetchSavedFilters()
  }, [])

  const handleSaveFilter = async () => {
    if (!filterName.trim()) {
      toast.error('Filter name is required')
      return
    }

    try {
      const response = await fetch('/api/admin/order-filters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: filterName.trim(),
          filters: {
            search: filters.search,
            status: filters.status,
            paymentStatus: filters.paymentStatus,
            tagIds: filters.tagIds,
            dateFrom: filters.dateFrom,
            dateTo: filters.dateTo,
            sortBy: filters.sortBy,
            sortOrder: filters.sortOrder
          },
          isPublic: isPublicFilter
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save filter')
      }

      toast.success('Filter saved successfully')
      setIsSaveFilterOpen(false)
      setFilterName('')
      setIsPublicFilter(false)
      fetchSavedFilters()
    } catch (error: any) {
      console.error('Error saving filter:', error)
      toast.error(error.message || 'Failed to save filter')
    }
  }

  const handleApplyFilter = (filter: OrderFilter) => {
    setApplyingFilterId(filter.id)
    const filterData = filter.filters
    
    // Update filters using the standardized system
    updateFilters({
      search: filterData.search || '',
      status: filterData.status || 'all',
      paymentStatus: filterData.paymentStatus || 'all',
      tagIds: filterData.tagIds ? filterData.tagIds.split(',') : [],
      sortBy: filterData.sortBy || 'createdAt',
      sortOrder: filterData.sortOrder || 'desc'
    }, true) // Apply immediately
    
    setTimeout(() => setApplyingFilterId(''), 1000)
  }

  const handleDeleteFilter = async (filterId: string) => {
    if (!confirm('Are you sure you want to delete this saved filter?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/order-filters/${filterId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete filter')
      }

      toast.success('Filter deleted successfully')
      fetchSavedFilters()
    } catch (error: any) {
      console.error('Error deleting filter:', error)
      toast.error(error.message || 'Failed to delete filter')
    }
  }


  const getPaymentStatusBadge = (order: Order) => {
    const latestTransaction = order.transactions[0]
    if (latestTransaction?.status === 'SUCCESS') {
      return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Paid</Badge>
    } else if (latestTransaction?.status === 'FAILED') {
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Payment Failed</Badge>
    } else {
      return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Payment Pending</Badge>
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

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount / 100)
  }

  const totalItems = (order: Order) => {
    return order.items.reduce((sum, item) => sum + item.quantity, 0)
  }

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Order Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage and filter customer orders with tags</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
        <CardHeader className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
          <CardTitle className="flex items-center font-semibold text-gray-800 dark:text-gray-100">
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          {/* Search and Quick Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search orders, customers, or order IDs..."
                  value={filters.search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filters.status} onValueChange={setStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.paymentStatus} onValueChange={setPaymentStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
            <Select value={`${filters.sortBy}-${filters.sortOrder}`} onValueChange={(value) => {
              const [sortBy, sortOrder] = value.split('-');
              setSorting(sortBy, sortOrder);
            }}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt-desc">Newest First</SelectItem>
                <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                <SelectItem value="total-desc">Highest Total</SelectItem>
                <SelectItem value="total-asc">Lowest Total</SelectItem>
                <SelectItem value="user-asc">Customer A-Z</SelectItem>
                <SelectItem value="user-desc">Customer Z-A</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tag Filters */}
          {tags.length > 0 && (
            <div className="space-y-2">
              <Label>Filter by Tags:</Label>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm border transition-colors ${
                      filters.tagIds.includes(tag.id)
                        ? 'bg-violet-100 border-violet-300 text-violet-800 dark:bg-violet-900/20 dark:border-violet-700 dark:text-violet-300'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 dark:bg-gray-900/20 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800/20'
                    }`}
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span>{tag.name}</span>
                    {filters.tagIds.includes(tag.id) && (
                      <X className="w-3 h-3" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Saved Filters */}
          <div className="flex items-center space-x-4 pt-4">
            <div className="flex items-center space-x-2">
              <Select 
                value={applyingFilterId || ''} 
                onValueChange={(value) => {
                  if (value === '') return
                  const filter = savedFilters.find(f => f.id === value)
                  if (filter) handleApplyFilter(filter)
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Apply saved filter" />
                </SelectTrigger>
                <SelectContent>
                  {savedFilters.map(filter => (
                    <SelectItem key={filter.id} value={filter.id}>
                      {filter.name} {filter.isPublic && '(Public)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Dialog open={isSaveFilterOpen} onOpenChange={setIsSaveFilterOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Save className="w-4 h-4 mr-2" />
                  Save Current Filter
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save Filter</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="filterName">Filter Name</Label>
                    <Input
                      id="filterName"
                      value={filterName}
                      onChange={(e) => setFilterName(e.target.value)}
                      placeholder="Enter filter name"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isPublic"
                      checked={isPublicFilter}
                      onCheckedChange={(checked) => setIsPublicFilter(!!checked)}
                    />
                    <Label htmlFor="isPublic">Make this filter public (visible to other admins)</Label>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsSaveFilterOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveFilter} className="bg-violet-600 hover:bg-violet-700">
                      Save Filter
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
        <CardHeader className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
          <CardTitle className="flex items-center justify-between font-semibold text-gray-800 dark:text-gray-100">
            <div className="flex items-center">
              <ShoppingCart className="w-5 h-5 mr-2" />
              Orders ({pagination?.totalCount || 0})
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div className="font-mono text-sm">{order.id}</div>
                      {getStatusBadge(order.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div 
                        className="cursor-pointer hover:underline text-blue-600 hover:text-blue-800"
                        onClick={() => router.push(`/admin/orders/${order.id}`)}
                      >
                        <div className="font-medium">{order.user.name || 'Unknown'}</div>
                        <div className="text-sm text-gray-500">{order.user.email}</div>
                      </div>
                      {order.user.userTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {order.user.userTags.slice(0, 2).map((userTag) => (
                            <div
                              key={userTag.tag.id}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs"
                              style={{ 
                                backgroundColor: `${userTag.tag.color}20`,
                                color: userTag.tag.color,
                                border: `1px solid ${userTag.tag.color}40`
                              }}
                            >
                              {userTag.tag.name}
                            </div>
                          ))}
                          {order.user.userTags.length > 2 && (
                            <div className="text-xs text-gray-400">
                              +{order.user.userTags.length - 2} more
                            </div>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1 font-medium">
                        <DollarSign className="w-4 h-4" />
                        <span>{formatCurrency(order.totalAmount, order.currency)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getPaymentStatusBadge(order)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1 text-sm">
                        <Package className="w-4 h-4" />
                        <span>{totalItems(order)} items</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {order.orderTags.slice(0, 3).map((orderTag) => (
                          <div
                            key={orderTag.tag.id}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs"
                            style={{ 
                              backgroundColor: `${orderTag.tag.color}20`,
                              color: orderTag.tag.color,
                              border: `1px solid ${orderTag.tag.color}40`
                            }}
                          >
                            {orderTag.tag.name}
                          </div>
                        ))}
                        {order.orderTags.length > 3 && (
                          <div className="text-xs text-gray-400">
                            +{order.orderTags.length - 3} more
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/orders/${order.id}`)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {orders.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              No orders found matching your criteria
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-500">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of {pagination.totalCount} orders
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <span className="text-sm text-gray-500">
                  Page {currentPage} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
