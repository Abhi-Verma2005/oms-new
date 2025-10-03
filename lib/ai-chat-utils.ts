import { useEffect } from 'react'
import { useChat } from '@/contexts/chat-context'
import { useLayout } from '@/contexts/LayoutContext'
import { useRouter, useSearchParams } from 'next/navigation'

/**
 * Custom event to trigger AI message sending
 */
const AI_MESSAGE_EVENT = 'ai-send-message'

/**
 * Utility function to send a message to the AI sidebar using custom events
 */
export const sendMessageToAI = async (
  message: string,
  options?: {
    openSidebar?: boolean
    router?: ReturnType<typeof useRouter>
    searchParams?: ReturnType<typeof useSearchParams>
    updateSidebarState?: (open: boolean) => void
    addMessage?: (message: any) => void
  }
) => {
  if (!message.trim()) return

  const {
    openSidebar = true,
    router,
    searchParams,
    updateSidebarState,
    addMessage
  } = options || {}

  // Don't add user message here - let the sidebar handle it to avoid duplication

  // Open sidebar if requested
  if (openSidebar && updateSidebarState) {
    updateSidebarState(true)
    
    // Update URL to reflect sidebar state
    if (router && searchParams) {
      const newParams = new URLSearchParams(searchParams.toString())
      newParams.set('sidebar', 'open')
      router.replace(`?${newParams.toString()}`, { scroll: false })
    }
  }

  // Dispatch custom event to trigger AI response
  setTimeout(() => {
    const event = new CustomEvent(AI_MESSAGE_EVENT, {
      detail: { message: message.trim() }
    })
    window.dispatchEvent(event)
  }, 100) // Small delay to ensure sidebar is opened
}

/**
 * Hook to get AI chat utilities with context
 */
export const useAIChatUtils = () => {
  const { addMessage } = useChat()
  const { updateSidebarState } = useLayout()
  const router = useRouter()
  const searchParams = useSearchParams()

  const sendMessage = async (message: string, openSidebar = true) => {
    await sendMessageToAI(message, {
      openSidebar,
      router,
      searchParams,
      updateSidebarState,
      addMessage
    })
  }

  const openSidebarWithMessage = async (message: string) => {
    await sendMessage(message, true)
  }

  return {
    sendMessage,
    openSidebarWithMessage
  }
}

/**
 * Hook to listen for AI message events (to be used in AI chatbot sidebar)
 */
export const useAIMessageListener = (onMessage: (message: string) => void) => {
  useEffect(() => {
    const handleMessage = (event: CustomEvent) => {
      onMessage(event.detail.message)
    }

    window.addEventListener(AI_MESSAGE_EVENT, handleMessage as EventListener)
    
    return () => {
      window.removeEventListener(AI_MESSAGE_EVENT, handleMessage as EventListener)
    }
  }, [onMessage])
}
