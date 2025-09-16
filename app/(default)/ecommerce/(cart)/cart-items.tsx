'use client'

import React from 'react'
import { useCart } from '@/contexts/cart-context'
import { Globe } from 'lucide-react'
import MaskedWebsite from '@/components/masked-website'

export default function CartItems() {
  const { state, removeItem } = useCart()

  if (state.items.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 dark:text-gray-400 mb-2">Your cart is empty</div>
        <div className="text-sm text-gray-400">Add some items to get started</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {state.items.map((item) => (
        <div key={item.id} className="flex items-center space-x-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          {/* Site Icon */}
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
              <Globe className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
          </div>
          
          {/* Site Details */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              <MaskedWebsite site={item.site} maxStars={12} showRevealButton={false} />
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {item.site.niche}
            </p>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                ${(item.site.publishing.price || 0).toFixed(2)}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                × {item.quantity}
              </span>
            </div>
          </div>
          
          {/* Remove Button */}
          <div className="flex-shrink-0">
            <button
              onClick={() => removeItem(item.site.id)}
              className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1"
              title="Remove from cart"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
      
      {/* Total */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex justify-between items-center">
          <span className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Total ({state.items.length} {state.items.length === 1 ? 'item' : 'items'})
          </span>
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
            ${state.items.reduce((total, item) => total + (item.site.publishing.price || 0) * item.quantity, 0).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  )
}
