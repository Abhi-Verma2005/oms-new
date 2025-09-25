"use client"

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Send, Bot, Minimize2, Trash2 } from 'lucide-react'
import { useAIChatbot } from './ai-chatbot-provider'
import { useUserContextStore } from '@/stores/user-context-store'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

interface AIChatbotProps {
  isOpen: boolean
  onToggle: () => void
}

export function AIChatbot({ isOpen, onToggle }: AIChatbotProps) {
  const router = useRouter()
  const { config, configLoading } = useAIChatbot()
  const { 
    user,
    company, 
    professional, 
    preferences, 
    aiInsights, 
    aiMetadata,
    fetchUserContext, 
    needsUpdate,
    isLoaded,
    isLoading: contextLoading,
    error
  } = useUserContextStore()

  // Debug: Log user context state changes
  useEffect(() => {
    console.log('🔍 User Context State:', {
      user,
      company,
      professional,
      preferences,
      aiInsights,
      aiMetadata,
      isLoaded,
      isLoading: contextLoading,
      error
    })
  }, [user, company, professional, preferences, aiInsights, aiMetadata, isLoaded, contextLoading, error])
  
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Fetch user context when chatbot opens
  useEffect(() => {
    console.log('🤖 Chatbot state changed:', { isOpen })
    if (isOpen) {
      console.log('📡 Fetching user context...')
      // Always try to fetch context when chatbot opens, not just when needs update
      fetchUserContext().then(() => {
        console.log('✅ User context fetched successfully')
      }).catch(error => {
        console.error('❌ Failed to fetch user context:', error)
      })
    }
  }, [isOpen, fetchUserContext])

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

    // Debug: Log user context being sent
    const contextToSend = {
      user,
      company,
      professional,
      preferences,
      aiInsights,
      aiMetadata
    }
    console.log('📤 Sending user context to API:', contextToSend)
    console.log('📊 Context summary:', {
      hasCompany: !!company?.name,
      hasIndustry: !!company?.industry,
      hasRole: !!company?.role,
      hasExperience: !!professional?.experience,
      hasGoals: !!(professional?.primaryGoals?.length),
      hasCommunicationStyle: !!preferences?.communicationStyle,
      hasLearningStyle: !!aiInsights?.learningStyle,
      hasExpertise: !!(Object.keys(aiInsights?.expertiseLevel || {}).length)
    })

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          messages: messages,
          config: config ?? undefined,
          currentUrl: window.location.href,
          userContext: contextToSend
        })
      })

      if (!response.ok || !response.body) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to send message')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let botBuffer = ''

      // Create a placeholder assistant message and update it as chunks arrive
      const assistantId = (Date.now() + 1).toString()
      setMessages(prev => [...prev, { id: assistantId, content: '', role: 'assistant', timestamp: new Date() }])

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        botBuffer += chunk

        // Check for navigation directive in the growing buffer
        const navMatch = botBuffer.match(/\[NAVIGATE:([^\]]+)\]/)
        let displayText = botBuffer
        if (navMatch) {
          const route = navMatch[1]
          displayText = botBuffer.replace(/\[NAVIGATE:[^\]]+\]/, '').trim()
          // navigate after short delay once we detect directive
          setTimeout(() => {
            router.push(route)
            onToggle()
          }, 800)
        }

        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: displayText } : m))
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

  return (
    <>
      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/20" 
            onClick={onToggle}
          />
          
          {/* Chat Panel */}
          <div className="relative w-96 h-[600px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-t-xl shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-gray-900 dark:text-white">AI Assistant</h3>
              </div>
              <div className="flex items-center gap-2">
                {messages.length > 0 && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={clearChat}
                    className="h-8 px-2"
                    title="Clear chat"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    <span className="text-xs">Clear chat</span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggle}
                  className="h-8 w-8 p-0"
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Hi! I'm your AI assistant. How can I help you today?</p>
                  {configLoading && <p className="text-xs mt-2">Loading config…</p>}
                </div>
              )}
              
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role === 'user' ? (
                    <div className={cn('max-w-[80%] rounded-lg px-3 py-2 text-sm bg-violet-600 text-white')}>{message.content}</div>
                  ) : (
                    <div className={cn('w-full text-sm text-gray-900 dark:text-white leading-7')}>{message.content}</div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-2 justify-start">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  size="sm"
                  className="px-3"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
