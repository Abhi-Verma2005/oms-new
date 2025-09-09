'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { getFullClientWebSocketUrl } from '@/lib/websocket-utils';

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
}

interface WebSocketMessage {
  type: 'connected' | 'authenticated' | 'notification' | 'pong';
  clientId?: string;
  userId?: string;
  isAdmin?: boolean;
  data?: NotificationData;
}

interface UseNotificationWebSocketOptions {
  onNotification?: (notification: NotificationData) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
}

export function useNotificationWebSocket(options: UseNotificationWebSocketOptions = {}) {
  const { data: session } = useSession();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    onNotification,
    onConnect,
    onDisconnect,
    autoReconnect = true,
    reconnectInterval = 3000
  } = options;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN || isConnecting) {
      return;
    }

    if (!session?.user) {
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Get WebSocket URL using consistent utility function
      const wsUrl = getFullClientWebSocketUrl();
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected to:', wsUrl);
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        
        // Authenticate the connection
        if (session.user) {
          const userId = (session.user as any).id;
          const isAdmin = (session.user as any).roles?.includes('admin') || (session.user as any).roles?.includes('super_admin') || (session.user as any).isAdmin;
          
          console.log('Authenticating WebSocket with user:', userId, 'isAdmin:', isAdmin);
          
          ws.send(JSON.stringify({
            type: 'authenticate',
            userId,
            isAdmin
          }));
        }
        
        onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('WebSocket message received:', message);
          
          switch (message.type) {
            case 'connected':
              console.log('WebSocket client connected:', message.clientId);
              break;
              
            case 'authenticated':
              console.log('WebSocket authenticated for user:', message.userId);
              break;
              
            case 'notification':
              if (message.data && onNotification) {
                console.log('Received notification via WebSocket:', message.data);
                onNotification(message.data);
              } else {
                console.log('No onNotification handler or no data in message');
              }
              break;
              
            case 'pong':
              // Handle ping/pong for connection health
              break;
              
            default:
              console.log('Unknown WebSocket message type:', message.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        setIsConnecting(false);
        onDisconnect?.();

        // Auto-reconnect if enabled and not a manual close
        if (autoReconnect && event.code !== 1000) {
          console.log('Attempting to reconnect in', reconnectInterval, 'ms');
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('WebSocket connection error');
        setIsConnecting(false);
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setError('Failed to create WebSocket connection');
      setIsConnecting(false);
    }
  }, [session, onNotification, onConnect, onDisconnect, autoReconnect, reconnectInterval, isConnecting]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  // Connect when session is available
  useEffect(() => {
    if (session?.user && !isConnected && !isConnecting) {
      connect();
    }
  }, [session, isConnected, isConnecting, connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Ping to keep connection alive
  useEffect(() => {
    if (!isConnected) return;

    const pingInterval = setInterval(() => {
      sendMessage({ type: 'ping' });
    }, 30000); // Ping every 30 seconds

    return () => clearInterval(pingInterval);
  }, [isConnected, sendMessage]);

  return {
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    sendMessage
  };
}
