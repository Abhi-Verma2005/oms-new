'use client'

import Link from 'next/link'
import { useCart } from '@/contexts/cart-context'
import { ShoppingCart } from 'lucide-react'

export default function CartInlineSummary() {
  const { state, getTotalItems, openCart } = useCart()

  const totalItems = getTotalItems()
  if (totalItems === 0) return null

  return (
    <div className="flex items-center justify-between px-2 py-1.5 mb-1 rounded-md border bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/60">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-6 h-6 rounded-md bg-violet-600/10 dark:bg-violet-500/15 flex items-center justify-center">
          <ShoppingCart className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
        </div>
        <div className="text-xs text-gray-700 dark:text-gray-200 font-medium truncate">
          {totalItems} item{totalItems !== 1 ? 's' : ''} in cart
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          type="button"
          onClick={openCart}
          className="px-2 py-1 text-xs rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 transition-colors"
        >
          View cart
        </button>
        <Link
          href="/checkout"
          className="px-2 py-1 text-xs rounded-md bg-violet-600 hover:bg-violet-700 text-white transition-colors"
        >
          Checkout
        </Link>
      </div>
    </div>
  )
}


