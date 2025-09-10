"use client"

import React, { createContext, useContext, useState } from 'react'
import { AIChatbot } from './ai-chatbot'

interface AIChatbotContextType {
  isOpen: boolean
  toggleChatbot: () => void
  openChatbot: () => void
  closeChatbot: () => void
}

const AIChatbotContext = createContext<AIChatbotContextType | undefined>(undefined)

export function useAIChatbot() {
  const context = useContext(AIChatbotContext)
  if (context === undefined) {
    throw new Error('useAIChatbot must be used within an AIChatbotProvider')
  }
  return context
}

interface AIChatbotProviderProps {
  children: React.ReactNode
}

export function AIChatbotProvider({ children }: AIChatbotProviderProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleChatbot = () => setIsOpen(prev => !prev)
  const openChatbot = () => setIsOpen(true)
  const closeChatbot = () => setIsOpen(false)

  return (
    <AIChatbotContext.Provider value={{
      isOpen,
      toggleChatbot,
      openChatbot,
      closeChatbot
    }}>
      {children}
      <AIChatbot isOpen={isOpen} onToggle={toggleChatbot} />
    </AIChatbotContext.Provider>
  )
}

