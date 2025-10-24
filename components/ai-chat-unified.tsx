'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from 'ai'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, Bot, User, Loader2, X, Minimize2, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AIChatUnifiedProps {
  userId: string
  className?: string
}

export default function AIChatUnified({ userId, className = '' }: AIChatUnifiedProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: '/api/chat-unified',
    body: { userId },
    onError: (error) => {
      console.error('Chat error:', error)
    },
    onFinish: (message) => {
      console.log('Message finished:', message)
    }
  })

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  // Focus input when sidebar opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const formatMessage = (message: any) => {
    if (typeof message.content === 'string') {
      return message.content
    }
    return JSON.stringify(message.content, null, 2)
  }

  const getToolIcon = (toolName: string) => {
    switch (toolName) {
      case 'filter':
        return '🔍'
      case 'navigate':
        return '🧭'
      case 'addToCart':
        return '🛒'
      case 'searchDocuments':
        return '📄'
      default:
        return '🤖'
    }
  }

  const handleToolAction = (toolName: string, result: any) => {
    console.log(`Tool ${toolName} executed:`, result)
    
    // Handle different tool actions
    switch (toolName) {
      case 'navigate':
        if (result.route) {
          window.location.href = result.route
        }
        break
      case 'filter':
        if (result.filters) {
          // Update URL with filters
          const url = new URL(window.location.href)
          Object.entries(result.filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              url.searchParams.set(key, String(value))
            }
          })
          window.history.pushState({}, '', url.toString())
        }
        break
      case 'addToCart':
        if (result.itemId) {
          // Trigger cart update event
          window.dispatchEvent(new CustomEvent('cart-updated', { 
            detail: { itemId: result.itemId, action: 'add' }
          }))
        }
        break
    }
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      {/* Chat Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-blue-600 hover:bg-blue-700"
        size="icon"
      >
        <Bot className="w-6 h-6" />
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <Card className={cn(
          "shadow-2xl border-0 bg-white/95 backdrop-blur-sm transition-all duration-300",
          isMinimized ? "w-80 h-16" : "w-96 h-[600px]"
        )}>
          <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bot className="w-5 h-5 text-blue-600" />
              AI Assistant
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMinimized(!isMinimized)}
                className="w-8 h-8"
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          {!isMinimized && (
            <CardContent className="p-0 h-full flex flex-col">
              {/* Messages Area */}
              <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      <Bot className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-sm">Hello! How can I help you today?</p>
                      <p className="text-xs text-gray-400 mt-2">
                        I can help you filter websites, navigate pages, and manage your cart.
                      </p>
                    </div>
                  )}

                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex gap-3 ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-blue-600" />
                        </div>
                      )}
                      
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        {message.role === 'assistant' && message.toolInvocations && (
                          <div className="mb-2 space-y-1">
                            {message.toolInvocations.map((tool: any, toolIndex: number) => (
                              <Badge
                                key={toolIndex}
                                variant="secondary"
                                className="text-xs flex items-center gap-1"
                              >
                                <span>{getToolIcon(tool.toolName)}</span>
                                {tool.toolName}
                              </Badge>
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
                      <div className="bg-gray-100 rounded-lg px-4 py-2">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm text-gray-600">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="flex gap-3 justify-start">
                      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                        <X className="w-4 h-4 text-red-600" />
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                        <div className="text-sm text-red-600">
                          Error: {error.message}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="border-t p-4">
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Type your message..."
                    className="flex-1"
                    disabled={isLoading}
                  />
                  <Button type="submit" disabled={isLoading || !input.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  )
}
