"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'

interface NavigationItem {
  id: string
  name: string
  route: string
  description?: string
  isActive?: boolean
}

interface AIChatbotConfig {
  systemPrompt: string
  navigationData: NavigationItem[]
}

interface AIChatbotContextType {
  isOpen: boolean
  toggleChatbot: () => void
  openChatbot: () => void
  closeChatbot: () => void
  config: AIChatbotConfig | null
  configLoading: boolean
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
  const [config, setConfig] = useState<AIChatbotConfig | null>(null)
  const [configLoading, setConfigLoading] = useState(true)

  const toggleChatbot = () => setIsOpen(prev => !prev)
  const openChatbot = () => setIsOpen(true)
  const closeChatbot = () => setIsOpen(false)

  // Preload config once on app load
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/admin/ai-chatbot/config', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setConfig({
            systemPrompt: data.systemPrompt || '',
            navigationData: Array.isArray(data.navigationData) ? data.navigationData : [],
          })
        }
      } catch {
        // swallow errors; UI can still function with defaults
      } finally {
        setConfigLoading(false)
      }
    }
    load()
  }, [])

  return (
    <AIChatbotContext.Provider value={{
      isOpen,
      toggleChatbot,
      openChatbot,
      closeChatbot,
      config,
      configLoading
    }}>
      {children}
    </AIChatbotContext.Provider>
  )
}

