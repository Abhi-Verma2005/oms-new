"use client"

import { useLayout } from '@/contexts/LayoutContext'
import { Button } from '@/components/ui/button'
import { MessageCircle, Maximize2, Minimize2 } from 'lucide-react'

/**
 * Example component showing how to use the resizable LayoutContext
 */
export function LayoutExample() {
  const { 
    mainWidth, 
    sidebarWidth, 
    isSidebarOpen, 
    toggleSidebar, 
    setWidths, 
    openSidebar, 
    closeSidebar 
  } = useLayout()

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        Resizable Layout Example
      </h2>
      
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={toggleSidebar} variant="outline">
            <MessageCircle className="h-4 w-4 mr-2" />
            {isSidebarOpen ? 'Close' : 'Open'} AI Sidebar
          </Button>
          
          <Button onClick={openSidebar} variant="outline" disabled={isSidebarOpen}>
            <Maximize2 className="h-4 w-4 mr-2" />
            Open Sidebar
          </Button>
          
          <Button onClick={closeSidebar} variant="outline" disabled={!isSidebarOpen}>
            <Minimize2 className="h-4 w-4 mr-2" />
            Close Sidebar
          </Button>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={() => setWidths(60, 40)} 
            variant="outline" 
            disabled={!isSidebarOpen}
          >
            Set 60/40 Split
          </Button>
          
          <Button 
            onClick={() => setWidths(80, 20)} 
            variant="outline" 
            disabled={!isSidebarOpen}
          >
            Set 80/20 Split
          </Button>
          
          <Button 
            onClick={() => setWidths(50, 50)} 
            variant="outline" 
            disabled={!isSidebarOpen}
          >
            Set 50/50 Split
          </Button>
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p>Current widths: Main {mainWidth}% | Sidebar {sidebarWidth}%</p>
          <p>Sidebar is {isSidebarOpen ? 'open' : 'closed'}</p>
        </div>
      </div>

      <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <h3 className="font-semibold mb-2">How to use in your components:</h3>
        <pre className="text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
{`import { useLayout } from '@/contexts/LayoutContext'

function MyComponent() {
  const { 
    mainWidth, 
    sidebarWidth, 
    isSidebarOpen, 
    toggleSidebar, 
    setWidths 
  } = useLayout()

  return (
    <button onClick={toggleSidebar}>
      {isSidebarOpen ? 'Close' : 'Open'} AI Assistant
    </button>
  )
}`}
        </pre>
      </div>
    </div>
  )
}
