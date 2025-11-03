'use client'

/**
 * Notification WebSocket Context
 * 
 * This context manages a single WebSocket connection for push notifications.
 * It is placed OUTSIDE the AuthProvider to prevent re-renders when auth state changes.
 * 
 * The connection will be established when a user session becomes available,
 * but the context itself won't re-render due to auth changes.
 */

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { useNotificationStore } from '@/stores/notification-store'
import { useSession } from 'next-auth/react'

interface NotificationType {
  id: string
  name: string
  displayName: string
  icon?: string
  color?: string
}

interface NotificationData {
  id: string
  title: string
  body: string
  imageUrl?: string
  typeId: string
  isActive: boolean
  isGlobal: boolean
  targetUserIds: string[]
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  expiresAt?: string
  createdAt: string
  updatedAt: string
  type: NotificationType
}

interface WebSocketMessage {
  type: 'connected' | 'authenticated' | 'notification' | 'pong'
  clientId?: string
  userId?: string
  isAdmin?: boolean
  data?: NotificationData
}

interface NotificationWebSocketContextType {
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  connect: () => void
  disconnect: () => void
}

const NotificationWebSocketContext = createContext<NotificationWebSocketContextType | null>(null)

export function NotificationWebSocketProvider({ children }: { children: React.ReactNode }) {
  // Use session hook - now inside SessionProvider so it works
  // Store session in ref to prevent re-renders of this component when session changes
  const { data: session } = useSession()
  const sessionRef = useRef(session)
  const prevSessionUserIdRef = useRef<string | undefined>(undefined)
  
  // Update session ref without causing re-renders
  useEffect(() => {
    const currentUserId = (session?.user as any)?.id
    const prevUserId = prevSessionUserIdRef.current
    
    // Only trigger connection logic if userId actually changed
    if (currentUserId !== prevUserId) {
      prevSessionUserIdRef.current = currentUserId
      sessionRef.current = session
    } else {
      sessionRef.current = session
    }
  }, [session])

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const shouldReconnectRef = useRef(true) // Flag to control if we should auto-reconnect
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // WebSocket URL for pure WebSocket notification server (port 8081, standalone)
  // Format: ws://host:port/ or wss://host:port/ for production
  const WS_URL = process.env.NEXT_PUBLIC_NOTIFICATION_WS_URL || 'ws://localhost:8081/'
  
  const MAX_RECONNECT_ATTEMPTS = 10
  const INITIAL_RECONNECT_DELAY = 1000 // 1 second
  const MAX_RECONNECT_DELAY = 30000 // 30 seconds

  const connect = useCallback(() => {
    // Prevent multiple connections
    if (wsRef.current?.readyState === WebSocket.OPEN || 
        wsRef.current?.readyState === WebSocket.CONNECTING) {
      return
    }

    // Check if session is available
    if (!sessionRef.current?.user) {
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        setIsConnected(true)
        setIsConnecting(false)
        setError(null)
        reconnectAttemptsRef.current = 0

        // Update global notification store connection status
        try {
          useNotificationStore.getState().setWebSocketStatus(true, false, null)
        } catch {}

        // Authenticate
        const userId = (sessionRef.current?.user as any)?.id
        const isAdmin = (sessionRef.current?.user as any)?.roles?.includes('admin') || 
                       (sessionRef.current?.user as any)?.roles?.includes('super_admin') ||
                       (sessionRef.current?.user as any)?.isAdmin

        if (userId) {
          ws.send(JSON.stringify({
            type: 'authenticate',
            userId,
            isAdmin: !!isAdmin
          }))
        }
      }

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          
          switch (message.type) {
            case 'connected':
            case 'authenticated':
            case 'pong':
              // Silently handle success messages
              break
              
            case 'notification':
              if (message.data) {
                // Push into zustand notification store (unread + toast)
                try {
                  const notificationData = {
                    ...message.data,
                    isRead: false,
                  } as any
                  
                  useNotificationStore.getState().addNotification(notificationData)
                } catch (error) {
                  console.error('[Notification WS] Error adding to store:', error)
                }
                
                // Dispatch custom event for other listeners (notification-context, etc.)
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('notification-received', {
                    detail: message.data
                  }))
                }
              }
              break
              
            default:
              // Silently ignore unknown message types
              break
          }
        } catch (error) {
          console.error('[Notification WS] Error parsing message:', error)
        }
      }

      ws.onclose = (event) => {
        if (event.code !== 1000) {
          console.error('[Notification WS] Connection closed unexpectedly (code:', event.code, ')')
        }
        setIsConnected(false)
        setIsConnecting(false)
        wsRef.current = null
        try {
          useNotificationStore.getState().setWebSocketStatus(false, false, null)
        } catch {}
      }

      ws.onerror = (event) => {
        console.error('[Notification WS] Connection error')
        setError('WebSocket connection error')
        setIsConnecting(false)
        try {
          useNotificationStore.getState().setWebSocketStatus(false, false, 'WebSocket connection error')
        } catch {}
      }

    } catch (error) {
      console.error('[Notification WS] Failed to create connection:', error)
      setError('Failed to create WebSocket connection')
      setIsConnecting(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setIsConnected(false)
    setIsConnecting(false)
  }, [])

  // Connect when session becomes available
  useEffect(() => {
    if (session?.user && !isConnected && !isConnecting) {
      connect()
    }
  }, [session?.user, isConnected, isConnecting, connect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  const value: NotificationWebSocketContextType = {
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect
  }

  return (
    <NotificationWebSocketContext.Provider value={value}>
      {children}
    </NotificationWebSocketContext.Provider>
  )
}

export function useNotificationWebSocket() {
  const context = useContext(NotificationWebSocketContext)
  if (!context) {
    throw new Error('useNotificationWebSocket must be used within NotificationWebSocketProvider')
  }
  return context
}

