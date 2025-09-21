import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface NotificationType {
  id: string
  name: string
  displayName: string
  icon?: string
  color?: string
}

export interface NotificationData {
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
  isRead?: boolean
  readAt?: string
}

interface NotificationState {
  notifications: NotificationData[]
  toasts: NotificationData[]
  unreadCount: number
  isWebSocketConnected: boolean
  isWebSocketConnecting: boolean
  webSocketError: string | null
}

interface NotificationActions {
  addNotification: (notification: NotificationData) => void
  markAsRead: (notificationId: string) => void
  markAllAsRead: () => void
  removeNotification: (notificationId: string) => void
  clearNotifications: () => void
  addToast: (notification: NotificationData) => void
  removeToast: (notificationId: string) => void
  setWebSocketStatus: (connected: boolean, connecting: boolean, error: string | null) => void
  updateNotifications: (notifications: NotificationData[]) => void
}

type NotificationStore = NotificationState & NotificationActions

export const useNotificationStore = create<NotificationStore>()(
  immer((set, get) => ({
    // Initial state
    notifications: [],
    toasts: [],
    unreadCount: 0,
    isWebSocketConnected: false,
    isWebSocketConnecting: false,
    webSocketError: null,

    // Actions
    addNotification: (notification: NotificationData) => {
      set((state) => {
        // Check if notification already exists
        const exists = state.notifications.some((n) => n.id === notification.id)
        if (!exists) {
          state.notifications.unshift(notification)
          // Update unread count
          state.unreadCount = state.notifications.filter((n) => !n.isRead).length
        }
      })
    },

    markAsRead: (notificationId: string) => {
      set((state) => {
        const notification = state.notifications.find((n) => n.id === notificationId)
        if (notification && !notification.isRead) {
          notification.isRead = true
          notification.readAt = new Date().toISOString()
          state.unreadCount = state.notifications.filter((n) => !n.isRead).length
        }
      })
    },

    markAllAsRead: () => {
      set((state) => {
        state.notifications.forEach((notification) => {
          if (!notification.isRead) {
            notification.isRead = true
            notification.readAt = new Date().toISOString()
          }
        })
        state.unreadCount = 0
      })
    },

    removeNotification: (notificationId: string) => {
      set((state) => {
        state.notifications = state.notifications.filter((n) => n.id !== notificationId)
        state.unreadCount = state.notifications.filter((n) => !n.isRead).length
      })
    },

    clearNotifications: () => {
      set((state) => {
        state.notifications = []
        state.unreadCount = 0
      })
    },

    addToast: (notification: NotificationData) => {
      set((state) => {
        // Check if toast already exists
        const exists = state.toasts.some((n) => n.id === notification.id)
        if (!exists) {
          state.toasts.push(notification)
        }
      })
    },

    removeToast: (notificationId: string) => {
      set((state) => {
        state.toasts = state.toasts.filter((n) => n.id !== notificationId)
      })
    },

    setWebSocketStatus: (connected: boolean, connecting: boolean, error: string | null) => {
      set((state) => {
        state.isWebSocketConnected = connected
        state.isWebSocketConnecting = connecting
        state.webSocketError = error
      })
    },

    updateNotifications: (notifications: NotificationData[]) => {
      set((state) => {
        state.notifications = notifications
        state.unreadCount = notifications.filter((n) => !n.isRead).length
      })
    },
  }))
)
