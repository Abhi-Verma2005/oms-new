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

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

interface AIChatbotSidebarProps {
  onClose?: () => void
}

export function AIChatbotSidebar({ onClose }: AIChatbotSidebarProps) {
  const router = useRouter()
  const { config, configLoading } = useAIChatbot()
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
  const { messages, addMessage, clearMessages, isLoading, setIsLoading } = useChat()
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

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

  // Process AI response and handle all possible actions
  const processAIResponse = async (response: string, apiCartState?: any) => {
    let cleanResponse = response
    let actions: Array<{ type: string; data: any }> = []

    // Extract all action commands from the response
    const actionPatterns = [
      { pattern: /\[NAVIGATE:([^\]]+)\]/g, type: 'navigate' },
      { pattern: /\[FILTER:([^\]]+)\]/g, type: 'filter' },
      { pattern: /\[ADD_TO_CART:([^\]]+)\]/g, type: 'addToCart' },
      { pattern: /\[REMOVE_FROM_CART:([^\]]+)\]/g, type: 'removeFromCart' },
      { pattern: /\[VIEW_CART\]/g, type: 'viewCart' },
      { pattern: /\[CLEAR_CART\]/g, type: 'clearCart' },
      { pattern: /\[CART_SUMMARY\]/g, type: 'cartSummary' },
      { pattern: /\[PROCEED_TO_CHECKOUT\]/g, type: 'proceedToCheckout' },
      { pattern: /\[VIEW_ORDERS\]/g, type: 'viewOrders' },
      { pattern: /\[PAYMENT_SUCCESS:([^\]]+)\]/g, type: 'paymentSuccess' },
      { pattern: /\[PAYMENT_FAILED:([^\]]+)\]/g, type: 'paymentFailed' },
      { pattern: /\[ORDER_DETAILS:([^\]]+)\]/g, type: 'orderDetails' },
      { pattern: /\[RECOMMEND:([^\]]+)\]/g, type: 'recommend' },
      { pattern: /\[SIMILAR_ITEMS:([^\]]+)\]/g, type: 'similarItems' },
      { pattern: /\[BEST_DEALS\]/g, type: 'bestDeals' }
    ]

    // Extract all actions
    actionPatterns.forEach(({ pattern, type }) => {
      const matches = [...response.matchAll(pattern)]
      matches.forEach(match => {
        actions.push({
          type,
          data: match[1] || true // Use the captured group or true for no-param actions
        })
        // Remove the action from the response text
        cleanResponse = cleanResponse.replace(match[0], '').trim()
      })
    })

    // Add the clean response message
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: cleanResponse || 'Processing your request...',
      role: 'assistant',
      timestamp: new Date()
    }

    addMessage(assistantMessage)

    // Execute actions in sequence
    for (const action of actions) {
      await executeAction(action, apiCartState)
    }
  }

  // Execute individual actions
  const executeAction = async (action: { type: string; data: any }, apiCartState?: any) => {
    switch (action.type) {
      case 'navigate':
        setTimeout(() => {
          router.push(action.data)
        }, 1000)
        break

      case 'filter':
        setTimeout(() => {
          applyFilters(action.data)
        }, 500)
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
        break

      case 'proceedToCheckout':
        const cartItemCount = apiCartState?.totalItems ?? getTotalItems()
        if (cartItemCount > 0) {
          setTimeout(() => {
            router.push('/checkout')
          }, 1000)
        } else {
          const emptyCartMessage: Message = {
            id: (Date.now() + 2).toString(),
            content: `Your cart is empty. Let me help you find some great items to add first!`,
            role: 'assistant',
            timestamp: new Date()
          }
          addMessage(emptyCartMessage)
        }
        break

      case 'viewOrders':
        setTimeout(() => {
          router.push('/orders')
        }, 1000)
        break

      case 'paymentSuccess':
        const successMessage: Message = {
          id: (Date.now() + 2).toString(),
          content: `🎉 Payment successful! Your order has been confirmed. Let me show you your orders.`,
          role: 'assistant',
          timestamp: new Date()
        }
        addMessage(successMessage)
        setTimeout(() => {
          router.push('/orders')
        }, 2000)
        break

      case 'paymentFailed':
        const failedMessage: Message = {
          id: (Date.now() + 2).toString(),
          content: `❌ Payment failed: ${action.data}. Please try again or contact support if the issue persists.`,
          role: 'assistant',
          timestamp: new Date()
        }
        addMessage(failedMessage)
        break

      case 'orderDetails':
        const orderMessage: Message = {
          id: (Date.now() + 2).toString(),
          content: `Let me get the details for order ${action.data}. I'll navigate you to the orders page to see the full details.`,
          role: 'assistant',
          timestamp: new Date()
        }
        addMessage(orderMessage)
        setTimeout(() => {
          router.push('/orders')
        }, 1500)
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

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
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

      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send message')
      }

      const data = await response.json()
      
      // Debug AI response and cart state
      
      console.log('🛒 DEBUG: Received AI response:', {
        response: data.response,
        cartState: data.cartState,
        cartStateType: typeof data.cartState,
        cartStateKeys: data.cartState ? Object.keys(data.cartState) : 'null',
        cartItems: data.cartState?.items,
        cartItemsLength: data.cartState?.items?.length,
        totalItems: data.cartState?.totalItems,
        totalPrice: data.cartState?.totalPrice
      })
      
      // Process the response and handle all possible actions
      await processAIResponse(data.response, data.cartState)
    } catch (error) {
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

  const clearChat = () => {
    clearMessages()
  }

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
    <div className="h-[100dvh] flex flex-col relative text-white overflow-hidden max-w-3xl mx-auto w-full">
      {/* Solid Brand Background (from screenshot) */}
      <div className="absolute inset-0 bg-[#1f2230]"></div>
      
      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Header with Menu */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-6 h-6 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <div className="w-3 h-3 bg-white/60 rounded"></div>
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full"></div>
            </div>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Welcome Section - Only show when no messages */}
        {messages.length === 0 && (
          <div className="p-6 pt-16">
            <div className="flex items-center gap-2">
              <div className="flex-shrink-0">
                <svg
                  className="fill-violet-500"
                  xmlns="http://www.w3.org/2000/svg"
                  width={24}
                  height={24}
                  viewBox="0 0 32 32"
                >
                  <path d="M31.956 14.8C31.372 6.92 25.08.628 17.2.044V5.76a9.04 9.04 0 0 0 9.04 9.04h5.716ZM14.8 26.24v5.716C6.92 31.372.63 25.08.044 17.2H5.76a9.04 9.04 0 0 1 9.04 9.04Zm11.44-9.04h5.716c-.584 7.88-6.876 14.172-14.756 14.756V26.24a9.04 9.04 0 0 1 9.04-9.04ZM.044 14.8C.63 6.92 6.92.628 14.8.044V5.76a9.04 9.04 0 0 1-9.04 9.04H.044Z" />
                </svg>
              </div>
              <div className="flex-1 text-white">
                <div className="text-2xl font-bold mb-1">Hi,</div>
                <div className="text-base text-white/80 mb-2">How can I assist you today?</div>
                <div className="flex items-center gap-2 text-xs text-white/60">
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
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {configLoading && messages.length === 0 && (
            <div className="text-center text-white/60 py-6">
              <Bot className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Loading config…</p>
            </div>
          )}
          
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'user' ? (
                <div className="max-w-[85%] rounded-xl px-3 py-2 select-text backdrop-blur-sm bg-violet-600/90 text-white selection:bg-violet-400 selection:text-white border border-violet-500/30">
                  <MarkdownRenderer content={message.content} variant="chatbot" />
                </div>
              ) : (
                <div className="w-full flex items-start gap-2">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg
                      className="fill-violet-500"
                      xmlns="http://www.w3.org/2000/svg"
                      width={16}
                      height={16}
                      viewBox="0 0 32 32"
                    >
                      <path d="M31.956 14.8C31.372 6.92 25.08.628 17.2.044V5.76a9.04 9.04 0 0 0 9.04 9.04h5.716ZM14.8 26.24v5.716C6.92 31.372.63 25.08.044 17.2H5.76a9.04 9.04 0 0 1 9.04 9.04Zm11.44-9.04h5.716c-.584 7.88-6.876 14.172-14.756 14.756V26.24a9.04 9.04 0 0 1 9.04-9.04ZM.044 14.8C.63 6.92 6.92.628 14.8.044V5.76a9.04 9.04 0 0 1-9.04 9.04H.044Z" />
                    </svg>
                  </div>
                  <div className="flex-1 select-text selection:bg-violet-500/20 selection:text-white">
                    <MarkdownRenderer content={message.content} variant="chatbot" />
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-full flex items-start gap-2">
                <div className="flex-shrink-0 mt-0.5">
                  <svg
                    className="fill-violet-500"
                    xmlns="http://www.w3.org/2000/svg"
                    width={16}
                    height={16}
                    viewBox="0 0 32 32"
                  >
                    <path d="M31.956 14.8C31.372 6.92 25.08.628 17.2.044V5.76a9.04 9.04 0 0 0 9.04 9.04h5.716ZM14.8 26.24v5.716C6.92 31.372.63 25.08.044 17.2H5.76a9.04 9.04 0 0 1 9.04 9.04Zm11.44-9.04h5.716c-.584 7.88-6.876 14.172-14.756 14.756V26.24a9.04 9.04 0 0 1 9.04-9.04ZM.044 14.8C.63 6.92 6.92.628 14.8.044V5.76a9.04 9.04 0 0 1-9.04 9.04H.044Z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>


        {/* Input Area */}
        <div className="px-6 pb-4">

          {/* Input Field */}
          <div className="relative">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask anything, @models, / prompts"
                disabled={isLoading}
                className="w-full bg-transparent text-white placeholder-white/60 resize-none focus:outline-none text-sm border-0 selection:bg-violet-500/20 selection:text-white focus:ring-0 focus:border-0"
                rows={2}
              />
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1.5">
                  <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-md px-2 py-1 text-xs font-medium flex items-center gap-1 transition-colors border border-white/30">
                    <div className="w-1.5 h-1.5 bg-violet-300 rounded-sm"></div>
                    Think (R1)
                  </button>
                  <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-md px-2 py-1 text-xs font-medium flex items-center gap-1 transition-colors border border-white/30">
                    <Globe className="h-2.5 w-2.5" />
                    Search
                  </button>
                </div>
                <div className="flex items-center gap-1.5">
                  <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                    <Mic className="h-3 w-3 text-white/60" />
                  </button>
                  <Button
                    onClick={sendMessage}
                    disabled={!input.trim() || isLoading}
                    size="sm"
                    className="bg-violet-600/90 hover:bg-violet-700 text-white px-3 py-1.5 rounded-lg backdrop-blur-sm border border-violet-500/30"
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
