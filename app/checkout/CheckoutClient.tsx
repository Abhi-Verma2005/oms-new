"use client"

import React from 'react'
import { Elements, useElements, useStripe, PaymentElement } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { useCart } from '@/contexts/cart-context'
import CartItems from '../(default)/ecommerce/(cart)/cart-items'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string)

export default function CheckoutClient() {
  const { state } = useCart()
  const url = typeof window !== 'undefined' ? new URL(window.location.href) : null
  const priceCentsParam = url ? Number(url.searchParams.get('priceCents') || '0') : 0
  const siteName = url ? url.searchParams.get('siteName') || '' : ''
  const productId = url ? url.searchParams.get('productId') || '' : ''
  const amount = React.useMemo(() => {
    if (priceCentsParam > 0) return Math.round(priceCentsParam / 100)
    const total = state.items.reduce((sum, it) => {
      if (it.kind === 'site' && it.site) {
        const p = it.site.publishing.price || it.site.publishing.priceWithContent || 0
        return sum + p * (it.quantity || 1)
      }
      if (it.kind === 'product' && it.product) {
        return sum + (it.product.priceDollars || 0) * (it.quantity || 1)
      }
      return sum
    }, 0)
    return Math.round(total)
  }, [state.items, priceCentsParam])
  const [currency] = React.useState<string>('USD')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [clientSecret, setClientSecret] = React.useState<string | null>(null)
  const [isDark, setIsDark] = React.useState(false)

  React.useEffect(() => {
    const root = document.documentElement
    const update = () => setIsDark(root.classList.contains('dark'))
    update()
    const observer = new MutationObserver(update)
    observer.observe(root, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  React.useEffect(() => {
    let ignore = false
    async function createIntent() {
      if (!amount || amount <= 0) return
      setLoading(true)
      setError(null)
      try {
        // Prepare items for the payment intent
        const items = priceCentsParam > 0
          ? [{ id: productId || 'package', name: siteName || 'Package', price: amount, quantity: 1 }]
          : state.items.map(item => {
              if (item.kind === 'site' && item.site) {
                return {
                  id: item.site.id,
                  name: item.site.name,
                  price: item.site.publishing.price || item.site.publishing.priceWithContent || 0,
                  quantity: item.quantity || 1,
                }
              }
              return {
                id: item.product?.id || 'product',
                name: item.product?.name || 'Product',
                price: item.product?.priceDollars || 0,
                quantity: item.quantity || 1,
              }
            })

        const res = await fetch('/api/payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount, currency, items, productId }),
        })
        if (!res.ok) throw new Error('Failed to create payment intent')
        const j = await res.json()
        if (!ignore) setClientSecret(j.clientSecret)
      } catch (err: any) {
        if (!ignore) setError(err.message || 'Error')
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    createIntent()
    return () => { ignore = true }
  }, [amount, currency, state.items])

  const options = React.useMemo(() => (
    clientSecret
      ? {
          clientSecret,
          appearance: {
            theme: (isDark ? 'night' : 'flat') as any,
            variables: {
              colorPrimary: '#F59E0B',
              colorText: isDark ? '#E5E7EB' : '#111827',
              colorBackground: isDark ? '#111827' : '#FFFFFF',
              colorDanger: '#EF4444',
              fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system',
              borderRadius: '10px',
            },
            rules: {
              '.Input, .Input:focus': {
                border: '1px solid',
                borderColor: isDark ? '#374151' : '#E5E7EB',
                backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                color: isDark ? '#E5E7EB' : '#111827',
              },
              '.Label': {
                color: isDark ? '#9CA3AF' : '#6B7280',
              },
              '.Tab, .Pill': {
                backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                border: '1px solid',
                borderColor: isDark ? '#374151' : '#E5E7EB',
              },
              '.Tab--selected, .Pill--selected': {
                backgroundColor: isDark ? '#111827' : '#FFF7ED',
                borderColor: '#F59E0B',
                color: isDark ? '#FDE68A' : '#92400E',
              },
              '.Error': {
                color: '#EF4444',
              },
            },
          },
        }
      : undefined
  ), [clientSecret, isDark])

  return (
    <div className="lg:relative lg:flex">
      {/* Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-8 lg:grow lg:pr-8 xl:pr-16 2xl:ml-[80px]">
        <div className="lg:max-w-[640px] lg:mx-auto">
          {/* Cart items */}
          <div className="mb-6 lg:mb-0">
            <div className="mb-3">
              <div className="flex text-sm font-medium text-gray-400 dark:text-gray-500 space-x-2">
                <span className="text-gray-500 dark:text-gray-400">Review</span>
                <span>-&gt;</span>
                <span className="text-violet-500">Payment</span>
                <span>-&gt;</span>
                <span className="text-gray-500 dark:text-gray-400">Confirm</span>
              </div>
            </div>
            <header className="mb-2">
              {/* Title */}
              <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Shopping Cart ({state.items.length})</h1>
            </header>
            <CartItems />
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div>
        <div className="lg:sticky lg:top-16 bg-linear-to-r from-white/30 dark:from-gray-800/30 lg:overflow-x-hidden lg:overflow-y-auto no-scrollbar lg:shrink-0 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700/60 lg:w-[320px] xl:w-[352px] 2xl:w-[calc(352px+80px)] lg:h-[calc(100dvh-64px)]">
          <div className="py-8 px-4 lg:px-8 2xl:px-12">
            <div className="max-w-sm mx-auto lg:max-w-none">
              <h2 className="text-2xl text-gray-800 dark:text-gray-100 font-bold mb-6">Review & Pay</h2>
              <div className="space-y-6">
                {/* Order summary */}
                <div>
                  <div className="text-gray-800 dark:text-gray-100 font-semibold mb-2">Order Summary</div>
                  <ul className="mb-4">
                    <li className="text-sm w-full flex justify-between py-3 border-b border-gray-200 dark:border-gray-700/60">
                      <div>Subtotal</div>
                      <div className="font-medium text-gray-800 dark:text-gray-100">${amount}</div>
                    </li>
                    <li className="text-sm w-full flex justify-between py-3 border-b border-gray-200 dark:border-gray-700/60">
                      <div>Total due (including taxes)</div>
                      <div className="font-medium text-green-600">${amount}</div>
                    </li>
                  </ul>
                </div>

                {/* Payment Details */}
                <div>
                  <div className="text-gray-800 dark:text-gray-100 font-semibold mb-4">Payment Details</div>
                  {error && <div className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</div>}
                  {!clientSecret ? (
                    <div className="text-sm text-gray-600 dark:text-gray-400">{loading ? 'Creating payment session…' : amount > 0 ? 'Preparing payment…' : 'Waiting for amount'}</div>
                  ) : (
                    <Elements stripe={stripePromise} options={options}>
                      <PaymentForm />
                    </Elements>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PaymentForm() {
  const stripe = useStripe()
  const elements = useElements()
  const { clearCart, state } = useCart()
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)
  
  const url = typeof window !== 'undefined' ? new URL(window.location.href) : null
  const priceCentsParam = url ? Number(url.searchParams.get('priceCents') || '0') : 0
  const amount = React.useMemo(() => {
    if (priceCentsParam > 0) return Math.round(priceCentsParam / 100)
    const total = state.items.reduce((sum, it) => {
      if (it.kind === 'site' && it.site) {
        const p = it.site.publishing.price || it.site.publishing.priceWithContent || 0
        return sum + p * (it.quantity || 1)
      }
      if (it.kind === 'product' && it.product) {
        return sum + (it.product.priceDollars || 0) * (it.quantity || 1)
      }
      return sum
    }, 0)
    return Math.round(total)
  }, [state.items, priceCentsParam])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    if (!stripe || !elements) return
    setLoading(true)
    
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/checkout',
        },
        redirect: 'if_required',
      })
      
      if (error) {
        setError(error.message || 'Payment failed')
        console.error('Payment error:', error)
      } else if (paymentIntent?.status === 'succeeded') {
        setSuccess('Payment succeeded')
        console.log('Payment succeeded:', paymentIntent)
        clearCart()
        
        // Optional: Wait a moment for webhook to process, then redirect
        setTimeout(() => {
          window.location.href = '/orders'
        }, 2000)
      } else {
        console.log('Payment status:', paymentIntent?.status)
      }
    } catch (err) {
      console.error('Payment confirmation error:', err)
      setError('Payment confirmation failed')
    }
    
    setLoading(false)
  }

  if (success) {
    return (
      <div className="space-y-4">
        <div className="text-green-500 font-semibold">{success}</div>
        <div className="text-sm text-gray-400">Your order has been placed successfully.</div>
        <div className="flex gap-2">
          <a className="btn bg-gray-900 text-gray-100 hover:bg-gray-800" href="/orders">Go to Orders</a>
          <a className="btn border border-gray-300 dark:border-gray-700" href="/publishers">Continue Browsing</a>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && <div className="text-sm text-red-500">{error}</div>}
      <div className="mt-6">
        <div className="mb-4">
          <button type="submit" className="btn w-full bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white" disabled={loading || !stripe}>
            {loading ? 'Processing…' : `Pay $${amount}.00`}
          </button>
        </div>
        <div className="text-xs text-gray-500 italic text-center">You'll be charged ${amount}, including applicable taxes</div>
      </div>
    </form>
  )
}


