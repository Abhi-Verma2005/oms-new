'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useAuthStore } from './auth-store'
import { useNotificationStore } from './notification-store'
import { useNotificationWebSocket } from '@/hooks/use-notification-websocket'

// This component handles the integration between Zustand stores and external services
export function ZustandProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const setSession = useAuthStore((state) => state.setSession)
  const setLoading = useAuthStore((state) => state.setLoading)
  
  // Notification store actions
  const addNotification = useNotificationStore((state) => state.addNotification)
  const setWebSocketStatus = useNotificationStore((state) => state.setWebSocketStatus)
  const updateNotifications = useNotificationStore((state) => state.updateNotifications)

  // Handle auth session changes
  useEffect(() => {
    setLoading(status === 'loading')
    setSession(session)
  }, [session, status, setSession, setLoading])

  // Handle notification WebSocket
  const handleNewNotification = (notification: any) => {
    console.log('🔔 ZustandProvider: Received new notification via WebSocket:', notification)
    addNotification(notification)
  }

  const { 
    isConnected, 
    isConnecting, 
    error 
  } = useNotificationWebSocket({
    onNotification: handleNewNotification,
    onConnect: () => {
      console.log('Notification WebSocket connected via Zustand provider')
    },
    onDisconnect: () => {
      console.log('Notification WebSocket disconnected via Zustand provider')
    }
  })

  // Update WebSocket status in store
  useEffect(() => {
    setWebSocketStatus(isConnected, isConnecting, error)
  }, [isConnected, isConnecting, error, setWebSocketStatus])

  // Fetch initial notifications
  useEffect(() => {
    if (session?.user) {
      fetchInitialNotifications()
    }
  }, [session?.user])

  const fetchInitialNotifications = async () => {
    try {
      const response = await fetch('/api/notifications?limit=50')
      if (response.ok) {
        const data = await response.json()
        updateNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error('Error fetching initial notifications:', error)
    }
  }

  // Listen for preview notifications
  useEffect(() => {
    const handlePreviewNotification = (event: CustomEvent) => {
      const notification = event.detail
      addNotification(notification)
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('preview-notification', handlePreviewNotification as EventListener)
      return () => {
        window.removeEventListener('preview-notification', handlePreviewNotification as EventListener)
      }
    }
  }, [addNotification])

  return <>{children}</>
}
