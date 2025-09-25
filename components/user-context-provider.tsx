"use client"

import React, { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useUserContextStore } from '@/stores/user-context-store'
import { useUserInteractionLogger } from '@/hooks/use-user-interaction-logger'

interface UserContextProviderProps {
  children: React.ReactNode
}

export function UserContextProvider({ children }: UserContextProviderProps) {
  const { data: session, status } = useSession()
  const { 
    fetchUserContext, 
    needsUpdate, 
    isLoaded,
    clearContext 
  } = useUserContextStore()

  // Initialize user interaction logging
  useUserInteractionLogger({ 
    enabled: status === 'authenticated' 
  })

  // Initialize user context when user is authenticated
  useEffect(() => {
    console.log('🔐 Auth status changed:', { 
      status, 
      userId: session?.user?.id,
      needsUpdate: needsUpdate(),
      isLoaded 
    })
    
    if (status === 'authenticated' && session?.user?.id) {
      console.log('✅ User authenticated, checking context...')
      // Fetch user context if needed
      if (needsUpdate() || !isLoaded) {
        console.log('📡 Fetching user context from provider...')
        fetchUserContext().then(() => {
          console.log('✅ User context loaded in provider')
        }).catch(error => {
          console.error('❌ Failed to fetch user context in provider:', error)
        })
      } else {
        console.log('ℹ️ User context already loaded')
      }
    } else if (status === 'unauthenticated') {
      console.log('🚪 User logged out, clearing context')
      // Clear context when user logs out
      clearContext()
    }
  }, [status, session?.user?.id, needsUpdate, isLoaded, fetchUserContext, clearContext])

  // Auto-refresh context periodically
  useEffect(() => {
    if (status !== 'authenticated') return

    const interval = setInterval(() => {
      if (needsUpdate()) {
        fetchUserContext().catch(error => {
          console.warn('Failed to refresh user context:', error)
        })
      }
    }, 5 * 60 * 1000) // Check every 5 minutes

    return () => clearInterval(interval)
  }, [status, needsUpdate, fetchUserContext])

  return <>{children}</>
}
