'use client'

import UnifiedNavbar from "@/components/ui/unified-navbar"
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useAIChatbot } from '@/components/ai-chatbot-provider'

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { closeChatbot } = useAIChatbot()

  // Ensure chatbot closes automatically on landing routes
  useEffect(() => {
    closeChatbot()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <div className="relative flex flex-col">
        <UnifiedNavbar variant="landing" />
      </div>

      {/* Main content with top padding to account for fixed navbar */}
      <div className="pt-20">
        {children}
      </div>
    </div>
  )
}
