'use client'

import { useLayout } from '@/contexts/LayoutContext'
import { useSession } from 'next-auth/react'
import { MessageCircle } from 'lucide-react'

export function AIAssistantButton() {
  const { toggleSidebar, isSidebarOpen } = useLayout()
  const { data: session, status } = useSession()

  // Don't render the button if user is not authenticated
  if (status === 'loading' || !session?.user) {
    return null
  }

  return (
    <button
      onClick={toggleSidebar}
      className={`fixed bottom-5 right-5 z-50 h-12 w-12 rounded-full shadow-lg border transition-all duration-200 ${
        isSidebarOpen 
          ? 'border-violet-500 bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 dark:border-violet-400' 
          : 'border-violet-300 bg-white/90 backdrop-blur text-violet-700 hover:bg-violet-50 dark:bg-gray-900/80 dark:text-violet-300 dark:border-violet-600 hover:scale-105'
      }`}
      title="AI Assistant"
      aria-label="Toggle AI Assistant"
    >
      <MessageCircle className="h-6 w-6 mx-auto" />
    </button>
  )
}
