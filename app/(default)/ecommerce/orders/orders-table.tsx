'use client'

import { StaticImageData } from 'next/image'
import { useItemSelection } from '@/components/utils/use-item-selection'
import OrdersTableItem from './orders-table-item'
import { useMemo, useState } from 'react'

export interface Order {
  id: number
  image: StaticImageData
  order: string
  date: string
  customer: string
  total: string
  status: string
  items: string
  location: string
  type: string
  description: string  
}

export default function OrdersTable({ orders }: { orders: Order[]}) {
  const {
    selectedItems,
    isAllSelected,
    handleCheckboxChange,
    handleSelectAllChange,
  } = useItemSelection(orders)  

  // Column visibility controller (mirrors OMS behavior at a high level)
  type ColumnKey = 'order' | 'date' | 'customer' | 'total' | 'status' | 'items' | 'location' | 'type'

  const columnDefs: { key: ColumnKey; label: string }[] = [
    { key: 'order', label: 'Order' },
    { key: 'date', label: 'Date' },
    { key: 'customer', label: 'Customer' },
    { key: 'total', label: 'Total' },
    { key: 'status', label: 'Status' },
    { key: 'items', label: 'Items' },
    { key: 'location', label: 'Location' },
    { key: 'type', label: 'Payment type' },
  ]

  const allKeys = useMemo(() => columnDefs.map(c => c.key), [])
  const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(allKeys)
  const [columnsMenuOpen, setColumnsMenuOpen] = useState(false)

  const toggleColumn = (key: ColumnKey) => {
    setVisibleColumns(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  const showAllColumns = () => setVisibleColumns(allKeys)
  const hideAllColumns = () => setVisibleColumns([])

  const totalRenderedColumns = 2 /* checkbox + menu */ + visibleColumns.length

  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl relative">
      <header className="px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">All Orders <span className="text-gray-400 dark:text-gray-500 font-medium">442</span></h2>
          <div className="relative">
            <button
              type="button"
              className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/40"
              onClick={() => setColumnsMenuOpen(o => !o)}
            >
              {/* settings icon */}
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06c.47.47 1.14.61 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09c0 .66.39 1.24 1 1.51.68.28 1.35.14 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06c-.47.47-.61 1.14-.33 1.82V9c.66 0 1.24.39 1.51 1H21a2 2 0 1 1 0 4h-.09c-.66 0-1.24.39-1.51 1Z" />
              </svg>
              Columns
            </button>
            {columnsMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                <div className="p-2 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between gap-2">
                  <button onClick={showAllColumns} className="text-xs text-gray-600 dark:text-gray-300 hover:underline">Show all</button>
                  <button onClick={hideAllColumns} className="text-xs text-gray-600 dark:text-gray-300 hover:underline">Hide all</button>
                </div>
                <div className="max-h-64 overflow-auto py-1">
                  {columnDefs.map(col => (
                    <label key={col.key} className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/40 cursor-pointer">
                      <input
                        type="checkbox"
                        className="form-checkbox"
                        checked={visibleColumns.includes(col.key)}
                        onChange={() => toggleColumn(col.key)}
                      />
                      <span>{col.label}</span>
                    </label>
                  ))}
                </div>
                {visibleColumns.length !== allKeys.length && (
                  <div className="px-3 py-2 text-[11px] text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700">
                    Showing {visibleColumns.length} of {allKeys.length} columns
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>
      <div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="table-auto w-full dark:text-gray-300 divide-y divide-gray-100 dark:divide-gray-700/60">
            {/* Table header */}
            <thead className="text-xs uppercase text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 border-t border-gray-100 dark:border-gray-700/60">
              <tr>
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap w-px">
                  <div className="flex items-center">
                    <label className="inline-flex">
                      <span className="sr-only">Select all</span>
                      <input className="form-checkbox" type="checkbox" onChange={handleSelectAllChange} checked={isAllSelected} />
                    </label>
                  </div>
                </th>
                {columnDefs.map(col => (
                  visibleColumns.includes(col.key) ? (
                    <th key={col.key} className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                      <div className="font-semibold text-left">{col.label}</div>
                    </th>
                  ) : null
                ))}
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <span className="sr-only">Menu</span>
                </th>
              </tr>
            </thead>
            {/* Table body */}
            {orders.map(order => (
              <OrdersTableItem
                key={order.id}
                order={order}
                onCheckboxChange={handleCheckboxChange}
                isSelected={selectedItems.includes(order.id)}
                visibleColumns={visibleColumns}
                totalRenderedColumns={totalRenderedColumns}
              />
            ))}
          </table>

        </div>
      </div>
    </div>
  )
}