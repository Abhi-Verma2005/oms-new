"use client"

import React from 'react'
import { Elements, useElements, useStripe, PaymentElement } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { useCart } from '@/contexts/cart-context'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string)

export default function CheckoutClient() {
  const { state } = useCart()
  const url = typeof window !== 'undefined' ? new URL(window.location.href) : null
  const priceCentsParam = url ? Number(url.searchParams.get('priceCents') || '0') : 0
  const siteName = url ? url.searchParams.get('siteName') || '' : ''
  const amount = React.useMemo(() => {
    if (priceCentsParam > 0) return Math.round(priceCentsParam / 100)
    const total = state.items.reduce((sum, it) => {
      const p = it.site.publishing.price || it.site.publishing.priceWithContent || 0
      return sum + p * (it.quantity || 1)
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
        const res = await fetch('/api/payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount, currency }),
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
  }, [amount, currency])

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
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
      <div className="sm:flex sm:justify-between sm:items-center mb-6">
        <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Checkout</h1>
        <a href="/" className="text-amber-500 dark:text-amber-400 text-sm">Back to Cart</a>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 shadow-sm rounded-xl p-6 border border-gray-200 dark:border-gray-800">
          {error && <div className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</div>}
          {!clientSecret ? (
            <div className="text-sm text-gray-600 dark:text-gray-400">{loading ? 'Creating payment session…' : amount > 0 ? 'Preparing payment…' : 'Waiting for amount'}</div>
          ) : (
            <Elements stripe={stripePromise} options={options}>
              <PaymentForm />
            </Elements>
          )}
        </div>
        <div className="bg-white dark:bg-gray-900 shadow-sm rounded-xl p-6 border border-gray-200 dark:border-gray-800">
          <div className="text-sm font-semibold mb-3 text-gray-800 dark:text-gray-100">Order Summary</div>
          {siteName ? (
            <div className="text-sm text-gray-700 dark:text-gray-300">{siteName}</div>
          ) : (
            <div className="text-sm text-gray-700 dark:text-gray-300">{state.items.length} item(s)</div>
          )}
          <div className="mt-4 text-sm text-gray-700 dark:text-gray-400 flex justify-between">
            <span>Subtotal</span>
            <span>${amount.toLocaleString()}</span>
          </div>
          <div className="mt-2 text-sm text-gray-700 dark:text-gray-400 flex justify-between">
            <span>Processing Fee</span>
            <span>$0</span>
          </div>
          <div className="mt-3 text-base text-gray-800 dark:text-gray-100 font-semibold flex justify-between">
            <span>Total</span>
            <span>${amount.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function PaymentForm() {
  const stripe = useStripe()
  const elements = useElements()
  const { clearCart } = useCart()
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    if (!stripe || !elements) return
    setLoading(true)
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/checkout',
      },
      redirect: 'if_required',
    })
    if (error) setError(error.message || 'Payment failed')
    else if (paymentIntent?.status === 'succeeded') {
      setSuccess('Payment succeeded')
      clearCart()
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
      <div className="flex justify-end">
        <button type="submit" className="btn bg-amber-400 text-black hover:bg-amber-300" disabled={loading || !stripe}>
          {loading ? 'Processing…' : 'Pay Now'}
        </button>
      </div>
    </form>
  )
}


