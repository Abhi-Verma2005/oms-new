"use client"

import React, { createContext, useContext, Suspense, useCallback } from 'react'
// Removed PanelGroup imports - using custom flex layout instead
import { useLayout } from '@/contexts/LayoutContext'
import AIChatbotSidebar from './ai-chatbot-sidebar'
import { cn } from '@/lib/utils'

interface ResizableLayoutProps {
  children: React.ReactNode
}

// Create a custom context for the resizable layout
const ResizableLayoutContext = createContext<{
  toggleSidebar: () => void
} | null>(null)

// Custom hook to toggle sidebar without URL sync to prevent page reload
export const useResizableLayout = () => {
  const resizableContext = useContext(ResizableLayoutContext)
  const { isSidebarOpen, updateSidebarState } = useLayout()

  const toggleSidebar = useCallback(() => {
    if (resizableContext?.toggleSidebar) {
      resizableContext.toggleSidebar()
      return
    }
    // Fallback: toggle state only (no URL sync to prevent page reload)
    const newState = !isSidebarOpen
    updateSidebarState(newState)
  }, [resizableContext, isSidebarOpen, updateSidebarState])

  return { toggleSidebar }
}

// Component that renders sidebar with sweet animations
function ResizableLayoutContent({ children }: ResizableLayoutProps) {
  const { mainWidth, sidebarWidth, isSidebarOpen, updateSidebarState, setWidths } = useLayout()

  // Custom toggle function that only updates state (no URL sync to prevent reload)
  const handleSidebarToggle = useCallback(() => {
    const newState = !isSidebarOpen
    updateSidebarState(newState)
  }, [isSidebarOpen, updateSidebarState])

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
      {/* Mobile Layout - Overlay sidebar */}
      <div className="lg:hidden relative h-screen bg-gray-50 dark:bg-[#1f2230] overflow-hidden">
        {/* Backdrop overlay - sweet fade animation */}
        <div
          className={cn(
            "fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-all duration-300 ease-out",
            isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={handleSidebarToggle}
        />

        {/* Main Content - Always rendered */}
        <div className="h-full overflow-y-auto no-scrollbar bg-gray-50 dark:bg-[#1f2230]">
          {children}
        </div>

        {/* Mobile Sidebar - Sweet slide animation from right with scale and opacity */}
        <div
          className={cn(
            "fixed top-0 right-0 h-full w-full max-w-md z-50 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] transform",
            isSidebarOpen 
              ? "translate-x-0 opacity-100 scale-100" 
              : "translate-x-full opacity-0 scale-95"
          )}
        >
          <div className="h-full bg-gray-50 dark:bg-[#1f2230] w-full overflow-hidden shadow-2xl">
            <AIChatbotSidebar isOpen={isSidebarOpen} onToggle={handleSidebarToggle} />
          </div>
        </div>
      </div>

      {/* Desktop Layout - Side by side */}
      <div className="hidden lg:flex h-screen bg-gray-50 dark:bg-[#1f2230] resizable-container w-full max-w-full overflow-hidden">
        {/* Main Content - Independent container with smooth width transition */}
        <div 
          className={cn(
            "h-full overflow-y-auto no-scrollbar bg-gray-50 dark:bg-[#1f2230] flex-1 min-w-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
          )}
          style={{ 
            width: isSidebarOpen ? `${mainWidth}%` : '100%', 
            maxWidth: isSidebarOpen ? `${mainWidth}%` : '100%' 
          }}
        >
          {children}
        </div>
        
        {/* Resize Handle - Only visible when sidebar is open */}
        {isSidebarOpen && (
          <div 
            className="w-1 bg-gray-200/50 dark:bg-white/10 hover:bg-gray-300/50 dark:hover:bg-white/20 transition-all duration-300 cursor-col-resize flex-shrink-0 opacity-100"
            onMouseDown={handleMouseDown}
          />
        )}
        
        {/* AI Sidebar - Sweet slide animation from right with scale effect */}
        <div 
          className={cn(
            "h-full bg-gray-50 dark:bg-[#1f2230] overflow-hidden flex-shrink-0 min-w-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] transform shadow-2xl",
            isSidebarOpen
              ? "translate-x-0 opacity-100 scale-100"
              : "translate-x-full opacity-0 scale-95"
          )}
          style={{ 
            width: isSidebarOpen ? `${sidebarWidth}%` : '0%', 
            maxWidth: isSidebarOpen ? `${sidebarWidth}%` : '0%' 
          }}
        >
          <AIChatbotSidebar isOpen={isSidebarOpen} onToggle={handleSidebarToggle} />
        </div>
      </div>
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

