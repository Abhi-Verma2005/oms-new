"use client"

import React, { useEffect, createContext, useContext, Suspense, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
// Removed PanelGroup imports - using custom flex layout instead
import { useLayout } from '@/contexts/LayoutContext'
import AIChatbotSidebar from './ai-chatbot-sidebar'

interface ResizableLayoutProps {
  children: React.ReactNode
}

// Create a custom context for the resizable layout
const ResizableLayoutContext = createContext<{
  toggleSidebar: () => void
} | null>(null)

// Custom hook to toggle sidebar with URL sync, falling back if context not present
export const useResizableLayout = () => {
  const resizableContext = useContext(ResizableLayoutContext)
  const { isSidebarOpen, updateSidebarState } = useLayout()
  const router = useRouter()
  const searchParams = useSearchParams()

  const toggleSidebar = useCallback(() => {
    if (resizableContext?.toggleSidebar) {
      resizableContext.toggleSidebar()
      return
    }
    // Fallback: toggle and sync URL even when not inside ResizableLayout tree
    const newState = !isSidebarOpen
    updateSidebarState(newState)
    const newParams = new URLSearchParams(searchParams?.toString() || '')
    newParams.set('sidebar', newState ? 'open' : 'closed')
    router.replace(`?${newParams.toString()}`, { scroll: false })
  }, [resizableContext, isSidebarOpen, updateSidebarState, searchParams, router])

  return { toggleSidebar }
}

// Component that uses useSearchParams - needs to be wrapped in Suspense
function ResizableLayoutContent({ children }: ResizableLayoutProps) {
  const { mainWidth, sidebarWidth, isSidebarOpen, closeSidebar, openSidebar, updateSidebarState, setWidths } = useLayout()
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

  // Handle resize functionality
  const handleResize = (e: MouseEvent) => {
    if (!isSidebarOpen) return
    
    const container = document.querySelector('.resizable-container') as HTMLElement
    if (!container) return
    
    const containerRect = container.getBoundingClientRect()
    const mouseX = e.clientX - containerRect.left
    const containerWidth = containerRect.width
    
    const newMainWidth = (mouseX / containerWidth) * 100
    const newSidebarWidth = 100 - newMainWidth
    
    // Constrain to reasonable bounds
    const constrainedMainWidth = Math.max(20, Math.min(80, newMainWidth))
    const constrainedSidebarWidth = 100 - constrainedMainWidth
    
    setWidths(constrainedMainWidth, constrainedSidebarWidth)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    document.addEventListener('mousemove', handleResize)
    document.addEventListener('mouseup', () => {
      document.removeEventListener('mousemove', handleResize)
    })
  }

  // Provide the custom toggle function to child components
  const contextValue = {
    toggleSidebar: handleSidebarToggle
  }

  return (
    <ResizableLayoutContext.Provider value={contextValue}>
      {!isSidebarOpen ? (
        <div className="h-screen overflow-y-auto no-scrollbar bg-gray-50 dark:bg-[#1f2230]">
          {children}
        </div>
      ) : (
        <div className="h-screen bg-gray-50 dark:bg-[#1f2230] flex resizable-container w-full max-w-full overflow-hidden">
          {/* Mobile: Stack vertically, Desktop: Side by side */}
          <div className="block lg:hidden flex-1 min-w-0">
            {/* Mobile: AI Sidebar takes full width */}
            <div className="h-full bg-gray-50 dark:bg-[#1f2230] w-full overflow-hidden">
              <AIChatbotSidebar isOpen={isSidebarOpen} onToggle={handleSidebarToggle} />
            </div>
          </div>
          <div className="hidden lg:flex flex-1 min-w-0">
            {/* Main Content - Independent container */}
            <div 
              className="h-full overflow-y-auto no-scrollbar bg-gray-50 dark:bg-[#1f2230] flex-1 min-w-0"
              style={{ width: `${mainWidth}%`, maxWidth: `${mainWidth}%` }}
            >
              {children}
            </div>
            
            {/* Resize Handle */}
            <div 
              className="w-1 bg-gray-200/50 dark:bg-white/10 hover:bg-gray-300/50 dark:hover:bg-white/20 transition-colors cursor-col-resize flex-shrink-0"
              onMouseDown={handleMouseDown}
            />
            
            {/* AI Sidebar - Independent container */}
            <div 
              className="h-full bg-gray-50 dark:bg-[#1f2230] overflow-hidden flex-shrink-0 min-w-0"
              style={{ width: `${sidebarWidth}%`, maxWidth: `${sidebarWidth}%` }}
            >
              <AIChatbotSidebar isOpen={isSidebarOpen} onToggle={handleSidebarToggle} />
            </div>
          </div>
        </div>
      )}
    </ResizableLayoutContext.Provider>
  )
}

export function ResizableLayout({ children }: ResizableLayoutProps) {
  return (
    <Suspense fallback={
      <div className="h-screen overflow-y-auto no-scrollbar bg-gray-50 dark:bg-[#1f2230]">
        {children}
      </div>
    }>
      <ResizableLayoutContent>{children}</ResizableLayoutContent>
    </Suspense>
  )
}

