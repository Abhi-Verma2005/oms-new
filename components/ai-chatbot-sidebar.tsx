"use client"

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { 
  Send, 
  Bot, 
  Trash2,
  X, 
  Monitor, 
  Network, 
  FileText, 
  Presentation, 
  Zap, 
  Scissors, 
  Paperclip, 
  Book, 
  Filter, 
  Clock, 
  Plus, 
  Mic, 
  Globe, 
  Gift, 
  Heart, 
  HelpCircle, 
  ChevronDown,
  Rocket,
  ShoppingCart,
  CreditCard,
  Package,
  CheckCircle
} from 'lucide-react'
import { useAIChatbot } from './ai-chatbot-provider'
import { useCart } from '@/contexts/cart-context'
import { useChat } from '@/contexts/chat-context'
import { MarkdownRenderer } from './markdown-renderer'
import { useAIMessageListener } from '@/lib/ai-chat-utils'
import { useResizableLayout } from './resizable-layout'
import ChatActionCard from '@/components/chat/ChatActionCard'
import type { ChatActionCardModel } from '@/components/chat/ChatActionCard'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

type ActionKind = 'cart' | 'checkout' | 'orders' | 'filter' | 'payment'

interface ActionCard extends ChatActionCardModel {
  afterMessageId?: string
}

interface AIChatbotSidebarProps {
  onClose?: () => void
}

export function AIChatbotSidebar({ onClose }: AIChatbotSidebarProps) {
  const router = useRouter()
  const { config, configLoading } = useAIChatbot()
  const { toggleSidebar } = useResizableLayout()
  const { 
    state: cartState,
    addItem, 
    removeItem, 
    clearCart, 
    getTotalItems, 
    getTotalPrice,
    openCart,
    isItemInCart 
  } = useCart()
  const { messages, addMessage, updateMessage, clearMessages, isLoading, setIsLoading } = useChat()
  
  // Clear chat function that preserves RAG data
  const clearChat = async () => {
    try {
      // Call API to clear chat history while preserving knowledge base
      const response = await fetch('/api/ai-chat/clear-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        // Clear local messages
        clearMessages()
        // Clear RAG context
        setRagContext(null)
        console.log('✅ Chat history cleared while preserving knowledge base')
      } else {
        console.error('❌ Failed to clear chat history')
      }
    } catch (error) {
      console.error('❌ Error clearing chat history:', error)
      // Fallback: just clear local messages
      clearMessages()
      setRagContext(null)
    }
  }
  
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const inflightAbortRef = useRef<AbortController | null>(null)
  const [actionCards, setActionCards] = useState<ActionCard[]>([])
  // RAG Integration Indicators
  const [ragContext, setRagContext] = useState<{
    sources: string[]
    cacheHit: boolean
    contextCount: number
  } | null>(null)

  const prevCartCountRef = useRef<number>(cartState.items.length)
  const didMountRef = useRef<boolean>(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  // Cleanup: abort any pending requests when component unmounts
  useEffect(() => {
    return () => {
      if (inflightAbortRef.current) {
        try { inflightAbortRef.current.abort() } catch {}
      }
    }
  }, [])

  // Detect cart additions and show action card (single handler to prevent duplicates)
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true
      prevCartCountRef.current = cartState.items.length
      return
    }
    const previous = prevCartCountRef.current
    const current = cartState.items.length
    if (current > previous) {
      // Item(s) added - show action card
      prevCartCountRef.current = current
      const totalItems = getTotalItems()
      const totalPrice = getTotalPrice()
      const attachToId = (() => {
        const last = messages[messages.length - 1]
        if (last && last.role === 'assistant') return last.id
        // Create a lightweight assistant confirmation to anchor the card
        const assistantMessage: Message = {
          id: (Date.now() + 3).toString(),
          content: `Item added to cart.`,
          role: 'assistant',
          timestamp: new Date()
        }
        addMessage(assistantMessage)
        return assistantMessage.id
      })()
      const cardId = `${Date.now()}-added-card`
      const dismissCard = () => dismissActionCard(cardId)
      queueActionCard({
        id: cardId,
        type: 'cart',
        title: 'Item Added to Cart',
        message: `You now have ${totalItems} item${totalItems !== 1 ? 's' : ''} • $${totalPrice.toFixed(2)}`,
        icon: <ShoppingCart className="h-4 w-4" />,
        actions: [
          { label: 'View Cart', variant: 'primary', onClick: () => openCart() },
          { label: 'Checkout', variant: 'secondary', onClick: () => goToCheckout() },
          { label: 'Continue Shopping', variant: 'tertiary', onClick: dismissCard },
        ],
        dismissible: true,
        timestamp: new Date(),
        afterMessageId: attachToId,
      })
      return
    }
    // Update previous when not increased (removed/cleared also updates elsewhere)
    prevCartCountRef.current = current
  }, [cartState.items.length])

  // Remove the duplicate event listener - the cart length change detection above handles this

  // Listen for refine modal apply event from ChatActionCard
  useEffect(() => {
    const handler = (e: Event) => {
      try {
        const detail = (e as CustomEvent<string>).detail || ''
        const fp = new URLSearchParams(detail)
        const priceMin = fp.get('priceMin')
        const priceMax = fp.get('priceMax')
        const parts: string[] = []
        if (priceMin) parts.push(`min price $${priceMin}`)
        if (priceMax) parts.push(`max price $${priceMax}`)

        const confirmation: Message = {
          id: (Date.now() + 2).toString(),
          content: parts.length > 0
            ? `Okay — I’ve applied ${parts.join(', ')}. Showing updated results.`
            : `Okay — I’ve applied your filters. Showing updated results.`,
          role: 'assistant',
          timestamp: new Date()
        }
        addMessage(confirmation)
        applyFilters(detail)

        queueActionCard({
          id: `${Date.now()}-refine-applied`,
          type: 'filter',
          title: 'Filters Applied',
          message: parts.join(' • '),
          icon: <Filter className="h-4 w-4" />,
          actions: [
            { label: 'Clear Filters', variant: 'secondary', onClick: () => clearFilters() },
            { label: 'Refine', variant: 'tertiary', onClick: () => openFilterDialog() },
          ],
          dismissible: true,
          timestamp: new Date(),
          afterMessageId: confirmation.id,
        })
      } catch {}
    }
    window.addEventListener('AI_CHAT_REFINE_FILTERS', handler as EventListener)
    return () => window.removeEventListener('AI_CHAT_REFINE_FILTERS', handler as EventListener)
  }, [])


  // Process AI response and handle all possible actions
  const processAIResponse = async (
    response: string,
    apiCartState?: any,
    options?: { targetMessageId?: string; userText?: string }
  ) => {
    let cleanResponse = response
    let actions: Array<{ type: string; data: any }> = []

    // Extract all action commands from the response
    const actionPatterns = [
      { pattern: /\[\s*NAVIGATE\s*:\s*([\s\S]*?)\s*\]/g, type: 'navigate' },
      { pattern: /\[\s*FILTER\s*:\s*([\s\S]*?)\s*\]/g, type: 'filter' },
      { pattern: /\[\s*ADD_TO_CART\s*:\s*([\s\S]*?)\s*\]/g, type: 'addToCart' },
      { pattern: /\[\s*REMOVE_FROM_CART\s*:\s*([\s\S]*?)\s*\]/g, type: 'removeFromCart' },
      { pattern: /\[\s*VIEW_CART\s*\]/g, type: 'viewCart' },
      { pattern: /\[\s*CLEAR_CART\s*\]/g, type: 'clearCart' },
      { pattern: /\[\s*CART_SUMMARY\s*\]/g, type: 'cartSummary' },
      { pattern: /\[\s*PROCEED_TO_CHECKOUT\s*\]/g, type: 'proceedToCheckout' },
      { pattern: /\[\s*VIEW_ORDERS\s*\]/g, type: 'viewOrders' },
      { pattern: /\[\s*PAYMENT_SUCCESS\s*:\s*([\s\S]*?)\s*\]/g, type: 'paymentSuccess' },
      { pattern: /\[\s*PAYMENT_FAILED\s*:\s*([\s\S]*?)\s*\]/g, type: 'paymentFailed' },
      { pattern: /\[\s*ORDER_DETAILS\s*:\s*([\s\S]*?)\s*\]/g, type: 'orderDetails' },
      { pattern: /\[\s*RECOMMEND\s*:\s*([\s\S]*?)\s*\]/g, type: 'recommend' },
      { pattern: /\[\s*SIMILAR_ITEMS\s*:\s*([\s\S]*?)\s*\]/g, type: 'similarItems' },
      { pattern: /\[\s*BEST_DEALS\s*\]/g, type: 'bestDeals' }
    ]

    // Extract all actions
    actionPatterns.forEach(({ pattern, type }) => {
      const matches = [...response.matchAll(pattern)]
      matches.forEach(match => {
        const raw = match[1]
        const data = typeof raw === 'string' ? raw.replace(/\n/g, '').trim() : true
        actions.push({ type, data })
        cleanResponse = cleanResponse.replace(match[0], '').trim()
      })
    })

    // Remove boilerplate helper lines that are not user-useful
    try {
      cleanResponse = cleanResponse
        // Strip generic platform/context helper note if present
        .replace(/\bplease specify the platform or context to filter websites[^\n]*\n?/gi, '')
        .replace(/\bif you need help navigating to[^\n]*\n?/gi, '')
        .trim()
    } catch {}

// Add or update the assistant message
    if (options?.targetMessageId) {
      // Always update with the clean response to ensure content is displayed
      updateMessage(options.targetMessageId, { content: cleanResponse || 'Processing your request...' })
    } else {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: cleanResponse || 'Processing your request...',
        role: 'assistant',
        timestamp: new Date()
      }
      addMessage(assistantMessage)
    }

    // Fallback heuristics: if no explicit tool tags, infer intent from assistant text
    if (actions.length === 0) {
      try {
        const lower = (cleanResponse || '').toLowerCase()
        if (lower.includes('checkout')) {
          actions.push({ type: 'proceedToCheckout', data: true })
        } else if (lower.includes('orders')) {
          actions.push({ type: 'viewOrders', data: true })
        } else if (lower.includes('cart summary') || lower.includes("what's in my cart") || lower.includes('what is in my cart') || lower.includes('show cart') || lower.includes('view cart')) {
          actions.push({ type: 'cartSummary', data: true })
        }
      } catch {}
    }

    // Heuristic: extract priceMin/priceMax from user text when AI didn't emit [FILTER:...] tag
    if (actions.length === 0) {
      try {
        const source = (options?.userText || cleanResponse || '').toLowerCase().replace(/,/g, '')
        const numbers = Array.from(source.matchAll(/(?:\$|usd|inr|rs\.?|€)?\s*(\d{2,7})(?:\.\d+)?/g)).map(m => parseInt(m[1], 10)).filter(n => !isNaN(n))
        let priceMin: number | undefined
        let priceMax: number | undefined

        // Extract explicit min and max phrases with nearest following number
        const maxMatch = source.match(/(?:max|maximum|at\s*most|up\s*to|upto)[^\d]{0,16}(\d{2,7})/)
        const minMatch = source.match(/(?:min|minimum|at\s*least|lowest)[^\d]{0,16}(\d{2,7})/)
        if (minMatch) priceMin = parseInt(minMatch[1], 10)
        if (maxMatch) priceMax = parseInt(maxMatch[1], 10)

        // Handle range phrasing like "between X and Y", "from X to Y"
        if ((/between|range|from/.test(source)) && numbers.length >= 2) {
          const a = Math.min(numbers[0], numbers[1])
          const b = Math.max(numbers[0], numbers[1])
          priceMin = priceMin ?? a
          priceMax = priceMax ?? b
        }
        // Fallback: if still missing, use overall min/max from detected numbers
        if ((!priceMin && !priceMax) && numbers.length >= 2) {
          const sorted = [...numbers].sort((a,b)=>a-b)
          priceMin = sorted[0]
          priceMax = sorted[sorted.length - 1]
        }
        if (!priceMin && numbers.length === 1 && /min|minimum|at\s*least|lowest/.test(source)) priceMin = numbers[0]
        if (!priceMax && numbers.length === 1 && /max|maximum|at\s*most|up\s*to|upto/.test(source)) priceMax = numbers[0]

        // Safety: swap if reversed
        if (priceMin !== undefined && priceMax !== undefined && priceMin > priceMax) {
          const tmp = priceMin; priceMin = priceMax; priceMax = tmp
        }

        if (priceMin !== undefined || priceMax !== undefined) {
          const qp = new URLSearchParams()
          if (priceMin !== undefined) qp.set('priceMin', String(priceMin))
          if (priceMax !== undefined) qp.set('priceMax', String(priceMax))
          actions.push({ type: 'filter', data: qp.toString() })
        }
      } catch {}
    }

    // Execute actions in sequence
    for (const action of actions) {
      await executeAction(action, apiCartState)
    }
  }

  // Execute individual actions
  const executeAction = async (action: { type: string; data: any }, apiCartState?: any) => {
    const normalizeRoute = (input: string) => {
      const raw = (input || '').trim().toLowerCase()
      if (!raw) return '/'
      if (raw === 'orders' || raw === '/orders' || raw === 'view_orders' || raw === '/view_orders') return '/orders'
      if (raw === 'checkout' || raw === '/checkout') return '/checkout'
      if (!raw.startsWith('/')) return `/${raw}`
      return raw
    }
    switch (action.type) {
      case 'navigate':
        try {
          // Stop streaming to avoid interference with navigation
          try { inflightAbortRef.current?.abort() } catch {}
          const target = normalizeRoute(action.data)
          router.push(target)
        } catch {
          try { window.location.assign(normalizeRoute(action.data)) } catch {}
        }
        break

      case 'filter':
        try {
          try { inflightAbortRef.current?.abort() } catch {}
          // Build a short, human-friendly confirmation message for the applied filters
          const fp = new URLSearchParams(action.data)
          const parts: string[] = []
          const priceMin = fp.get('priceMin')
          const priceMax = fp.get('priceMax')
          const niche = fp.get('niche')
          const language = fp.get('language')
          const country = fp.get('country')
          if (priceMin) parts.push(`min price $${priceMin}`)
          if (priceMax) parts.push(`max price $${priceMax}`)
          if (niche) parts.push(`niche ${niche}`)
          if (language) parts.push(`language ${language}`)
          if (country) parts.push(`country ${country}`)

          const confirmation: Message = {
            id: (Date.now() + 2).toString(),
            content: parts.length > 0
              ? `Okay — I’ve applied ${parts.join(', ')}. Showing updated results.`
              : `Okay — I’ve applied your filters. Showing updated results.`,
            role: 'assistant',
            timestamp: new Date()
          }
          addMessage(confirmation)

          applyFilters(action.data)
          // Force a refresh to ensure data & pricing are visible after URL change
          try { (router as any).refresh?.() } catch {}
          // Show Filter Applied action card after confirmation
          const cardId = `${Date.now()}-filter`;
          queueActionCard({
            id: cardId,
            type: 'filter',
            title: 'Filters Applied',
            message: parts.length ? parts.join(' • ') : undefined,
            icon: <Filter className="h-4 w-4" />,
            actions: [
              { label: 'Clear Filters', variant: 'secondary', onClick: () => clearFilters() },
              { label: 'Refine', variant: 'tertiary', onClick: () => openFilterDialog() },
            ],
            dismissible: true,
            timestamp: new Date(),
            afterMessageId: confirmation.id,
          })
        } catch {
          // Fallback: build URL and replace via History API
          try {
            const current = new URL(window.location.href)
            const params = new URLSearchParams(current.search)
            const filterParams = new URLSearchParams(action.data)
            for (const [k, v] of filterParams.entries()) {
              if (!v) params.delete(k); else params.set(k, v)
            }
            const newUrl = `/publishers${params.toString() ? `?${params.toString()}` : ''}`
            // Do full navigation to ensure server data is fetched and rendered
            window.location.assign(newUrl)
          } catch {}
        }
        break

      case 'addToCart':
        // For now, we'll show a message since we need site data
        // In a real implementation, you'd fetch the site data and add it
        const addToCartMessage: Message = {
          id: (Date.now() + 2).toString(),
          content: `I'd be happy to add items to your cart! However, I need more specific information about which sites you'd like to add. Could you tell me which specific sites from the results you're interested in?`,
          role: 'assistant',
          timestamp: new Date()
        }
        addMessage(addToCartMessage)
        break

      case 'removeFromCart':
        if (action.data && action.data !== 'true') {
          removeItem(action.data)
          const removeMessage: Message = {
            id: (Date.now() + 2).toString(),
            content: `I've removed the item from your cart.`,
            role: 'assistant',
            timestamp: new Date()
          }
          addMessage(removeMessage)
          // Show updated cart/checkout prompt
          const totalItemsNow = apiCartState?.totalItems ?? getTotalItems()
          const totalPriceNow = apiCartState?.totalPrice ?? getTotalPrice()
          const hasItemsNow = (totalItemsNow ?? 0) > 0
          queueActionCard({
            id: `${Date.now()}-post-remove`,
            type: hasItemsNow ? 'checkout' : 'cart',
            title: hasItemsNow ? 'Updated Cart' : 'Cart is now empty',
            message: hasItemsNow ? `${totalItemsNow} items • $${totalPriceNow.toFixed(2)}` : 'Browse products to continue',
            icon: hasItemsNow ? <ShoppingCart className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />,
            actions: hasItemsNow
              ? [
                  { label: 'Proceed to Checkout', variant: 'primary', onClick: () => goToCheckout() },
                  { label: 'Review Cart', variant: 'secondary', onClick: () => openCart() },
                  { label: 'Remove All Items', variant: 'tertiary', onClick: () => clearCart() },
                ]
              : [
                  { label: 'Browse Products', variant: 'primary', onClick: () => goToPublishers() },
                ],
            dismissible: true,
            timestamp: new Date(),
            afterMessageId: removeMessage.id,
          })
        }
        break

      case 'viewCart':
        openCart()
        break

      case 'clearCart':
        clearCart()
        const clearMessage: Message = {
          id: (Date.now() + 2).toString(),
          content: `I've cleared your cart.`,
          role: 'assistant',
          timestamp: new Date()
        }
        addMessage(clearMessage)
        // Offer browsing after clearing
        queueActionCard({
          id: `${Date.now()}-post-clear`,
          type: 'cart',
          title: 'Cart Cleared',
          message: 'Find products to add',
          icon: <ShoppingCart className="h-4 w-4" />,
          actions: [
            { label: 'Browse Products', variant: 'primary', onClick: () => goToPublishers() },
          ],
          dismissible: true,
          timestamp: new Date(),
          afterMessageId: clearMessage.id,
        })
        break

      case 'cartSummary':
        // Debug cart state before processing
        console.log('🛒 DEBUG: Processing cart summary action:', {
          apiCartState: apiCartState,
          apiCartStateType: typeof apiCartState,
          apiCartStateKeys: apiCartState ? Object.keys(apiCartState) : 'null',
          apiCartItems: apiCartState?.items,
          apiCartItemsLength: apiCartState?.items?.length,
          apiTotalItems: apiCartState?.totalItems,
          apiTotalPrice: apiCartState?.totalPrice,
          localCartItems: cartState.items,
          localCartItemsLength: cartState.items.length,
          localTotalItems: getTotalItems(),
          localTotalPrice: getTotalPrice()
        })
        
        // Use API cart state if available, otherwise fall back to context
        const totalItems = apiCartState?.totalItems ?? getTotalItems()
        const totalPrice = apiCartState?.totalPrice ?? getTotalPrice()
        const items = apiCartState?.items ?? cartState.items
        
        console.log('🛒 DEBUG: Final cart summary values:', {
          totalItems,
          totalPrice,
          items,
          itemsLength: items?.length,
          itemsDetails: items?.map((item: any, index: number) => ({
            index,
            id: item.id,
            kind: item.kind,
            name: item.kind === 'site' ? item.site?.name : item.product?.name,
            quantity: item.quantity,
            price: item.kind === 'site' ? (item.site?.publishing?.price || 0) : (item.product?.priceDollars || 0)
          }))
        })
        
        const cartItemsList = items && items.length > 0 ? items.map((item: any, index: number) => 
          `${index + 1}. ${item.kind === 'site' ? item.site?.name : item.product?.name} - $${item.kind === 'site' ? (item.site?.publishing?.price || 0) : (item.product?.priceDollars || 0)} x${item.quantity || 1}`
        ).join('\n') : 'No items'
        
        const cartSummaryMessage: Message = {
          id: (Date.now() + 2).toString(),
          content: `Your cart has ${totalItems} item${totalItems !== 1 ? 's' : ''} totaling $${totalPrice.toFixed(2)}.\n\nCart Contents:\n${cartItemsList}\n\n${totalItems > 0 ? 'Would you like to proceed to checkout or add more items?' : 'Your cart is empty. Would you like to browse some items?'}`,
          role: 'assistant',
          timestamp: new Date()
        }
        addMessage(cartSummaryMessage)
        // Show Checkout Ready or Empty Cart card
        const hasItems = (totalItems ?? 0) > 0
        const checkoutCardId = `${Date.now()}-checkout`;
        queueActionCard({
          id: checkoutCardId,
          type: hasItems ? 'checkout' : 'cart',
          title: hasItems ? 'Ready to Checkout?' : 'Your cart is empty',
          message: hasItems ? `${totalItems} items • $${totalPrice.toFixed(2)}` : 'Browse products to get started',
          icon: hasItems ? <CreditCard className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />,
          actions: hasItems
            ? [
                { label: 'Proceed to Checkout', variant: 'primary', onClick: () => goToCheckout() },
                { label: 'Review Cart', variant: 'secondary', onClick: () => openCart() },
              ]
            : [
                { label: 'Browse Products', variant: 'primary', onClick: () => goToPublishers() },
              ],
          dismissible: true,
          timestamp: new Date(),
          afterMessageId: cartSummaryMessage.id,
        })
        break

      case 'proceedToCheckout':
        const cartItemCount = apiCartState?.totalItems ?? getTotalItems()
        if (cartItemCount > 0) {
          try {
            try { inflightAbortRef.current?.abort() } catch {}
            router.push('/checkout')
          } catch {
            try { window.location.assign('/checkout') } catch {}
          }
        } else {
          const emptyCartMessage: Message = {
            id: (Date.now() + 2).toString(),
            content: `Your cart is empty. Let me help you find some great items to add first!`,
            role: 'assistant',
            timestamp: new Date()
          }
          addMessage(emptyCartMessage)
          // Show empty cart actions
          const emptyCardId = `${Date.now()}-empty-cart`;
          queueActionCard({
            id: emptyCardId,
            type: 'cart',
            title: 'Empty Cart',
            message: 'Browse products or view recommendations',
            icon: <ShoppingCart className="h-4 w-4" />,
            actions: [
              { label: 'Browse Products', variant: 'primary', onClick: () => goToPublishers() },
            ],
            dismissible: true,
            timestamp: new Date(),
            afterMessageId: emptyCartMessage.id,
          })
        }
        break

      case 'viewOrders':
        console.log('🔍 DEBUG: Executing viewOrders action, navigating to /orders')
        try {
          router.push('/orders')
          console.log('✅ Navigation successful via router.push')
        } catch (error) {
          console.log('❌ router.push failed, trying window.location.assign:', error)
          try { 
            window.location.assign('/orders')
            console.log('✅ Navigation successful via window.location.assign')
          } catch (fallbackError) {
            console.log('❌ Both navigation methods failed:', fallbackError)
          }
        }
        break

      case 'paymentSuccess':
        const successMessage: Message = {
          id: (Date.now() + 2).toString(),
          content: `🎉 Payment successful! Your order has been confirmed.`,
          role: 'assistant',
          timestamp: new Date()
        }
        addMessage(successMessage)
        // Show order placed card
        queueActionCard({
          id: `${Date.now()}-order-success`,
          type: 'orders',
          title: 'Order Placed Successfully! 🎉',
          message: undefined,
          icon: <CheckCircle className="h-4 w-4" />,
          actions: [
            { label: 'View Orders', variant: 'primary', onClick: () => goToOrders() },
            { label: 'Continue Shopping', variant: 'secondary', onClick: () => goToPublishers() },
          ],
          dismissible: true,
          timestamp: new Date(),
          afterMessageId: successMessage.id,
        })
        break

      case 'paymentFailed':
        const failedMessage: Message = {
          id: (Date.now() + 2).toString(),
          content: `❌ Payment failed: ${action.data}. Please try again or contact support if the issue persists.`,
          role: 'assistant',
          timestamp: new Date()
        }
        addMessage(failedMessage)
        // Show payment retry
        queueActionCard({
          id: `${Date.now()}-payment-failed`,
          type: 'payment',
          title: 'Payment Failed',
          message: String(action.data || ''),
          icon: <CreditCard className="h-4 w-4" />,
          actions: [
            { label: 'Try Again', variant: 'primary', onClick: () => goToCheckout() },
            { label: 'View Order', variant: 'secondary', onClick: () => goToOrders() },
          ],
          dismissible: true,
          timestamp: new Date(),
          afterMessageId: failedMessage.id,
        })
        break

      case 'orderDetails':
        const orderMessage: Message = {
          id: (Date.now() + 2).toString(),
          content: `Let me get the details for order ${action.data}. I'll navigate you to the orders page to see the full details.`,
          role: 'assistant',
          timestamp: new Date()
        }
        addMessage(orderMessage)
        try {
          router.push('/orders')
        } catch {
          try { window.location.assign('/orders') } catch {}
        }
        queueActionCard({
          id: `${Date.now()}-order-details`,
          type: 'orders',
          title: 'Go to Order Details',
          message: `Order ${action.data}`,
          icon: <Package className="h-4 w-4" />,
          actions: [
            { label: 'View Orders', variant: 'primary', onClick: () => goToOrders() },
          ],
          dismissible: true,
          timestamp: new Date(),
          afterMessageId: orderMessage.id,
        })
        break

      case 'recommend':
        const recommendMessage: Message = {
          id: (Date.now() + 2).toString(),
          content: `Based on your criteria "${action.data}", let me find some great recommendations for you!`,
          role: 'assistant',
          timestamp: new Date()
        }
        addMessage(recommendMessage)
        // In a real implementation, you'd apply filters based on the criteria
        queueActionCard({
          id: `${Date.now()}-recommend`,
          type: 'filter',
          title: 'Explore Recommendations',
          message: 'Refine or browse matches',
          icon: <Filter className="h-4 w-4" />,
          actions: [
            { label: 'Refine', variant: 'tertiary', onClick: () => openFilterDialog() },
            { label: 'Clear Filters', variant: 'secondary', onClick: () => clearFilters() },
          ],
          dismissible: true,
          timestamp: new Date(),
          afterMessageId: recommendMessage.id,
        })
        break

      case 'similarItems':
        const similarMessage: Message = {
          id: (Date.now() + 2).toString(),
          content: `Let me find items similar to ${action.data} for you!`,
          role: 'assistant',
          timestamp: new Date()
        }
        addMessage(similarMessage)
        break

      case 'bestDeals':
        const dealsMessage: Message = {
          id: (Date.now() + 2).toString(),
          content: `Let me show you the current best deals available!`,
          role: 'assistant',
          timestamp: new Date()
        }
        addMessage(dealsMessage)
        // In a real implementation, you'd apply filters for best deals
        break

      default:
        console.log('Unknown action type:', action.type)
    }
  }

  // Helper: enqueue a card and replace any existing cards
  const queueActionCard = (card: ActionCard) => {
    setActionCards((prev) => {
      // Clear all existing cards and add the new one
      return [card]
    })
  }

  const dismissActionCard = (id: string) => {
    setActionCards((prev) => prev.filter((c) => c.id !== id))
  }

  const getActionCardsForMessage = (messageId: string) => {
    return actionCards.filter((c) => c.afterMessageId === messageId)
  }

  const goToCheckout = () => {
    try { router.push('/checkout') } catch { try { window.location.assign('/checkout') } catch {} }
  }

  const goToOrders = () => {
    try { router.push('/orders') } catch { try { window.location.assign('/orders') } catch {} }
  }

  const goToPublishers = () => {
    try { router.push('/publishers') } catch { try { window.location.assign('/publishers') } catch {} }
  }

  const clearFilters = () => {
    applyFilters('RESET')
  }

  const openFilterDialog = () => {
    // Placeholder: navigate to publishers where filters are available
    goToPublishers()
  }


  const sendMessage = async (messageContent?: string) => {
    const content = messageContent || input.trim()
    if (!content || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: content,
      role: 'user',
      timestamp: new Date()
    }

    addMessage(userMessage)
    setInput('')
    setIsLoading(true)

    try {
      // Debug cart state before sending
      console.log('🛒 DEBUG: Raw cart state from context:', {
        cartItems: cartState.items,
        cartItemsLength: cartState.items.length,
        cartItemsType: typeof cartState.items,
        cartItemsIsArray: Array.isArray(cartState.items),
        cartItemsStringified: JSON.stringify(cartState.items, null, 2)
      })
      
      const cartStateForAPI = {
        items: cartState.items,
        totalItems: getTotalItems(),
        totalPrice: getTotalPrice()
      }
      
      console.log('🛒 DEBUG: Sending cart state to AI API:', {
        cartItems: cartState.items,
        totalItems: cartStateForAPI.totalItems,
        totalPrice: cartStateForAPI.totalPrice,
        cartItemsLength: cartState.items.length,
        cartStateStringified: JSON.stringify(cartStateForAPI, null, 2),
        cartItemsDetails: cartState.items.map(item => ({
          id: item.id,
          kind: item.kind,
          name: item.kind === 'site' ? item.site?.name : item.product?.name,
          quantity: item.quantity,
          price: item.kind === 'site' ? item.site?.publishing?.price : item.product?.priceDollars
        }))
      })

      // Abort any previous streaming request to prevent overlap
      if (inflightAbortRef.current) {
        try { 
          inflightAbortRef.current.abort() 
          console.log('🔄 Aborted previous request')
        } catch (e) {
          console.warn('Failed to abort previous request:', e)
        }
      }
      inflightAbortRef.current = new AbortController()
      console.log('🚀 Created new abort controller')

      console.log('📤 Sending request to API...')
      const response = await fetch('/api/ai-chat?stream=1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
        signal: inflightAbortRef.current.signal,
        body: JSON.stringify({
          message: userMessage.content,
          messages: messages,
          // Include preloaded config so the API doesn't need to fetch again
          config: config ?? undefined,
          // Include current URL for context-aware filtering
          currentUrl: window.location.href,
          // Include current cart state for accurate cart operations
          cartState: cartStateForAPI
        })
      })
      console.log(`📥 Received response: ${response.status}`)
      if (!response.ok) {
        // Try to parse JSON error, else generic
        let errText = 'Failed to send message'
        try { errText = await response.text() } catch {}
        throw new Error(errText)
      }
      
      if (!response.body) {
        throw new Error('No response body received')
      }

      // Create a placeholder assistant message to append chunks into
      const assistantId = (Date.now() + 1).toString()
      const assistantMessage: Message = {
        id: assistantId,
        content: '',
        role: 'assistant',
        timestamp: new Date()
      }
      addMessage(assistantMessage)

      // Simplified and reliable streaming implementation
      console.log('🚀 Starting reliable stream processing...')
      
      let accumulated = ''
      let controlBuffer = ''
      const executedActions = new Set<string>()
      const toolRegex = /\[\[TOOL\]\]({[\s\S]*?})\n/g
      const bracketToolTagRegex = /\[[A-Z_]+(?::[\s\S]*?)?\]/g
      
      try {
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        
        while (true) {
          const { done, value } = await reader.read()
          
          if (done) {
            console.log('✅ Stream completed successfully')
            break
          }
          
          // Process the chunk
          const chunk = decoder.decode(value, { stream: true })
          console.log(`📦 Received chunk: "${chunk.substring(0, 50)}${chunk.length > 50 ? '...' : ''}"`)
          
          // Handle tool events
          controlBuffer += chunk
          let match
          while ((match = toolRegex.exec(controlBuffer)) !== null) {
            try {
              const payload = JSON.parse(match[1])
              const key = `${payload.type}:${payload.data}`
              if (!executedActions.has(key)) {
                executedActions.add(key)
                await executeAction({ type: payload.type, data: payload.data }, cartStateForAPI)
              }
            } catch (e) {
              console.warn('Failed to handle tool event:', e)
            }
          }
          controlBuffer = controlBuffer.replace(toolRegex, '')
          
          // Clean and accumulate text
          const cleanedChunk = chunk
            .replace(toolRegex, '')
            .replace(bracketToolTagRegex, '')
          
          accumulated += cleanedChunk
          
          // Update the message in real-time
          updateMessage(assistantId, { content: accumulated })
        }
        
        // Clean up
        reader.releaseLock()
        
      } catch (error) {
        console.error('❌ Stream processing error:', error)
        updateMessage(assistantId, { content: 'Sorry, I encountered an error while processing your request. Please try again.' })
      }

      // Stream processing completed - no need for additional processing
      // The message has been updated in real-time during streaming
      console.log('✅ Stream processing completed successfully')
    } catch (error) {
      // Handle AbortError gracefully - this is expected when requests are cancelled
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request was aborted, this is expected behavior')
        // Don't show error message for aborted requests
        return
      }
      
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        role: 'assistant',
        timestamp: new Date()
      }
      addMessage(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Listen for programmatic message sending from search bar
  useAIMessageListener((message) => {
    if (message && !isLoading) {
      // Pass the message directly to sendMessage
      sendMessage(message)
    }
  })


  const applyFilters = (filterCommand: string) => {
    try {
      const currentUrl = new URL(window.location.href)
      
      if (filterCommand === 'RESET') {
        // Reset all filters - navigate to publishers page without any parameters
        router.replace('/publishers')
        return
      }
      
      // Parse filter parameters
      const filterParams = new URLSearchParams(filterCommand)
      const newParams = new URLSearchParams(currentUrl.search)
      
      // Apply each filter parameter
      for (const [key, value] of filterParams.entries()) {
        if (value === '' || value === null || value === undefined) {
          // Remove the parameter if value is empty
          newParams.delete(key)
        } else {
          // Set the parameter
          newParams.set(key, value)
        }
      }
      
      // Build new URL
      const newUrl = `/publishers${newParams.toString() ? `?${newParams.toString()}` : ''}`
      
      // Navigate to the new URL using replace to ensure proper detection
      router.replace(newUrl)
    } catch (error) {
      console.error('Error applying filters:', error)
    }
  }

  return (
    <div className="h-[calc(100dvh-3.5rem)] sm:h-[calc(100dvh-4rem)] flex flex-col relative text-white overflow-hidden max-w-3xl mx-auto w-full mt-14 sm:mt-16">
      {/* Solid Brand Background (from screenshot) */}
      <div className="absolute inset-0 bg-[#1f2230]"></div>
      
      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Header - minimal, balanced layout per HIG */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-black/10">
          <div className="flex items-center gap-2" aria-label="Assistant">
            <div className="h-6 w-6 rounded-md bg-white/10 border border-white/10 grid place-items-center" aria-hidden>
              <svg className="w-3.5 h-3.5 text-white/70" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="8" />
              </svg>
            </div>
            <div className="text-[13px] font-medium tracking-[-0.01em] text-white/90">Assistant</div>
          </div>
          <div className="flex items-center gap-0.5">
            {messages.length > 0 && (
              <Button
                aria-label="Clear chat"
                variant="ghost"
                size="sm"
                onClick={clearChat}
                className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/20"
                title="Clear chat"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              aria-label="Close assistant"
              variant="ghost"
              size="sm"
              onClick={() => {
                if (onClose) {
                  try { onClose() } catch {}
                  return
                }
                try { toggleSidebar() } catch {}
              }}
              className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Welcome Section - Only show when no messages */}
        {messages.length === 0 && (
          <div className="px-6 py-8">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="h-7 w-7 rounded-md bg-white/10 border border-white/10 grid place-items-center" aria-hidden>
                  <svg className="w-4 h-4 text-white/70" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="8" />
                  </svg>
                </div>
              </div>
              <div className="flex-1 text-white">
                <div className="text-[20px] font-semibold leading-6 mb-1 tracking-[-0.01em]">Hi,</div>
                <div className="text-[13px] text-white/70 mb-3">How can I assist you today?</div>
                <div className="flex items-center gap-2 text-[12px] text-white/60">
                  <span className="flex items-center gap-1">
                    <ShoppingCart className="h-3 w-3" />
                    Cart
                  </span>
                  <span className="flex items-center gap-1">
                    <CreditCard className="h-3 w-3" />
                    Payment
                  </span>
                  <span className="flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    Orders
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div
          className="flex-1 overflow-y-auto no-scrollbar px-6 py-3 space-y-3"
          role="log"
          aria-live="polite"
          aria-relevant="additions"
        >
          {configLoading && messages.length === 0 && (
            <div className="text-center text-white/60 py-6">
              <Bot className="h-8 w-8 mx-auto mb-3 opacity-60" />
              <p className="text-sm">Loading config…</p>
            </div>
          )}
          
          {messages.map((message) => (
            <div key={message.id} className="space-y-2 max-w-full overflow-hidden">
              <div
                className={cn(
                  "flex gap-2.5",
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'user' ? (
                  <div className="max-w-full sm:max-w-[85%] rounded-[12px] px-3 py-2 select-text bg-indigo-600/95 text-white selection:bg-indigo-500/30 selection:text-white border border-indigo-300/40 shadow-sm break-words">
                    <MarkdownRenderer content={message.content} variant="chatbot" />
                  </div>
                ) : (
                  <div className="w-full flex items-start gap-2">
                    <div className="flex-shrink-0 mt-0.5 h-6 w-6 rounded-md bg-white/10 border border-white/10 grid place-items-center" aria-hidden>
                      <svg className="w-3.5 h-3.5 text-white/70" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="12" r="8" />
                      </svg>
                    </div>
                    <div className="flex-1 select-text selection:bg-white/10 selection:text-white overflow-hidden">
                      <div className="inline-block max-w-full sm:max-w-[90%] rounded-[12px] px-3 py-2 bg-white/10 border border-white/10 text-white/95 shadow-sm break-words">
                        <MarkdownRenderer content={message.content} variant="chatbot" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action cards are shown in bottom dock; nothing inline here */}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-full flex items-start gap-2">
                <div className="flex-shrink-0 mt-0.5 h-6 w-6 rounded-md bg-white/10 border border-white/10 grid place-items-center" aria-hidden>
                  <svg className="w-3.5 h-3.5 text-white/70" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="8" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>


        {/* Bottom Dock: Action cards above input */}
        <div className="px-6 pb-4">
          {/* Action Dock */}
          {actionCards.length > 0 && (
            <div className="mb-3 space-y-2">
              {actionCards.map((card) => (
                <ChatActionCard key={card.id} card={card} onDismiss={() => dismissActionCard(card.id)} />
              ))}
            </div>
          )}

          {/* Input Field */}
          <div className="relative">
            <div className="bg-white/5 rounded-[12px] p-3 border border-white/10 focus-within:border-white/20 focus-within:bg-white/[0.07] transition-colors">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Message Assistant"
                aria-label="Message Assistant"
                disabled={isLoading}
                className="w-full bg-transparent text-white placeholder-white/55 resize-none focus:outline-none text-[13px] leading-5 border-0 selection:bg-white/10 selection:text-white focus:ring-0 focus:border-0"
                rows={2}
              />
              <div className="flex items-center justify-end mt-2">
                
                <div className="flex items-center gap-1.5">
                  <button
                    aria-label="Voice input"
                    className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-white/70 focus-visible:ring-2 focus-visible:ring-white/20"
                  >
                    <Mic className="h-3 w-3" />
                  </button>
                  <Button
                    aria-label="Send message"
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || isLoading}
                    size="sm"
                    className="bg-indigo-600/90 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-md border border-indigo-400/30 focus-visible:ring-2 focus-visible:ring-indigo-300/30"
                  >
                    <Send className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
