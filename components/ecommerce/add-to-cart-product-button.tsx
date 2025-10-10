'use client'

import React from 'react'
import { useCart } from '@/contexts/cart-context'

type Props = {
  id: string
  name: string
  priceDollars: number
  className?: string
  openOnAdd?: boolean
}

export default function AddToCartProductButton({ id, name, priceDollars, className, openOnAdd = true }: Props) {
  const { addProduct, openCart } = useCart()
  return (
    <button
      onClick={() => {
        addProduct({ id, name, priceDollars })
        if (openOnAdd) openCart()
      }}
      className={className || 'btn bg-violet-600 hover:bg-violet-700 text-white whitespace-nowrap'}
    >
      Add to Cart
    </button>
  )
}


