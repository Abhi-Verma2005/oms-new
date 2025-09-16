'use client'

import React from 'react'
import { useCart } from '@/contexts/cart-context'
import { ShoppingCart, X, Globe } from 'lucide-react'
import Link from 'next/link'
import MaskedWebsite from '@/components/masked-website'

export default function CartModal() {
  const { state, closeCart, getTotalPrice, removeItem } = useCart()

  if (!state.isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[55]"
        onClick={closeCart}
      />
      
      {/* Compact Cart Dropdown - ensure it doesn't overflow off-screen */}
      <div className="absolute right-0 top-12 w-80 max-w-[calc(100vw-1rem)] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-[60]">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Cart ({state.items.length})
            </span>
          </div>
          <button
            onClick={closeCart}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
          >
            <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-64 overflow-y-auto">
          {state.items.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
              Your cart is empty
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {state.items.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded">
                  {/* Site Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                      <Globe className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    </div>
                  </div>
                  
                  {/* Site Details */}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                      <MaskedWebsite site={item.site} maxStars={8} showRevealButton={false} />
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      ${(item.site.publishing.price || 0).toFixed(2)}
                    </div>
                  </div>
                  
                  {/* Remove Button */}
                  <button
                    onClick={() => removeItem(item.site.id)}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1"
                    title="Remove from cart"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              
              {state.items.length > 3 && (
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-1">
                  +{state.items.length - 3} more items
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {state.items.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-3 space-y-2">
            <div className="flex justify-between items-center text-sm font-medium">
              <span className="text-gray-900 dark:text-gray-100">Total</span>
              <span className="text-gray-900 dark:text-gray-100">
                ${getTotalPrice().toFixed(2)}
              </span>
            </div>
            <div className="flex space-x-2">
              <Link
                href="/checkout"
                onClick={closeCart}
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium py-2 px-3 rounded text-center transition-colors"
              >
                Checkout
              </Link>
              <button
                onClick={closeCart}
                className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium py-2 px-3 rounded transition-colors"
              >
                View Cart
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
