"use client"

import React, { useEffect, useState, Suspense } from "react"
import { CalendarProvider } from './calendar-context'
import CalendarNavigation from './calendar-navigation'
import CalendarTable, { Event } from './calendar-table'
import CalendarTitle from './title'
import CalendarSkeleton from './calendar-skeleton'

export default function CalendarClient() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/orders')
      .then(async (response) => {
        if (!response.ok) throw new Error('Failed to load orders')
        const data = await response.json()
        setOrders(data.orders || [])
      })
      .catch((error) => setError(error.message))
      .finally(() => setLoading(false))
  }, [])

  // Convert orders to calendar events
  const getOrderEvents = (): Event[] => {
    return orders.map((order) => {
      const orderDate = new Date(order.createdAt)
      
      // Determine color based on order status
      let eventColor = 'sky' // default
      switch (order.status) {
        case 'PAID':
          eventColor = 'green'
          break
        case 'FAILED':
          eventColor = 'red'
          break
        case 'CANCELLED':
          eventColor = 'yellow'
          break
        case 'PENDING':
          eventColor = 'indigo'
          break
        default:
          eventColor = 'sky'
      }

      // Create a more informative event name
      const itemCount = order.items?.length || 0
      const statusIcon = order.status === 'PAID' ? '✅' : 
                        order.status === 'FAILED' ? '❌' : 
                        order.status === 'CANCELLED' ? '🚫' : '⏳'
      
      return {
        eventStart: orderDate,
        eventEnd: null, // Orders are point-in-time events
        eventName: `${statusIcon} Order #${order.id.substring(0, 6)} - ${order.currency} ${(order.totalAmount / 100).toFixed(2)} (${itemCount} items)`,
        eventColor: eventColor
      }
    })
  }

  // Get only order events from database
  const allEvents = getOrderEvents()

  if (loading) {
    return <CalendarSkeleton />
  }

  if (error) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">Error loading orders: {error}</div>
        </div>
      </div>
    )
  }

  return (
    <CalendarProvider>
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">

        {/* Page header */}
        <div className="sm:flex sm:justify-between sm:items-center mb-4">

          {/* Left: Title */}
          <CalendarTitle />

          {/* Right: Actions */}
          <div className="grid grid-flow-col sm:auto-cols-max justify-start sm:justify-end gap-2">

            <CalendarNavigation />

            <hr className="w-px h-full bg-gray-200 dark:bg-gray-700/60 border-none mx-1" />

            {/* View orders button */}
            <button 
              onClick={() => window.location.href = '/orders'}
              className="btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white"
            >
              View All Orders
            </button>

          </div>

        </div>

        {/* Order Statistics */}
        {orders.length > 0 && (
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Paid Orders</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {orders.filter(o => o.status === 'PAID').length}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                  <div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Failed Orders</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {orders.filter(o => o.status === 'FAILED').length}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                  <div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Cancelled Orders</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {orders.filter(o => o.status === 'CANCELLED').length}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></div>
                  <div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Orders</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {orders.filter(o => o.status === 'PENDING').length}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and view buttons */}
        <div className="sm:flex sm:justify-between sm:items-center mb-4">

          {/* Filters  */}
          <div className="mb-4 sm:mb-0 mr-2">
            <ul className="flex flex-wrap items-center -m-1">
              <li className="m-1">
                <button className="btn-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-500 dark:text-gray-400">
                  <div className="w-1 h-3.5 bg-green-500 shrink-0"></div>
                  <span className="ml-1.5">Paid Orders</span>
                </button>
              </li>
              <li className="m-1">
                <button className="btn-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-500 dark:text-gray-400">
                  <div className="w-1 h-3.5 bg-red-500 shrink-0"></div>
                  <span className="ml-1.5">Failed Orders</span>
                </button>
              </li>
              <li className="m-1">
                <button className="btn-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-500 dark:text-gray-400">
                  <div className="w-1 h-3.5 bg-yellow-500 shrink-0"></div>
                  <span className="ml-1.5">Cancelled Orders</span>
                </button>
              </li>
              <li className="m-1">
                <button className="btn-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-500 dark:text-gray-400">
                  <div className="w-1 h-3.5 bg-indigo-500 shrink-0"></div>
                  <span className="ml-1.5">Pending Orders</span>
                </button>
              </li>
              <li className="m-1">
                <button className="btn-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-violet-500">All Orders</button>
              </li>
            </ul>
          </div>

          {/* View buttons (requires custom integration) */}
          <div className="flex flex-nowrap -space-x-px">
            <button className="btn bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700/60 text-violet-500 rounded-none first:rounded-l-lg last:rounded-r-lg">Month</button>
            <button className="btn bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-600 dark:text-gray-300 rounded-none first:rounded-l-lg last:rounded-r-lg">Week</button>
            <button className="btn bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-600 dark:text-gray-300 rounded-none first:rounded-l-lg last:rounded-r-lg">Day</button>
          </div>
        </div>

        <CalendarTable events={allEvents} />

      </div>
    </CalendarProvider>
  )
}
