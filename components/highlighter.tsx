'use client'

import { ReactNode } from 'react'

interface HighlighterProps {
  children: ReactNode
  className?: string
}

interface HighlighterItemProps {
  children: ReactNode
  className?: string
}

export function Highlighter({ children, className = '' }: HighlighterProps) {
  return (
    <div className={`relative ${className}`}>
      {children}
    </div>
  )
}

export function HighlighterItem({ children, className = '' }: HighlighterItemProps) {
  return (
    <div className={`relative ${className}`}>
      {children}
    </div>
  )
}
