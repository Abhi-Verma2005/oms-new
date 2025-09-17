'use client'

import React from 'react'
import { useCart } from '@/contexts/cart-context'

export default function AddToCartProductButton({ id, name, priceDollars, className }: { id: string; name: string; priceDollars: number; className?: string }) {
  const { addProduct, openCart } = useCart()
  return (
    <button
      onClick={() => { addProduct({ id, name, priceDollars }); openCart() }}
      className={className || 'btn bg-violet-600 hover:bg-violet-700 text-white'}
    >
      Add to Cart
    </button>
  )
}


