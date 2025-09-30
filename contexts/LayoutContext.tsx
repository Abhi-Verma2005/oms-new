"use client"

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface LayoutContextType {
  mainWidth: number
  sidebarWidth: number
  isSidebarOpen: boolean
  toggleSidebar: () => void
  setWidths: (main: number, sidebar: number) => void
  openSidebar: () => void
  closeSidebar: () => void
  updateSidebarState: (isOpen: boolean) => void
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined)

export const useLayout = () => {
  const context = useContext(LayoutContext)
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider')
  }
  return context
}

interface LayoutProviderProps {
  children: ReactNode
}

export const LayoutProvider = ({ children }: LayoutProviderProps) => {
  const [mainWidth, setMainWidth] = useState(100)
  const [sidebarWidth, setSidebarWidth] = useState(0)
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

  const updateSidebarState = useCallback((isOpen: boolean) => {
    if (isOpen) {
      setMainWidth(75)
      setSidebarWidth(25)
      setIsSidebarOpen(true)
    } else {
      setMainWidth(100)
      setSidebarWidth(0)
      setIsSidebarOpen(false)
    }
  }, [])

  return (
    <LayoutContext.Provider
      value={{
        mainWidth,
        sidebarWidth,
        isSidebarOpen,
        toggleSidebar,
        setWidths,
        openSidebar,
        closeSidebar,
        updateSidebarState,
      }}
    >
      {children}
    </LayoutContext.Provider>
  )
}
