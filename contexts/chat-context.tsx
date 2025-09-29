"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

interface ChatContextType {
  messages: Message[]
  addMessage: (message: Omit<Message, 'id'>) => void
  clearMessages: () => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export const useChat = () => {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}

interface ChatProviderProps {
  children: ReactNode
}

export const ChatProvider = ({ children }: ChatProviderProps) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Load messages from localStorage on mount
  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem('ai-chat-messages')
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
        setMessages(parsedMessages)
      }
    } catch (error) {
      console.warn('Failed to load chat messages from localStorage:', error)
    }
  }, [])

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    try {
      localStorage.setItem('ai-chat-messages', JSON.stringify(messages))
    } catch (error) {
      console.warn('Failed to save chat messages to localStorage:', error)
    }
  }, [messages])

  const addMessage = (message: Omit<Message, 'id'>) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    }
    setMessages(prev => [...prev, newMessage])
  }

  const clearMessages = () => {
    setMessages([])
    try {
      localStorage.removeItem('ai-chat-messages')
    } catch (error) {
      console.warn('Failed to clear chat messages from localStorage:', error)
    }
  }

  return (
    <ChatContext.Provider
      value={{
        messages,
        addMessage,
        clearMessages,
        isLoading,
        setIsLoading
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

