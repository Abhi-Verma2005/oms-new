"use client"

import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '@/contexts/cart-context'
import Related01 from '@/public/images/related-product-01.jpg'

export default function CartItems() {
  const { state, removeItem } = useCart()

  if (state.items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 dark:text-gray-400 mb-4">Your cart is empty</div>
        <Link 
          className="text-sm font-medium text-violet-500 hover:text-violet-600 dark:hover:text-violet-400" 
          href="/ecommerce/shop"
        >
          &lt;- Back To Shopping
        </Link>
      </div>
    )
  }

  return (
    <>
      <ul>
        {state.items.map((item) => (
          <li key={item.id} className="sm:flex items-center py-6 border-b border-gray-200 dark:border-gray-700/60">
            <a className="block mb-4 sm:mb-0 mr-5 md:w-32 xl:w-auto shrink-0" href="#0">
              <Image 
                className="rounded-xs" 
                src={Related01} 
                width={200} 
                height={142} 
                alt={item.site.name} 
              />
            </a>
            <div className="grow">
              <a href="#0">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">
                  {item.site.name}
                </h3>
              </a>
              <div className="text-sm mb-2 text-gray-600 dark:text-gray-400">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut.
              </div>
              {/* Product meta */}
              <div className="flex flex-wrap justify-between items-center">
                {/* Rating and price */}
                <div className="flex flex-wrap items-center space-x-2 mr-2">
                  {/* Rating */}
                  <div className="flex items-center space-x-2">
                    {/* Stars */}
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star}>
                          <span className="sr-only">{star} star</span>
                          <svg 
                            className={`fill-current ${star <= 4 ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600'}`} 
                            width="16" 
                            height="16" 
                            viewBox="0 0 16 16"
                          >
                            <path d="M10 5.934L8 0 6 5.934H0l4.89 3.954L2.968 16 8 12.223 13.032 16 11.11 9.888 16 5.934z" />
                          </svg>
                        </button>
                      ))}
                    </div>
                    {/* Rate */}
                    <div className="inline-flex text-sm font-medium text-yellow-600">4.2</div>
                  </div>
                  <div className="text-gray-400 dark:text-gray-600">·</div>
                  {/* Price */}
                  <div>
                    <div className="inline-flex text-sm font-medium bg-green-500/20 text-green-700 rounded-full text-center px-2 py-0.5">
                      ${(item.site.publishing.price || item.site.publishing.priceWithContent || 0).toFixed(2)}
                    </div>
                  </div>
                  {/* Quantity */}
                  {item.quantity > 1 && (
                    <>
                      <div className="text-gray-400 dark:text-gray-600">·</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Qty: {item.quantity}
                      </div>
                    </>
                  )}
                </div>
                <button 
                  className="text-sm underline hover:no-underline text-red-500 hover:text-red-600"
                  onClick={() => removeItem(item.site.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6">
        <Link 
          className="text-sm font-medium text-violet-500 hover:text-violet-600 dark:hover:text-violet-400" 
          href="/ecommerce/shop"
        >
          &lt;- Back To Shopping
        </Link>
      </div>
    </>
  )
}