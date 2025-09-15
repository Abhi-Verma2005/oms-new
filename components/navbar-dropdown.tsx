'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useSelectedLayoutSegments } from 'next/navigation'

interface NavbarDropdownProps {
  title: string
  icon: React.ReactNode
  href?: string
  children?: React.ReactNode
  className?: string
}

export default function NavbarDropdown({ 
  title, 
  icon, 
  href, 
  children, 
  className = '' 
}: NavbarDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const segments = useSelectedLayoutSegments()
  
  const isActive = href ? segments.some(segment => href.includes(segment)) : false

  const handleMouseEnter = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      setTimeoutId(null)
    }
    setIsOpen(true)
  }

  const handleMouseLeave = () => {
    const id = setTimeout(() => {
      setIsOpen(false)
    }, 150) // Small delay to prevent flickering
    setTimeoutId(id)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [timeoutId])

  const baseClasses = `relative inline-flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-200 ${
    isActive 
      ? 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10' 
      : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50'
  } ${className}`

  if (href && !children) {
    // Simple link without dropdown
    return (
      <Link href={href} className={baseClasses}>
        <span className="flex items-center">
          {icon}
          <span className="ml-2">{title}</span>
        </span>
      </Link>
    )
  }

  return (
    <div 
      ref={dropdownRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button className={baseClasses}>
        <span className="flex items-center">
          {icon}
          <span className="ml-2">{title}</span>
          <svg 
            className={`ml-1 w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && children && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 rounded-lg shadow-lg py-1 z-50">
          {children}
        </div>
      )}
    </div>
  )
}

// Dropdown item component
export function NavbarDropdownItem({ 
  href, 
  children, 
  className = '',
  onClick
}: { 
  href?: string
  children: React.ReactNode
  className?: string
  onClick?: () => void
}) {
  const baseClasses = `block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white transition-colors duration-150 ${className}`

  if (href) {
    return (
      <Link href={href} className={baseClasses}>
        {children}
      </Link>
    )
  }

  return (
    <button onClick={onClick} className={baseClasses}>
      {children}
    </button>
  )
}

// Dropdown section component for grouping items
export function NavbarDropdownSection({ 
  title, 
  children 
}: { 
  title?: string
  children: React.ReactNode 
}) {
  return (
    <div className="py-1">
      {title && (
        <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {title}
        </div>
      )}
      {children}
    </div>
  )
}
