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
  Rocket
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
        // Check if the response contains filter instruction
        const filterMatch = data.response.match(/\[FILTER:([^\]]+)\]/)
        if (filterMatch) {
          const filterCommand = filterMatch[1]
          // Remove the filter instruction from the message
          const cleanResponse = data.response.replace(/\[FILTER:[^\]]+\]/, '').trim()
          
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: cleanResponse || 'Applying filters...',
            role: 'assistant',
            timestamp: new Date()
          }

          setMessages(prev => [...prev, assistantMessage])
          
          // Apply filters by updating URL parameters
          setTimeout(() => {
            applyFilters(filterCommand)
          }, 500)
        } else {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: data.response,
            role: 'assistant',
            timestamp: new Date()
          }

          setMessages(prev => [...prev, assistantMessage])
        }
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
    <div className="h-[100dvh] flex flex-col relative text-white overflow-hidden">
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
                <div className="text-base text-white/80">How can I assist you today?</div>
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
                <div className="max-w-[85%] rounded-xl px-3 py-2 text-sm select-text backdrop-blur-sm bg-violet-600/90 text-white selection:bg-violet-400 selection:text-white border border-violet-500/30">
                  {message.content}
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
                  <div className="flex-1 text-white text-sm select-text selection:bg-violet-500/20 selection:text-white">
                    {message.content}
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
