"use client"

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { 
  Send, 
  Bot, 
  X, 
  Trash2, 
  Zap, 
  Scissors, 
  Paperclip, 
  Book, 
  Filter, 
  Clock, 
  Plus,
  FileText,
  Maximize2,
  Search,
  Lightbulb,
  Star,
  Presentation
} from 'lucide-react'
import { useAIChatbot } from './ai-chatbot-provider'

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
  
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [])

  // Sidebar opened effect
  useEffect(() => {
    console.log('🤖 Sidebar opened')
  }, [])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Debug: Log message being sent
    console.log('📤 Sending message to API:', userMessage.content)

    try {
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
          currentUrl: window.location.href
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send message')
      }

      const data = await response.json()
      console.log('📥 Received AI response:', data.response)
      
      // Check if the response contains navigation instruction
      const navigationMatch = data.response.match(/\[NAVIGATE:([^\]]+)\]/)
      if (navigationMatch) {
        const route = navigationMatch[1]
        // Remove the navigation instruction from the message
        const cleanResponse = data.response.replace(/\[NAVIGATE:[^\]]+\]/, '').trim()
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: cleanResponse || 'Navigating to the requested page...',
          role: 'assistant',
          timestamp: new Date()
        }

        setMessages(prev => [...prev, assistantMessage])
        
        // Navigate to the route
        setTimeout(() => {
          router.push(route)
        }, 1000)
      } else {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.response,
          role: 'assistant',
          timestamp: new Date()
        }

        setMessages(prev => [...prev, assistantMessage])
      }
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        role: 'assistant',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
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
    setMessages([])
  }

  const openFullScreen = () => {
    // This could open a full-screen modal or navigate to a dedicated chat page
    console.log('Opening full screen chat')
  }

  const getCurrentPageContext = () => {
    const path = window.location.pathname
    if (path.includes('/publishers')) return 'Publishers'
    if (path.includes('/dashboard')) return 'Dashboard'
    if (path.includes('/tasks')) return 'Tasks'
    if (path.includes('/community')) return 'Community'
    return 'Home'
  }

  return (
    <div className="h-[100dvh] flex flex-col relative text-white overflow-hidden">
      {/* Solid Brand Background */}
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

        {/* Welcome Section (when no messages) */}
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="mb-6">
              <Bot className="h-16 w-16 mx-auto mb-4 text-white/60" />
              <h2 className="text-xl font-semibold text-white mb-2">Hi, How can I assist you today?</h2>
              <p className="text-white/70 text-sm">Ask me anything about your workflow, get insights, or explore features.</p>
            </div>
            
            {/* Feature Buttons Grid */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
              <Button
                variant="ghost"
                onClick={openFullScreen}
                className="h-20 flex flex-col items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20"
              >
                <Maximize2 className="h-5 w-5" />
                <span className="text-xs">Full Screen Chat</span>
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => setInput('Research and analyze the latest trends in ')}
                className="h-20 flex flex-col items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20"
              >
                <Search className="h-5 w-5" />
                <span className="text-xs">Deep Research</span>
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => setInput('Show me my highlights and important notes from ')}
                className="h-20 flex flex-col items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20"
              >
                <Star className="h-5 w-5" />
                <span className="text-xs">My Highlights</span>
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => setInput('Create a presentation about ')}
                className="h-20 flex flex-col items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20"
              >
                <Presentation className="h-5 w-5" />
                <span className="text-xs">AI Slides</span>
              </Button>
            </div>
            
            {configLoading && (
              <p className="text-xs mt-4 text-white/50">Loading configuration...</p>
            )}
          </div>
        )}

        {/* Messages Area */}
        {messages.length > 0 && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-2",
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                    message.role === 'user'
                      ? "bg-violet-600 text-white"
                      : "bg-white/10 text-white backdrop-blur-sm"
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-2 justify-start">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 text-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Context Bar */}
        {messages.length > 0 && (
          <div className="px-4 py-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-white/70">
                <span>Context: {getCurrentPageContext()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setInput('Summarize this page: ')}
                  className="h-6 px-2 text-xs text-white/70 hover:text-white hover:bg-white/10"
                >
                  <FileText className="h-3 w-3 mr-1" />
                  Summarize
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-white/10">
          {/* Utility Icons */}
          <div className="flex items-center gap-2 mb-3">
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-white/50 hover:text-white hover:bg-white/10">
              <Zap className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-white/50 hover:text-white hover:bg-white/10">
              <Scissors className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-white/50 hover:text-white hover:bg-white/10">
              <Paperclip className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-white/50 hover:text-white hover:bg-white/10">
              <Book className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-white/50 hover:text-white hover:bg-white/10">
              <Filter className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-white/50 hover:text-white hover:bg-white/10">
              <Clock className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-white/50 hover:text-white hover:bg-white/10">
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {/* Input Field */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask anything, @models, / prompts"
                disabled={isLoading}
                className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent resize-none"
                rows={1}
                style={{ minHeight: '40px', maxHeight: '120px' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  target.style.height = 'auto'
                  target.style.height = target.scrollHeight + 'px'
                }}
              />
            </div>
            
            {/* Mode Buttons */}
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs text-white/70 hover:text-white hover:bg-white/10"
              >
                <Lightbulb className="h-3 w-3 mr-1" />
                Think R1
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs text-white/70 hover:text-white hover:bg-white/10"
              >
                <Search className="h-3 w-3 mr-1" />
                Search
              </Button>
            </div>
            
            {/* Send Button */}
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              size="sm"
              className="h-8 w-8 p-0 bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* Clear Chat Button */}
          {messages.length > 0 && (
            <div className="flex justify-end mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearChat}
                className="h-6 px-2 text-xs text-white/50 hover:text-white hover:bg-white/10"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear chat
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
