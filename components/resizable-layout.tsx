"use client"

import React from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { useLayout } from '@/contexts/LayoutContext'
import { AIChatbotSidebar } from './ai-chatbot-sidebar'

interface ResizableLayoutProps {
  children: React.ReactNode
}

export function ResizableLayout({ children }: ResizableLayoutProps) {
  const { mainWidth, sidebarWidth, isSidebarOpen, closeSidebar } = useLayout()

  if (!isSidebarOpen) {
    return (
      <div className="h-[100dvh] overflow-y-auto">
        {children}
      </div>
    )
  }

  return (
    <div className="h-[100dvh] bg-gray-50 dark:bg-gray-900">
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
    </div>
  )
}
