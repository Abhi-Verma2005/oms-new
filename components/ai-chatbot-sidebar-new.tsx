'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { 
  Send, 
  Bot, 
  X, 
  Mic, 
  MicOff,
  Paperclip,
  Search,
  ShoppingCart,
  Filter,
  Upload,
  Settings,
  Loader2,
  User,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
// import { useChat } from '@ai-sdk/react'
import { useCart } from '@/contexts/cart-context'
import { useUserContextStore } from '@/stores/user-context-store'

interface AIChatbotSidebarProps {
  isOpen: boolean
  onClose: () => void
  className?: string
}

export default function AIChatbotSidebar({ 
  isOpen, 
  onClose, 
  className = '' 
}: AIChatbotSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { theme } = useTheme()
  const { cartItems, addToCart, removeFromCart } = useCart()
  const { userContext } = useUserContextStore()
  
  const [isListening, setIsListening] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  
  // Get user ID from context or session
  const userId = userContext?.userId || 'anonymous'

  const { messages, input, handleInputChange, handleSubmit, isLoading, data } = useChat({
    api: '/api/chat-minimal',
    body: { userId },
    onError: (error) => {
      console.error('Chat error:', error)
    }
  })

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  // Speech recognition
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser')
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      handleInputChange({ target: { value: transcript } } as any)
      setIsListening(false)
    }

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }

  // File upload handler
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    
    try {
      const text = await file.text()
      
      // Send document to AI for processing
      const response = await fetch('/api/chat-minimal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: `Upload and process this document: ${file.name}` }
          ],
          userId,
          document: {
            content: text,
            filename: file.name,
            type: file.type
          }
        })
      })

      if (response.ok) {
        console.log('Document uploaded successfully')
      }
    } catch (error) {
      console.error('File upload error:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const formatMessage = (message: any) => {
    if (typeof message.content === 'string') {
      return message.content
    }
    return JSON.stringify(message.content, null, 2)
  }

  const getToolIcon = (toolName: string) => {
    switch (toolName) {
      case 'searchDocuments':
        return <Search className="w-4 h-4" />
      case 'addToCart':
        return <ShoppingCart className="w-4 h-4" />
      case 'applyFilters':
        return <Filter className="w-4 h-4" />
      case 'uploadDocument':
        return <Upload className="w-4 h-4" />
      case 'navigateTo':
        return <Settings className="w-4 h-4" />
      default:
        return <Bot className="w-4 h-4" />
    }
  }

  const getToolColor = (toolName: string) => {
    switch (toolName) {
      case 'searchDocuments':
        return 'bg-blue-100 text-blue-800'
      case 'addToCart':
        return 'bg-green-100 text-green-800'
      case 'applyFilters':
        return 'bg-purple-100 text-purple-800'
      case 'uploadDocument':
        return 'bg-orange-100 text-orange-800'
      case 'navigateTo':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className={cn(
      "fixed inset-0 z-50 bg-black/50 transition-opacity",
      isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
      className
    )}>
      <div className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-900 shadow-2xl transform transition-transform">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold">AI Assistant</h2>
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Messages Area */}
        <div 
          ref={scrollAreaRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 h-[calc(100vh-140px)]"
        >
          {messages.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              <Bot className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm">Hello! How can I help you today?</p>
              <div className="mt-4 space-y-2">
                <p className="text-xs text-gray-400">Try asking me to:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Search documents</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Add to cart</span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">Apply filters</span>
                </div>
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "flex gap-3",
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-blue-600" />
                </div>
              )}
              
              <div
                className={cn(
                  "max-w-[80%] rounded-lg px-4 py-2",
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                )}
              >
                {message.role === 'assistant' && message.toolInvocations && (
                  <div className="mb-2 space-y-1">
                    {message.toolInvocations.map((tool: any, toolIndex: number) => (
                      <div
                        key={toolIndex}
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-1 rounded text-xs",
                          getToolColor(tool.toolName)
                        )}
                      >
                        {getToolIcon(tool.toolName)}
                        {tool.toolName}
                        {tool.state === 'result' && (
                          <CheckCircle className="w-3 h-3" />
                        )}
                        {tool.state === 'error' && (
                          <AlertCircle className="w-3 h-3" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="whitespace-pre-wrap text-sm">
                  {formatMessage(message)}
                </div>
              </div>

              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-blue-600" />
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={startListening}
                disabled={isListening || isLoading}
                className="flex items-center gap-2"
              >
                {isListening ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
                {isListening ? 'Listening...' : 'Voice'}
              </Button>
              
              <label className="cursor-pointer">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".txt,.pdf,.doc,.docx"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isUploading || isLoading}
                  className="flex items-center gap-2"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Paperclip className="w-4 h-4" />
                  )}
                  {isUploading ? 'Uploading...' : 'Upload'}
                </Button>
              </label>
            </div>

            {/* Input Field */}
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder="Type your message..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button 
                type="submit" 
                disabled={isLoading || !input.trim()}
                className="px-4"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
