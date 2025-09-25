// context/LayoutContext.tsx
"use client"
import React, { createContext, useContext, useState, useCallback } from "react"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"
import { AIChatbotSidebar } from "@/components/ai-chatbot-sidebar"

type LayoutContextType = {
  mainWidth: number
  sidebarWidth: number
  isSidebarOpen: boolean
  toggleSidebar: () => void
  setWidths: (main: number, sidebar: number) => void
  openSidebar: () => void
  closeSidebar: () => void
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined)

export const LayoutProvider = ({ children }: { children: React.ReactNode }) => {
  const [mainWidth, setMainWidth] = useState(100)     // default 100% width
  const [sidebarWidth, setSidebarWidth] = useState(0) // hidden sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const toggleSidebar = useCallback(() => {
    if (isSidebarOpen) {
      setMainWidth(100)
      setSidebarWidth(0)
      setIsSidebarOpen(false)
    } else {
      setMainWidth(75)
      setSidebarWidth(25)
      setIsSidebarOpen(true)
    }
  }, [isSidebarOpen])

  const openSidebar = useCallback(() => {
    setMainWidth(75)
    setSidebarWidth(25)
    setIsSidebarOpen(true)
  }, [])

  const closeSidebar = useCallback(() => {
    setMainWidth(100)
    setSidebarWidth(0)
    setIsSidebarOpen(false)
  }, [])

  const setWidths = useCallback((main: number, sidebar: number) => {
    setMainWidth(main)
    setSidebarWidth(sidebar)
    setIsSidebarOpen(sidebar > 0)
  }, [])

  return (
    <LayoutContext.Provider value={{ 
      mainWidth, 
      sidebarWidth, 
      isSidebarOpen, 
      toggleSidebar, 
      setWidths, 
      openSidebar, 
      closeSidebar
    }}>
      <div className="h-[100dvh] bg-gray-50 dark:bg-gray-900">
        {isSidebarOpen ? (
          <PanelGroup direction="horizontal" className="h-full">
            {/* Main Content */}
            <Panel defaultSize={mainWidth} minSize={20} maxSize={80}>
              <div className="h-full overflow-y-auto">
                {children}
              </div>
            </Panel>
            
            {/* Resize Handle */}
            <PanelResizeHandle className="w-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors" />
            
            {/* AI Sidebar */}
            <Panel defaultSize={sidebarWidth} minSize={20} maxSize={80}>
              <div className="h-full border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <AIChatbotSidebar onClose={closeSidebar} />
              </div>
            </Panel>
          </PanelGroup>
        ) : (
          /* Main Content Only */
          <div className="h-full overflow-y-auto">
            {children}
          </div>
        )}
      </div>
    </LayoutContext.Provider>
  )
}

export const useLayout = () => {
  const ctx = useContext(LayoutContext)
  if (!ctx) throw new Error("useLayout must be used inside LayoutProvider")
  return ctx
}
