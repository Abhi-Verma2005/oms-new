'use client'

import { useAIChatbot } from '@/components/ai-chatbot-provider'
import { MessageCircle } from 'lucide-react'

export function AIAssistantButton() {
  const { openChatbot } = useAIChatbot()

  return (
    <button
      onClick={openChatbot}
      className="fixed bottom-5 right-5 z-50 h-12 w-12 rounded-full shadow-lg border border-violet-300 bg-white/90 backdrop-blur text-violet-700 hover:bg-violet-50 dark:bg-gray-900/80 dark:text-violet-300 dark:border-violet-600 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2"
      title="AI Assistant"
      aria-label="Open AI Assistant"
    >
      <MessageCircle className="h-6 w-6 mx-auto" />
    </button>
  )
}
