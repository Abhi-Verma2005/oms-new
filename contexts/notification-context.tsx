'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useNotificationWebSocket } from '@/hooks/use-notification-websocket';

interface NotificationType {
  id: string;
  name: string;
  displayName: string;
  icon?: string;
  color?: string;
}

interface NotificationData {
  id: string;
  title: string;
  body: string;
  imageUrl?: string;
  typeId: string;
  isActive: boolean;
  isGlobal: boolean;
  targetUserIds: string[];
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  type: NotificationType;
  isRead?: boolean;
  readAt?: string;
}

interface NotificationContextType {
  notifications: NotificationData[];
  unreadCount: number;
  addNotification: (notification: NotificationData) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  removeNotification: (notificationId: string) => void;
  clearNotifications: () => void;
  isWebSocketConnected: boolean;
  isWebSocketConnecting: boolean;
  webSocketError: string | null;
  // Toast management
  toasts: NotificationData[];
  addToast: (notification: NotificationData) => void;
  removeToast: (notificationId: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [toasts, setToasts] = useState<NotificationData[]>([]);
  const [initialLoad, setInitialLoad] = useState(false);

  const handleNewNotification = useCallback((notification: NotificationData) => {
    // Add to notifications list
    setNotifications(prev => {
      // Check if notification already exists
      const exists = prev.some(n => n.id === notification.id);
      if (exists) {
        return prev;
      }
      return [notification, ...prev];
    });

    // Add to toast queue
    setToasts(prev => {
      // Check if toast already exists
      const exists = prev.some(n => n.id === notification.id);
      if (exists) {
        return prev;
      }
      return [...prev, notification];
    });
  }, []);

  const addToast = useCallback((notification: NotificationData) => {
    setToasts(prev => {
      const exists = prev.some(n => n.id === notification.id);
      if (exists) return prev;
      
      return [...prev, notification];
    });
  }, []);

  const removeToast = useCallback((notificationId: string) => {
    setToasts(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  // Fetch initial notifications
  useEffect(() => {
    if (!initialLoad) {
      fetchInitialNotifications();
    }
  }, [initialLoad]);

  // Listen for preview notifications
  useEffect(() => {
    const handlePreviewNotification = (event: CustomEvent) => {
      const notification = event.detail;
      addToast(notification);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('preview-notification', handlePreviewNotification as EventListener);
      return () => {
        window.removeEventListener('preview-notification', handlePreviewNotification as EventListener);
      };
    }
  }, [addToast]);

  const fetchInitialNotifications = async () => {
    try {
      const response = await fetch('/api/notifications?limit=50');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching initial notifications:', error);
    } finally {
      setInitialLoad(true);
    }
  };

  const { 
    isConnected: isWebSocketConnected, 
    isConnecting: isWebSocketConnecting, 
    error: webSocketError 
  } = useNotificationWebSocket({
    onNotification: handleNewNotification,
    onConnect: () => {},
    onDisconnect: () => {}
  });

  // Debug WebSocket connection status disabled

  const addNotification = useCallback((notification: NotificationData) => {
    setNotifications(prev => {
      const exists = prev.some(n => n.id === notification.id);
      if (exists) return prev;
      
      return [notification, ...prev];
    });
  }, []);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
      });
      
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, isRead: true, readAt: new Date().toISOString() }
            : n
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const unreadNotifications = notifications.filter(n => !n.isRead);
    
    try {
      await Promise.all(
        unreadNotifications.map(n => 
          fetch(`/api/notifications/${n.id}/read`, { method: 'POST' })
        )
      );
      
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [notifications]);

  const removeNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const contextValue: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearNotifications,
    isWebSocketConnected,
    isWebSocketConnecting,
    webSocketError,
    toasts,
    addToast,
    removeToast
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
