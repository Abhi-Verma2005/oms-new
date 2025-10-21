"use client"

import React, { useState, useRef, useEffect } from 'react'

// TypeScript declarations for speech recognition
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}
import { useRouter, usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
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
import { useUserContextForAI, useUserContextStore } from '@/stores/user-context-store'
import { MarkdownRenderer } from './markdown-renderer'
import { useAIMessageListener } from '@/lib/ai-chat-utils'
import DocumentUpload from './DocumentUpload'
import { useResizableLayout } from './resizable-layout'
import ChatActionCard from '@/components/chat/ChatActionCard'
import type { ChatActionCardModel } from '@/components/chat/ChatActionCard'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

interface UploadedFile {
  id: string
  name: string
  type: string
  size: number
  extractedText: string
  success: boolean
  method: string
  uploadedAt: string
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
  const { theme } = useTheme()

  // Helper function to clean tool tags from text for display
  const cleanToolTagsFromText = (text: string): string => {
    // Remove all tool tags like [FILTER:...], [NAVIGATE:...], etc.
    // Also remove any incomplete tool tags that might cause horizontal scrolling
    return text
      .replace(/\[[A-Z_]+(?::[^\]]*)?\]/g, '') // Complete tool tags
      .replace(/\[[A-Z_]*$/g, '') // Incomplete tool tags at end of text
      .replace(/\[[A-Z_]*:[^\]]*$/g, '') // Incomplete tool tags with colon
      .replace(/\[[A-Z_]*&[^\]]*$/g, '') // Incomplete tool tags with ampersand
      .replace(/\[[A-Z_]*=[^\]]*$/g, '') // Incomplete tool tags with equals
      .replace(/\[[A-Z_]*\s[^\]]*$/g, '') // Incomplete tool tags with spaces
      .replace(/\[[A-Z_]*\w[^\]]*$/g, '') // Any incomplete tool tag patterns
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
  }
  const pathname = usePathname()
  const { } = useAIChatbot()
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
  const { getUserContextForAI, refreshUserData, isLoading: userContextLoading } = useUserContextForAI()
  
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
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedFile[]>([])
  const [selectedDocuments, setSelectedDocuments] = useState<UploadedFile[]>([])
  const [showDocumentDropdown, setShowDocumentDropdown] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const inflightAbortRef = useRef<AbortController | null>(null)
  const [actionCards, setActionCards] = useState<ActionCard[]>([])
  // RAG Integration Indicators
  const [ragContext, setRagContext] = useState<{
    sources: string[]
    cacheHit: boolean
    contextCount: number
    hasRelevantContext?: boolean
    confidence?: number
  } | null>(null)
  
  // Speech-to-text state
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const [speechError, setSpeechError] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const prevCartCountRef = useRef<number>(cartState.items.length)
  const didMountRef = useRef<boolean>(false)
  
  // Refresh user context only once on mount if not already loaded
  useEffect(() => {
    const { user, isLoading } = useUserContextStore.getState()
    if (!user && !isLoading) {
      refreshUserData()
    }
  }, []) // Empty dependency array - only run once on mount

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        if (SpeechRecognition) {
          setSpeechSupported(true)
          const recognition = new SpeechRecognition()
          recognition.continuous = false
          recognition.interimResults = false
          recognition.lang = 'en-US'
        
        recognition.onstart = () => {
          setIsListening(true)
          setSpeechError(null) // Clear any previous errors
        }
        
        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0])
            .map((result: any) => result.transcript)
            .join('')
          
          if (transcript.trim()) {
            setInput(prev => prev + (prev ? ' ' : '') + transcript)
          }
        }
        
        recognition.onend = () => {
          setIsListening(false)
          // Focus the input field after speech recognition ends
          setTimeout(() => {
            if (inputRef.current) {
              inputRef.current.focus()
            }
          }, 100)
        }
        
        recognition.onerror = (event: any) => {
          // Use console.warn instead of console.error to avoid Next.js treating it as unhandled error
          console.warn('Speech recognition error:', event.error)
          setIsListening(false)
          
          // Handle different error types gracefully
          let errorMessage: string | null = null
          switch (event.error) {
            case 'not-allowed':
              errorMessage = 'Microphone access denied. Please allow microphone access to use voice input.'
              break
            case 'no-speech':
              errorMessage = 'No speech detected. Please try again.'
              break
            case 'network':
              errorMessage = 'Network error occurred. Please check your internet connection and try again.'
              // Clear error after a delay to allow retry
              setTimeout(() => setSpeechError(null), 3000)
              break
            case 'aborted':
              // User manually stopped or component unmounted - this is expected
              break
            case 'audio-capture':
              errorMessage = 'Audio capture failed. Please check your microphone.'
              break
            case 'service-not-allowed':
              errorMessage = 'Speech recognition service not allowed. Please check your browser settings.'
              break
            default:
              errorMessage = `Speech recognition error: ${event.error}`
          }
          
          if (errorMessage) {
            setSpeechError(errorMessage)
          }
        }
        
        recognitionRef.current = recognition
        }
      } catch (error) {
        console.warn('Failed to initialize speech recognition:', error)
        setSpeechSupported(false)
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [])

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
        // Don't create a message here - let the AI response handle the messaging
        // Just return a temporary ID for the action card
        return `temp-${Date.now()}`
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
      updateMessage(options.targetMessageId, { content: cleanResponse || 'I apologize, but I encountered an issue processing your request. Please try again.' })
    } else {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: cleanResponse || 'I apologize, but I encountered an issue processing your request. Please try again.',
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

    // Enhanced heuristic: extract comprehensive filters from user text when AI didn't emit [FILTER:...] tag
    if (actions.length === 0) {
      try {
        const source = (options?.userText || cleanResponse || '').toLowerCase().replace(/,/g, '')
        
        // Check for clear/reset commands first
        if (/(?:clear\s*filters?|reset\s*filters?|remove\s*all\s*filters?|no\s*filters?)/i.test(source)) {
          actions.push({ type: 'filter', data: 'RESET' })
          return
        }
        
        const qp = new URLSearchParams()
        
        // Extract TAT filters FIRST to avoid interference with price extraction
        const tatDaysMatch = source.match(/(?:tat\s*days?|tat\s*day|turnaround\s*days?|turnaround|tat)\s*(?:min|minimum|at\s*least)?\s*(\d+)/i)
        if (tatDaysMatch) {
          qp.set('tatDaysMin', tatDaysMatch[1])
        }

        const tatDaysMaxMatch = source.match(/(?:tat\s*days?|tat\s*day|turnaround\s*days?|turnaround|tat)\s*(?:max|maximum|at\s*most|up\s*to)\s*(\d+)/i)
        if (tatDaysMaxMatch) {
          qp.set('tatDaysMax', tatDaysMaxMatch[1])
        }

        const simpleTatMatch = source.match(/\btat\s+(?:min\s+)?(\d+)/i)
        if (simpleTatMatch) {
          qp.set('tatDaysMin', simpleTatMatch[1])
        }
        
        // Extract price filters - be more specific to avoid false positives
        const numbers = Array.from(source.matchAll(/(?:\$|usd|inr|rs\.?|€|price|cost)\s*(\d{2,7})(?:\.\d+)?/g)).map(m => parseInt(m[1], 10)).filter(n => !isNaN(n))
        let priceMin: number | undefined
        let priceMax: number | undefined

        // Extract explicit price min and max phrases with nearest following number
        const maxMatch = source.match(/(?:price\s*max|price\s*maximum|cost\s*max|cost\s*maximum|max\s*price|maximum\s*price|at\s*most|up\s*to|upto)\s*(?:is\s*)?(\d{2,7})/i)
        const minMatch = source.match(/(?:price\s*min|price\s*minimum|cost\s*min|cost\s*minimum|min\s*price|minimum\s*price|at\s*least|lowest)\s*(?:is\s*)?(\d{2,7})/i)
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

        if (priceMin !== undefined) qp.set('priceMin', String(priceMin))
        if (priceMax !== undefined) qp.set('priceMax', String(priceMax))

        // Extract niche/category filters
        const nichePatterns = [
          { pattern: /(?:tech|technology|tech\s*sites?|tech\s*websites?)/i, value: 'technology' },
          { pattern: /(?:health|healthcare|medical|health\s*sites?)/i, value: 'health' },
          { pattern: /(?:finance|financial|fintech|finance\s*sites?)/i, value: 'finance' },
          { pattern: /(?:business|corporate|business\s*sites?)/i, value: 'business' },
          { pattern: /(?:lifestyle|fashion|beauty|lifestyle\s*sites?)/i, value: 'lifestyle' },
          { pattern: /(?:travel|tourism|travel\s*sites?)/i, value: 'travel' },
          { pattern: /(?:food|cooking|recipe|food\s*sites?)/i, value: 'food' },
          { pattern: /(?:sports|fitness|sports\s*sites?)/i, value: 'sports' },
          { pattern: /(?:education|learning|academic|education\s*sites?)/i, value: 'education' },
          { pattern: /(?:entertainment|gaming|music|entertainment\s*sites?)/i, value: 'entertainment' },
          { pattern: /(?:news|news\s*sites?|media)/i, value: 'news' },
          { pattern: /(?:blog|blogs?|blogging)/i, value: 'blog' },
          { pattern: /(?:ecommerce|e-commerce|shop|shopping)/i, value: 'ecommerce' }
        ]
        
        for (const { pattern, value } of nichePatterns) {
          if (pattern.test(source)) {
            qp.set('niche', value)
            break
          }
        }

        // Extract language filters - be more specific to avoid false positives
        const languagePatterns = [
          { pattern: /(?:english|english\s*language|language\s*english)/i, value: 'en' },
          { pattern: /(?:spanish|spanish\s*language|language\s*spanish)/i, value: 'es' },
          { pattern: /(?:french|french\s*language|language\s*french)/i, value: 'fr' },
          { pattern: /(?:german|german\s*language|language\s*german)/i, value: 'de' },
          { pattern: /(?:italian|italian\s*language|language\s*italian)/i, value: 'it' },
          { pattern: /(?:portuguese|portuguese\s*language|language\s*portuguese)/i, value: 'pt' }
        ]
        
        for (const { pattern, value } of languagePatterns) {
          if (pattern.test(source)) {
            qp.set('language', value)
            break
          }
        }

        // Extract country filters
        const countryPatterns = [
          { pattern: /(?:us|usa|united\s*states|america)/i, value: 'US' },
          { pattern: /(?:uk|united\s*kingdom|britain|british)/i, value: 'UK' },
          { pattern: /(?:canada|canadian)/i, value: 'CA' },
          { pattern: /(?:australia|australian)/i, value: 'AU' },
          { pattern: /(?:germany|german)/i, value: 'DE' },
          { pattern: /(?:france|french)/i, value: 'FR' },
          { pattern: /(?:spain|spanish)/i, value: 'ES' },
          { pattern: /(?:italy|italian)/i, value: 'IT' },
          { pattern: /(?:india|indian)/i, value: 'IN' },
          { pattern: /(?:japan|japanese)/i, value: 'JP' },
          { pattern: /(?:china|chinese)/i, value: 'CN' },
          { pattern: /(?:brazil|brazilian)/i, value: 'BR' },
          { pattern: /(?:mexico|mexican)/i, value: 'MX' },
          { pattern: /(?:russia|russian)/i, value: 'RU' },
          { pattern: /(?:south\s*korea|korean)/i, value: 'KR' }
        ]
        
        for (const { pattern, value } of countryPatterns) {
          if (pattern.test(source)) {
            qp.set('country', value)
            break
          }
        }

        // Extract domain authority filters
        const daMatch = source.match(/(?:da|domain\s*authority|authority)\s*(?:min|minimum|at\s*least)?\s*(\d+)/i)
        if (daMatch) {
          qp.set('daMin', daMatch[1])
        }

        // Extract page authority filters
        const paMatch = source.match(/(?:pa|page\s*authority)\s*(?:min|minimum|at\s*least)?\s*(\d+)/i)
        if (paMatch) {
          qp.set('paMin', paMatch[1])
        }

        // Extract domain rating filters
        const drMatch = source.match(/(?:dr|domain\s*rating)\s*(?:min|minimum|at\s*least)?\s*(\d+)/i)
        if (drMatch) {
          qp.set('drMin', drMatch[1])
        }

        // Extract spam score filters
        const spamMatch = source.match(/(?:spam\s*score|spam)\s*(?:max|maximum|at\s*most)?\s*(\d+)/i)
        if (spamMatch) {
          qp.set('spamMax', spamMatch[1])
        }

        // Extract traffic filters
        const trafficMatch = source.match(/(?:traffic|visitors?)\s*(?:min|minimum|at\s*least)?\s*(\d+)/i)
        if (trafficMatch) {
          qp.set('semrushOverallTrafficMin', trafficMatch[1])
        }

        // Extract link type filters
        if (/(?:dofollow|do\s*follow)/i.test(source)) {
          qp.set('backlinkNature', 'dofollow')
        } else if (/(?:nofollow|no\s*follow)/i.test(source)) {
          qp.set('backlinkNature', 'nofollow')
        } else if (/(?:sponsored|sponsor)/i.test(source)) {
          qp.set('backlinkNature', 'sponsored')
        }

        // Extract availability filters
        if (/(?:available|availability)/i.test(source)) {
          qp.set('availability', 'true')
        }

        // Extract days/time-based filters
        const daysMatch = source.match(/(?:min|minimum|at\s*least)\s*(\d+)\s*(?:days?|day)/i)
        if (daysMatch) {
          // This could be for various time-based filters, let's set a generic one
          qp.set('lastPublishedAfter', new Date(Date.now() - parseInt(daysMatch[1]) * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        }


        // Extract backlinks allowed minimum
        const backlinksMatch = source.match(/(?:backlinks?\s*allowed?|backlinks?)\s*(?:min|minimum|at\s*least)?\s*(\d+)/i)
        if (backlinksMatch) {
          qp.set('backlinksAllowedMin', backlinksMatch[1])
        }

        // Extract outbound link limits
        const outboundMatch = source.match(/(?:outbound\s*links?|outbound)\s*(?:max|maximum|at\s*most|limit)\s*(\d+)/i)
        if (outboundMatch) {
          qp.set('outboundLinkLimitMax', outboundMatch[1])
        }

        // Extract link placement filters
        if (/(?:in\s*content|content\s*placement|article\s*content)/i.test(source)) {
          qp.set('linkPlacement', 'in-content')
        } else if (/(?:author\s*bio|bio\s*placement|author\s*section)/i.test(source)) {
          qp.set('linkPlacement', 'author-bio')
        } else if (/(?:footer\s*placement|footer\s*link)/i.test(source)) {
          qp.set('linkPlacement', 'footer')
        }

        // Extract permanence filters
        if (/(?:lifetime|permanent|forever)/i.test(source)) {
          qp.set('permanence', 'lifetime')
        } else if (/(?:12\s*months?|twelve\s*months?|12\s*month|temporary)/i.test(source)) {
          qp.set('permanence', '12-months')
        }

        // Extract traffic trend filters
        if (/(?:increasing\s*traffic|trending\s*up|growth|growing)/i.test(source)) {
          qp.set('trend', 'increasing')
        } else if (/(?:stable\s*traffic|steady|consistent)/i.test(source)) {
          qp.set('trend', 'stable')
        } else if (/(?:decreasing\s*traffic|trending\s*down|declining|decline)/i.test(source)) {
          qp.set('trend', 'decreasing')
        }

        // Extract SEO tool filters
        if (/(?:semrush|sem\s*rush)/i.test(source)) {
          qp.set('tool', 'Semrush')
        } else if (/(?:ahrefs|ah\s*refs)/i.test(source)) {
          qp.set('tool', 'Ahrefs')
        }

        // Extract organic traffic filters
        const organicTrafficMatch = source.match(/(?:organic\s*traffic|organic)\s*(?:min|minimum|at\s*least)?\s*(\d+)/i)
        if (organicTrafficMatch) {
          qp.set('semrushOrganicTrafficMin', organicTrafficMatch[1])
        }

        // Extract high authority patterns
        if (/(?:high\s*authority|high\s*da|authority\s*70\+|da\s*70\+)/i.test(source)) {
          qp.set('daMin', '70')
        }

        // Extract low spam patterns
        if (/(?:low\s*spam|spam\s*score\s*low|clean\s*sites?)/i.test(source)) {
          qp.set('spamMax', '3')
        }

        // Extract dofollow patterns
        if (/(?:dofollow\s*only|only\s*dofollow|dofollow\s*links?)/i.test(source)) {
          qp.set('backlinkNature', 'dofollow')
        }

        // Apply filters if any were found
        if (qp.toString()) {
          console.log('🔍 [AI] Detected filters from text:', qp.toString())
          actions.push({ type: 'filter', data: qp.toString() })
        } else {
          console.log('🔍 [AI] No filters detected from text:', source)
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
          const daMin = fp.get('daMin')
          const paMin = fp.get('paMin')
          const drMin = fp.get('drMin')
          const spamMax = fp.get('spamMax')
          const tatDaysMin = fp.get('tatDaysMin')
          const tatDaysMax = fp.get('tatDaysMax')
          const backlinkNature = fp.get('backlinkNature')
          const linkPlacement = fp.get('linkPlacement')
          const permanence = fp.get('permanence')
          const trend = fp.get('trend')
          const tool = fp.get('tool')
          const trafficMin = fp.get('semrushOverallTrafficMin')
          const organicTrafficMin = fp.get('semrushOrganicTrafficMin')
          
          if (priceMin) parts.push(`min price $${priceMin}`)
          if (priceMax) parts.push(`max price $${priceMax}`)
          if (niche) parts.push(`niche ${niche}`)
          if (language) parts.push(`language ${language}`)
          if (country) parts.push(`country ${country}`)
          if (daMin) parts.push(`min DA ${daMin}`)
          if (paMin) parts.push(`min PA ${paMin}`)
          if (drMin) parts.push(`min DR ${drMin}`)
          if (spamMax) parts.push(`max spam ${spamMax}`)
          if (tatDaysMin) parts.push(`min TAT ${tatDaysMin} days`)
          if (tatDaysMax) parts.push(`max TAT ${tatDaysMax} days`)
          if (backlinkNature) parts.push(`${backlinkNature} links`)
          if (linkPlacement) parts.push(`${linkPlacement.replace('-', ' ')} placement`)
          if (permanence) parts.push(`${permanence} links`)
          if (trend) parts.push(`${trend} traffic`)
          if (tool) parts.push(`${tool} tool`)
          if (trafficMin) parts.push(`min traffic ${trafficMin}`)
          if (organicTrafficMin) parts.push(`min organic ${organicTrafficMin}`)

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
        // Show confirmation that items were added to cart
        const addToCartMessage: Message = {
          id: (Date.now() + 2).toString(),
          content: `Item added to cart.`,
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
      
      // Get user context for AI
      const userContextForAI = getUserContextForAI()
      
      console.log('👤 DEBUG: User context for AI:', {
        hasUserContext: !!userContextForAI,
        userBasic: userContextForAI?.basic,
        userProfile: userContextForAI?.profile,
        userRoles: userContextForAI?.roles,
        isAdmin: userContextForAI?.isAdmin
      })
      
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

      const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now()
      console.log('📤 [AI] Starting send flow (non-stream)')
      console.time && console.time('AI_FETCH')
      console.time && console.time('AI_TOTAL')
      console.time && console.time('AI_JSON_PARSE')
      console.timeEnd && console.timeEnd('AI_JSON_PARSE') // reset placeholder
      console.time && console.time('AI_PROCESS_RESPONSE')
      console.timeEnd && console.timeEnd('AI_PROCESS_RESPONSE') // reset placeholder
      console.log('📤 [AI] Sending request to API (streaming)...')
      try { window.dispatchEvent(new CustomEvent('AI_DEBUG', { detail: { step: 'beforeFetch', ts: Date.now() } })) } catch {}
      const response = await fetch('/api/ai-chat?stream=1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Provide a stable client id for ephemeral isolation without server persistence
          'x-client-id': (() => {
            try {
              const k = 'ai_client_id'
              let v = localStorage.getItem(k)
              if (!v) { v = Math.random().toString(36).slice(2); localStorage.setItem(k, v) }
              return v
            } catch { return 'ephemeral' }
          })()
        },
        cache: 'no-store',
        signal: inflightAbortRef.current.signal,
        body: JSON.stringify({
          message: userMessage.content,
          messages: messages,
          // Include current URL for context-aware filtering
          currentUrl: window.location.href,
          // Include current cart state for accurate cart operations
          cartState: cartStateForAPI,
          // Include user context for personalized responses
          userContext: userContextForAI,
          // Include only selected documents context
          uploadedDocuments: selectedDocuments.filter(doc => doc.success && doc.extractedText)
        })
      })
      console.log(`📥 [AI] Received response: ${response.status}`)
      try { window.dispatchEvent(new CustomEvent('AI_DEBUG', { detail: { step: 'afterFetch', status: response.status, ok: response.ok, ts: Date.now() } })) } catch {}
      if (!response.ok) {
        // Try to parse JSON error, else generic
        let errText = 'Failed to send message'
        try { errText = await response.text() } catch {}
        throw new Error(errText)
      }
      console.timeEnd && console.timeEnd('AI_FETCH')

      // Handle streaming response
      console.time && console.time('AI_STREAM_PARSE')
      
      if (!response.body) {
        throw new Error('No response body received')
      }
      
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''
      
      // Create assistant message for streaming
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: '',
        role: 'assistant',
        timestamp: new Date()
      }
      addMessage(assistantMessage)
      
      try { window.dispatchEvent(new CustomEvent('AI_DEBUG', { detail: { step: 'afterStreamStart', ts: Date.now() } })) } catch {}
      
      // Read stream chunks with throttling
      let lastUpdate = 0
      const updateThrottle = 200 // Update UI every 200ms max to reduce layout shifts
      let buffer = '' // Buffer for incomplete lines
      
      console.log('🔍 [AI] Starting stream parsing...')
      
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          console.log('🔍 [AI] Stream ended')
          break
        }
        
        const chunk = decoder.decode(value, { stream: true })
        console.log('🔍 [AI] Received chunk:', chunk.substring(0, 100) + '...')
        
        // Add chunk to buffer
        buffer += chunk
        
        // Process complete lines
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete line in buffer
        
        for (const line of lines) {
          if (line.trim() === '') continue // Skip empty lines
          
          console.log('🔍 [AI] Processing line:', line.substring(0, 100) + '...')
          
          if (line.startsWith('data: ')) {
            const data = line.slice(6) // Remove 'data: ' prefix
            
            if (data === '[DONE]') {
              console.log('🔍 [AI] Stream completed')
              break
            }
            
            try {
              const parsed = JSON.parse(data)
              console.log('🔍 [AI] Parsed JSON:', parsed)
              
              const content = parsed.choices?.[0]?.delta?.content
              console.log('🔍 [AI] Extracted content:', content)
              
              if (content) {
                fullText += content
                console.log('🔍 [AI] Full text so far:', fullText.substring(0, 100) + '...')
                
                // Clean tool tags from display text but keep them in fullText for processing
                const displayText = cleanToolTagsFromText(fullText)
                
                // Always update with cleaned text to prevent horizontal scrolling
                requestAnimationFrame(() => {
                  updateMessage(assistantMessage.id, { content: displayText })
                })
              }
            } catch (e) {
              // Skip invalid JSON lines
              console.warn('Failed to parse SSE data:', data, e)
            }
          }
        }
      }
      
      // Final update to ensure all content is displayed (with tool tags cleaned)
      console.log('🔍 [AI] Final full text:', fullText)
      const finalDisplayText = cleanToolTagsFromText(fullText)
      requestAnimationFrame(() => {
        updateMessage(assistantMessage.id, { content: finalDisplayText })
      })
      
      console.timeEnd && console.timeEnd('AI_STREAM_PARSE')
      
      // Check if we have a valid response
      if (!fullText || fullText.trim() === '') {
        console.warn('⚠️ [AI] Empty or invalid streaming response from API:', { fullText })
        console.log('🔍 [AI] Attempting fallback to non-streaming...')
        
        // Fallback: Try non-streaming request
        try {
          const fallbackResponse = await fetch('/api/ai-chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-client-id': (() => {
                try {
                  const k = 'ai_client_id'
                  let v = localStorage.getItem(k)
                  if (!v) { v = Math.random().toString(36).slice(2); localStorage.setItem(k, v) }
                  return v
                } catch { return Math.random().toString(36).slice(2) }
              })(),
            },
            body: JSON.stringify({
              message: content,
              messages: messages,
              currentUrl: window.location.href,
              cartState: cartStateForAPI,
              userId: undefined,
              // Include user context for personalized responses
              userContext: userContextForAI
            })
          })
          
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json()
            if (fallbackData.message) {
              updateMessage(assistantMessage.id, { content: fallbackData.message })
              console.log('✅ [AI] Fallback successful')
              // Process actions from fallback response
              try {
                await processAIResponse(fallbackData.message, cartStateForAPI, { 
                  targetMessageId: assistantMessage.id,
                  userText: content // Pass the original user message for heuristic extraction
                })
              } catch (e) {
                console.error('[AI] processAIResponse failed in fallback:', e)
              }
              return
            }
          }
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError)
        }
        
        updateMessage(assistantMessage.id, { content: 'I apologize, but I received an empty response. Please try again.' })
        return
      }
      
      try { window.dispatchEvent(new CustomEvent('AI_DEBUG', { detail: { step: 'beforeProcess', hasFinalText: !!fullText, ts: Date.now() } })) } catch {}
      
      // Process the final response for any actions
      // Add a small delay to ensure streaming UI has stabilized before executing tools
      setTimeout(async () => {
        try {
          await processAIResponse(fullText, cartStateForAPI, { 
            targetMessageId: assistantMessage.id,
            userText: content // Pass the original user message for heuristic extraction
          })
        } catch (e) {
          console.error('[AI] processAIResponse failed:', e)
          try { window.dispatchEvent(new CustomEvent('AI_DEBUG', { detail: { step: 'processError', ts: Date.now(), error: String(e) } })) } catch {}
          // Don't throw, just log the error
        }
      }, 150) // Small delay to prevent layout shifts
      
      try { window.dispatchEvent(new CustomEvent('AI_DEBUG', { detail: { step: 'afterProcess', ts: Date.now() } })) } catch {}

      const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now()
      const totalMs = Math.round((t1 - t0))
      const fetchMs = (() => {
        try {
          const navEntries = (performance?.getEntriesByType && performance.getEntriesByType('resource')) || []
          const last = Array.from(navEntries).reverse().find((e: any) => typeof e.name === 'string' && e.name.includes('/api/ai-chat')) as any
          if (last && typeof last.duration === 'number') return Math.round(last.duration)
        } catch {}
        return undefined
      })()
      const processMs = Math.round((t1 - t0)) // Use t0 since tBeforeProcess is not available in streaming
      console.log('✅ [AI] Frontend timings:', { totalMs, fetchMs, processMs })
      try { window.dispatchEvent(new CustomEvent('AI_DEBUG', { detail: { step: 'frontendTimings', totalMs, fetchMs, processMs, ts: Date.now() } })) } catch {}
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

  // Speech recognition handlers
  const startListening = () => {
    if (recognitionRef.current && !isListening && speechSupported) {
      try {
        setSpeechError(null) // Clear any previous errors
        recognitionRef.current.start()
      } catch (error) {
        console.warn('Failed to start speech recognition:', error)
        setIsListening(false)
        setSpeechError('Failed to start speech recognition. Please try again.')
      }
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop()
      } catch (error) {
        console.warn('Failed to stop speech recognition:', error)
      }
    }
  }

  const toggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
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
        // Defer navigation to prevent layout shift during streaming
        setTimeout(() => {
          router.replace('/publishers')
        }, 100)
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
      
      // Defer navigation to prevent layout shift during streaming
      // This allows the streaming animation to complete before page navigation
      setTimeout(() => {
        router.replace(newUrl)
      }, 100)
    } catch (error) {
      console.error('Error applying filters:', error)
    }
  }

  return (
    <div className="h-screen flex flex-col relative overflow-hidden max-w-3xl mx-auto w-full dark:text-white text-black">
      {/* Theme-aware Background */}
      <div className={cn(
        "absolute inset-0",
        theme === 'light' ? "bg-gradient-to-br from-[#f8f6ff] to-white" : "bg-[#1f2230]"
      )}></div>
      
      {/* Content */}
      <div className={cn(
        "relative z-10 h-full flex flex-col",
        pathname === '/checkout' ? '' : 'pt-14 sm:pt-16'
      )}>
        {/* Header - minimal, balanced layout per HIG */}
        <div className={cn(
          "flex items-center justify-between px-4 py-2.5 border-b",
          theme === 'light' 
            ? "border-[#6A5ACD]/20 bg-white/80 backdrop-blur-sm" 
            : "border-white/10 bg-black/10"
        )}>
          <div className="flex items-center gap-2" aria-label="Assistant">
            <div className={cn(
              "h-6 w-6 rounded-md border grid place-items-center",
              theme === 'light' 
                ? "bg-[#6A5ACD]/10 border-[#6A5ACD]/20" 
                : "bg-white/10 border-white/10"
            )} aria-hidden>
              <svg
                className="w-4 h-4 fill-violet-500"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 32 32"
                preserveAspectRatio="xMidYMid meet"
              >
                <path d="M31.956 14.8C31.372 6.92 25.08.628 17.2.044V5.76a9.04 9.04 0 0 0 9.04 9.04h5.716ZM14.8 26.24v5.716C6.92 31.372.63 25.08.044 17.2H5.76a9.04 9.04 0 0 1 9.04 9.04Zm11.44-9.04h5.716c-.584 7.88-6.876 14.172-14.756 14.756V26.24a9.04 9.04 0 0 1 9.04-9.04ZM.044 14.8C.63 6.92 6.92.628 14.8.044V5.76a9.04 9.04 0 0 1-9.04 9.04H.044Z" />
              </svg>
            </div>
            <div className={cn(
              "text-[13px] font-medium tracking-[-0.01em]",
              theme === 'light' ? "text-black" : "text-white/90"
            )}>Assistant</div>
          </div>
          <div className="flex items-center gap-0.5">
            {messages.length > 0 && (
              <Button
                aria-label="Clear chat"
                variant="ghost"
                size="sm"
                onClick={clearChat}
                className={cn(
                  "h-8 w-8 p-0 focus-visible:ring-2",
                  theme === 'light' 
                    ? "text-black/70 hover:text-black hover:bg-[#6A5ACD]/10 focus-visible:ring-[#6A5ACD]/30" 
                    : "text-white/70 hover:text-white hover:bg-white/10 focus-visible:ring-white/20"
                )}
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
              className={cn(
                "h-8 w-8 p-0 focus-visible:ring-2",
                theme === 'light' 
                  ? "text-black/70 hover:text-black hover:bg-[#6A5ACD]/10 focus-visible:ring-[#6A5ACD]/30" 
                  : "text-white/70 hover:text-white hover:bg-white/10 focus-visible:ring-white/20"
              )}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Welcome Section - Only show when no messages */}
        {messages.length === 0 && (
          <div className="px-6 py-8 space-y-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className={cn(
                  "h-7 w-7 rounded-md border grid place-items-center",
                  theme === 'light' 
                    ? "bg-[#6A5ACD]/10 border-[#6A5ACD]/20" 
                    : "bg-white/10 border-white/10"
                )} aria-hidden>
                  <svg
                    className="w-4 h-4 fill-violet-500"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 32 32"
                    preserveAspectRatio="xMidYMid meet"
                  >
                    <path d="M31.956 14.8C31.372 6.92 25.08.628 17.2.044V5.76a9.04 9.04 0 0 0 9.04 9.04h5.716ZM14.8 26.24v5.716C6.92 31.372.63 25.08.044 17.2H5.76a9.04 9.04 0 0 1 9.04 9.04Zm11.44-9.04h5.716c-.584 7.88-6.876 14.172-14.756 14.756V26.24a9.04 9.04 0 0 1 9.04-9.04ZM.044 14.8C.63 6.92 6.92.628 14.8.044V5.76a9.04 9.04 0 0 1-9.04 9.04H.044Z" />
                  </svg>
                </div>
              </div>
              <div className={cn(
                "flex-1",
                theme === 'light' ? "text-black" : "text-white"
              )}>
                <div className="text-[20px] font-semibold leading-6 mb-1 tracking-[-0.01em]">Hi,</div>
                <div className={cn(
                  "text-[13px] mb-3",
                  theme === 'light' ? "text-black/70" : "text-white/70"
                )}>How can I assist you today?</div>
                <div className={cn(
                  "flex items-center gap-2 text-[12px]",
                  theme === 'light' ? "text-black/60" : "text-white/60"
                )}>
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
          
          {messages.map((message) => (
            <div key={message.id} className="space-y-2 max-w-full overflow-hidden">
              <div
                className={cn(
                  "flex gap-2.5",
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'user' ? (
                  <div 
                    className={cn(
                      "max-w-full sm:max-w-[85%] rounded-[12px] px-3 py-2 select-text shadow-sm border text-white",
                      theme === 'light' 
                        ? "bg-[#6A5ACD] selection:bg-[#5a4ac0]/30 selection:text-white border-[#6A5ACD]/40" 
                        : "bg-indigo-600/95 selection:bg-indigo-500/30 selection:text-white border-indigo-300/40"
                    )}
                    style={{ display: 'block', contain: 'layout' }}
                  >
                    <MarkdownRenderer content={message.content} variant="chatbot" theme={theme as 'light' | 'dark'} isUserMessage={message.role === 'user'} />
                  </div>
                ) : (
                  <div className="w-full flex items-start gap-2">
                    <div className={cn(
                      "flex-shrink-0 mt-0.5 h-6 w-6 rounded-md border grid place-items-center",
                      theme === 'light' 
                        ? "bg-[#6A5ACD]/10 border-[#6A5ACD]/20" 
                        : "bg-white/10 border-white/10"
                    )} aria-hidden>
                      <svg
                        className="w-3.5 h-3.5 fill-violet-500"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 32 32"
                        preserveAspectRatio="xMidYMid meet"
                      >
                        <path d="M31.956 14.8C31.372 6.92 25.08.628 17.2.044V5.76a9.04 9.04 0 0 0 9.04 9.04h5.716ZM14.8 26.24v5.716C6.92 31.372.63 25.08.044 17.2H5.76a9.04 9.04 0 0 1 9.04 9.04Zm11.44-9.04h5.716c-.584 7.88-6.876 14.172-14.756 14.756V26.24a9.04 9.04 0 0 1 9.04-9.04ZM.044 14.8C.63 6.92 6.92.628 14.8.044V5.76a9.04 9.04 0 0 1-9.04 9.04H.044Z" />
                      </svg>
                    </div>
                    <div className={cn(
                      "flex-1 select-text overflow-hidden",
                      theme === 'light' 
                        ? "selection:bg-[#6A5ACD]/20 selection:text-black" 
                        : "selection:bg-white/10 selection:text-white"
                    )} style={{ minWidth: 0 }}>
                      <div 
                        className={cn(
                          "inline-block max-w-full sm:max-w-[90%] rounded-[12px] px-3 py-2 border shadow-sm break-words",
                          theme === 'light' 
                            ? "bg-white/90 border-[#6A5ACD]/20 text-black" 
                            : "bg-white/10 border-white/10 text-white/95"
                        )}
                        style={{ contain: 'layout', wordBreak: 'break-word' }}
                      >
                        <MarkdownRenderer content={message.content} variant="chatbot" theme={theme as 'light' | 'dark'} isUserMessage={false} />
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
                <div className={cn(
                  "flex-shrink-0 mt-0.5 h-6 w-6 rounded-md border grid place-items-center",
                  theme === 'light' 
                    ? "bg-[#6A5ACD]/10 border-[#6A5ACD]/20" 
                    : "bg-white/10 border-white/10"
                )} aria-hidden>
                  <svg
                    className="w-3.5 h-3.5 fill-violet-500"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 32 32"
                    preserveAspectRatio="xMidYMid meet"
                  >
                    <path d="M31.956 14.8C31.372 6.92 25.08.628 17.2.044V5.76a9.04 9.04 0 0 0 9.04 9.04h5.716ZM14.8 26.24v5.716C6.92 31.372.63 25.08.044 17.2H5.76a9.04 9.04 0 0 1 9.04 9.04Zm11.44-9.04h5.716c-.584 7.88-6.876 14.172-14.756 14.756V26.24a9.04 9.04 0 0 1 9.04-9.04ZM.044 14.8C.63 6.92 6.92.628 14.8.044V5.76a9.04 9.04 0 0 1-9.04 9.04H.044Z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex gap-1.5">
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full animate-bounce",
                      theme === 'light' ? "bg-[#6A5ACD]" : "bg-white/60"
                    )} />
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full animate-bounce",
                      theme === 'light' ? "bg-[#6A5ACD]" : "bg-white/60"
                    )} style={{ animationDelay: '0.1s' }} />
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full animate-bounce",
                      theme === 'light' ? "bg-[#6A5ACD]" : "bg-white/60"
                    )} style={{ animationDelay: '0.2s' }} />
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
            <div className="mb-3 space-y-2 pt-4">
              {actionCards.map((card) => (
                <ChatActionCard key={card.id} card={card} onDismiss={() => dismissActionCard(card.id)} />
              ))}
            </div>
          )}

          {/* Input Field with Integrated Document Context */}
          <div className="relative">
            <div className={cn(
              "rounded-lg p-2 border transition-colors",
              theme === 'light' 
                ? "bg-white/80 border-[#6A5ACD]/20 focus-within:border-[#6A5ACD]/40 focus-within:bg-white/90" 
                : "bg-white/5 border-white/10 focus-within:border-white/20 focus-within:bg-white/[0.07]"
            )}>
              {/* Document Context Selector - Integrated */}
              {uploadedDocuments.length > 0 && (
                <div className="mb-1 relative">
                  <div className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded border text-xs",
                    theme === 'light' 
                      ? "bg-[#6A5ACD]/10 border-[#6A5ACD]/20 text-[#6A5ACD]" 
                      : "bg-white/5 border-white/10 text-white/80"
                  )}>
                    <FileText className="h-3 w-3" />
                    <div className="flex-1 flex items-center gap-1">
                      <span className="font-medium">Context:</span>
                      {selectedDocuments.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {selectedDocuments.map((doc, index) => (
                            <span
                              key={doc.id}
                              className={cn(
                                "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs max-w-20",
                                theme === 'light' 
                                  ? "bg-[#6A5ACD] text-white" 
                                  : "bg-white/20 text-white"
                              )}
                              title={doc.name}
                            >
                              @{doc.name.length > 4 ? doc.name.substring(0, 4) + '...' : doc.name}
                              <button
                                onClick={() => setSelectedDocuments(prev => prev.filter(d => d.id !== doc.id))}
                                className="hover:opacity-70 flex-shrink-0"
                              >
                                <X className="h-2 w-2" />
                              </button>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="opacity-70 text-xs">None</span>
                      )}
                    </div>
                    <button
                      onClick={() => setShowDocumentDropdown(!showDocumentDropdown)}
                      className={cn(
                        "p-0.5 rounded hover:opacity-70",
                        theme === 'light' 
                          ? "hover:bg-[#6A5ACD]/20" 
                          : "hover:bg-white/10"
                      )}
                      title="Select documents"
                    >
                      <ChevronDown className={cn("h-3 w-3 transition-transform rotate-180", !showDocumentDropdown && "rotate-0")} />
                    </button>
                  </div>
                  
                  {/* Document Dropdown */}
                  {showDocumentDropdown && (
                    <div className={cn(
                      "absolute bottom-full left-0 right-0 z-50 mb-1 p-1.5 rounded border max-h-28 overflow-y-auto",
                      theme === 'light' 
                        ? "bg-white border-[#6A5ACD]/20 shadow-lg" 
                        : "bg-gray-900 border-white/20 shadow-lg"
                    )}>
                      {uploadedDocuments.map((doc) => (
                        <label
                          key={doc.id}
                          className={cn(
                            "flex items-center gap-1.5 p-1.5 rounded cursor-pointer hover:opacity-80",
                            theme === 'light' 
                              ? "hover:bg-[#6A5ACD]/10" 
                              : "hover:bg-white/10"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={selectedDocuments.some(d => d.id === doc.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedDocuments(prev => [...prev, doc])
                              } else {
                                setSelectedDocuments(prev => prev.filter(d => d.id !== doc.id))
                              }
                            }}
                            className="rounded"
                          />
                          <FileText className="h-3 w-3" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium truncate" title={doc.name}>
                              {doc.name.length > 12 ? doc.name.substring(0, 12) + '...' : doc.name}
                            </div>
                            <div className="text-xs opacity-70">
                              {doc.success ? `${doc.extractedText.length} chars` : 'Failed'}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Message Assistant"
                aria-label="Message Assistant"
                disabled={isLoading}
                className={cn(
                  "w-full bg-transparent resize-none focus:outline-none text-[12px] leading-4 border-0 focus:ring-0 focus:border-0",
                  theme === 'light' 
                    ? "text-black placeholder-black/60 selection:bg-[#6A5ACD]/20 selection:text-black" 
                    : "text-white placeholder-white/55 selection:bg-white/10 selection:text-white"
                )}
                rows={1}
              />
              <div className="flex items-center justify-end mt-1">
                {/* Speech error indicator */}
                {speechError && (
                  <div className="flex-1 mr-2">
                    <div className={cn(
                      "text-xs px-2 py-1 rounded-md flex items-center justify-between",
                      theme === 'light' 
                        ? "bg-red-50 text-red-600 border border-red-200" 
                        : "bg-red-900/20 text-red-400 border border-red-800/30"
                    )}>
                      <span>{speechError}</span>
                      <button
                        onClick={() => setSpeechError(null)}
                        className="ml-2 hover:opacity-70"
                        aria-label="Dismiss error"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-1.5">
                  {/* Document Upload Button */}
                  <button
                    aria-label="Upload document"
                    onClick={() => {
                      const input = document.createElement('input')
                      input.type = 'file'
                      input.multiple = true
                      input.accept = '.pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg'
                      input.onchange = async (e) => {
                        const files = (e.target as HTMLInputElement).files
                        if (files && files.length > 0) {
                          const uploadedFiles: UploadedFile[] = []
                          for (let i = 0; i < files.length; i++) {
                            try {
                              const formData = new FormData()
                              formData.append('file', files[i])
                              const response = await fetch('/api/upload-documents', {
                                method: 'POST',
                                body: formData,
                              })
                              if (response.ok) {
                                const result = await response.json()
                                uploadedFiles.push(result)
                              }
                            } catch (error) {
                              console.error('Upload failed:', files[i].name, error)
                            }
                          }
                          setUploadedDocuments(prev => [...prev, ...uploadedFiles])
                          setSelectedDocuments(prev => [...prev, ...uploadedFiles])
                        }
                      }
                      input.click()
                    }}
                    disabled={isLoading}
                    className={cn(
                      "p-1.5 rounded-md transition-colors focus-visible:ring-2",
                      theme === 'light' 
                        ? "hover:bg-[#6A5ACD]/10 text-black/70 focus-visible:ring-[#6A5ACD]/30" 
                        : "hover:bg-white/10 text-white/70 focus-visible:ring-white/20"
                    )}
                    title="Upload document"
                  >
                    <Paperclip className="h-3 w-3" />
                  </button>
                  
                  {speechSupported && (
                    <button
                      aria-label={isListening ? "Stop voice input" : "Start voice input"}
                      onClick={toggleListening}
                      disabled={isLoading}
                      className={cn(
                        "p-1.5 rounded-md transition-colors focus-visible:ring-2",
                        isListening 
                          ? "bg-red-500/20 text-red-500" 
                          : theme === 'light' 
                            ? "hover:bg-[#6A5ACD]/10 text-black/70 focus-visible:ring-[#6A5ACD]/30" 
                            : "hover:bg-white/10 text-white/70 focus-visible:ring-white/20"
                      )}
                    >
                      <Mic className={cn("h-3 w-3", isListening && "animate-pulse")} />
                    </button>
                  )}
                  <Button
                    aria-label="Send message"
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || isLoading}
                    size="sm"
                    className={cn(
                      "text-white px-3 py-1.5 rounded-md border focus-visible:ring-2",
                      theme === 'light' 
                        ? "bg-[#6A5ACD] hover:bg-[#5a4ac0] border-[#6A5ACD]/40 focus-visible:ring-[#6A5ACD]/30" 
                        : "bg-indigo-600/90 hover:bg-indigo-600 border-indigo-400/30 focus-visible:ring-indigo-300/30"
                    )}
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
