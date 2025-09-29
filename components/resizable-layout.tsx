"use client"

import React, { useEffect, createContext, useContext } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { useLayout } from '@/contexts/LayoutContext'
import { AIChatbotSidebar } from './ai-chatbot-sidebar'

interface ResizableLayoutProps {
  children: React.ReactNode
}

// Create a custom context for the resizable layout
const ResizableLayoutContext = createContext<{
  toggleSidebar: () => void
} | null>(null)

// Custom hook to use the resizable layout context
export const useResizableLayout = () => {
  const context = useContext(ResizableLayoutContext)
  if (!context) {
    throw new Error('useResizableLayout must be used within a ResizableLayout')
  }
  return context
}

export function ResizableLayout({ children }: ResizableLayoutProps) {
  const { mainWidth, sidebarWidth, isSidebarOpen, closeSidebar, openSidebar, updateSidebarState } = useLayout()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Handle URL parameters for sidebar state on mount only
  useEffect(() => {
    const sidebarParam = searchParams?.get('sidebar')
    
    if (sidebarParam === 'open') {
      updateSidebarState(true)
    } else if (sidebarParam === 'closed') {
      updateSidebarState(false)
    }
    // If no parameter, don't change state - keep current state
  }, []) // Only run on mount

  // Custom toggle function that updates both state and URL
  const handleSidebarToggle = () => {
    const newState = !isSidebarOpen
    updateSidebarState(newState)
    
    // Update URL immediately
    const newParams = new URLSearchParams(searchParams?.toString() || '')
    newParams.set('sidebar', newState ? 'open' : 'closed')
    router.replace(`?${newParams.toString()}`, { scroll: false })
  }

  // Provide the custom toggle function to child components
  const contextValue = {
    toggleSidebar: handleSidebarToggle
  }

  return (
    <ResizableLayoutContext.Provider value={contextValue}>
      {!isSidebarOpen ? (
        <div className="h-[100dvh] overflow-y-auto bg-[#1f2230]">
          {children}
        </div>
      ) : (
        <div className="h-[100dvh] bg-[#1f2230]">
          <PanelGroup direction="horizontal" className="h-full">
            {/* Main Content */}
            <Panel defaultSize={mainWidth} minSize={20} maxSize={80}>
              <div className="h-full overflow-y-auto bg-[#1f2230]">
                {children}
              </div>
            </Panel>
            
            {/* Resize Handle */}
            <PanelResizeHandle className="w-1 bg-white/10 hover:bg-white/20 transition-colors" />
            
            {/* AI Sidebar */}
            <Panel defaultSize={sidebarWidth} minSize={20} maxSize={80}>
              <div className="h-full bg-[#1f2230] max-w-3xl mx-auto w-full">
                <AIChatbotSidebar onClose={handleSidebarToggle} />
              </div>
            </Panel>
          </PanelGroup>
        </div>
      )}
    </ResizableLayoutContext.Provider>
  )
}

