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
  // Silence verbose websocket logs by default
  const wsLog = (..._args: any[]) => {};
  // Default: DISABLE websocket unless explicitly enabled
  const websocketEnabled = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_ENABLE_WEBSOCKET === '1'
  const websocketDisabled = !websocketEnabled || (
    typeof process !== 'undefined' && (process.env.NEXT_PUBLIC_DISABLE_WEBSOCKET === '1' || process.env.NEXT_PUBLIC_DISABLE_NOTIFICATIONS === '1')
  )
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
    if (websocketDisabled) {
      return;
    }
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
        wsLog('WebSocket connected to:', wsUrl);
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        
        // Authenticate the connection
        if (session.user) {
          const userId = (session.user as any).id;
          const isAdmin = (session.user as any).roles?.includes('admin') || (session.user as any).roles?.includes('super_admin') || (session.user as any).isAdmin;
          
          wsLog('Authenticating WebSocket with user:', userId, 'isAdmin:', isAdmin);
          
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
          wsLog('🔔 WebSocket message received:', {
            type: message.type,
            hasData: !!message.data,
            dataKeys: message.data ? Object.keys(message.data) : [],
            fullMessage: message
          });
          
          switch (message.type) {
            case 'connected':
              wsLog('✅ WebSocket client connected:', message.clientId);
              break;
              
            case 'authenticated':
              wsLog('✅ WebSocket authenticated for user:', message.userId);
              break;
              
            case 'notification':
              wsLog('🔔 Processing notification message...');
              if (message.data && onNotification) {
                wsLog('✅ Calling onNotification with data:', {
                  id: message.data.id,
                  title: message.data.title,
                  hasType: !!message.data.type,
                  isGlobal: message.data.isGlobal
                });
                onNotification(message.data);
              } else {
                wsLog('❌ No onNotification handler or no data in message:', {
                  hasData: !!message.data,
                  hasOnNotification: !!onNotification,
                  data: message.data
                });
              }
              break;
              
            case 'pong':
              wsLog('🏓 Pong received');
              break;
              
            default:
              wsLog('❓ Unknown WebSocket message type:', message.type);
          }
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error, 'Raw data:', event.data);
        }
      };

      ws.onclose = (event) => {
        wsLog('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        setIsConnecting(false);
        onDisconnect?.();

        // Auto-reconnect if enabled and not a manual close
        if (autoReconnect && event.code !== 1000) {
          wsLog('Attempting to reconnect in', reconnectInterval, 'ms');
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      ws.onerror = (event: Event) => {
        const readyState = ws.readyState;
        const stateText = readyState === WebSocket.CONNECTING ? 'CONNECTING' :
                          readyState === WebSocket.OPEN ? 'OPEN' :
                          readyState === WebSocket.CLOSING ? 'CLOSING' :
                          readyState === WebSocket.CLOSED ? 'CLOSED' : 'UNKNOWN';
        wsLog('WebSocket error: diagnostic', {
          url: wsUrl,
          readyState,
          stateText,
          eventType: event.type
        });
        setError('WebSocket connection error');
        setIsConnecting(false);
        // Proactively close to trigger onclose (and reconnect logic)
        try { ws.close(1011, 'Transport error'); } catch {}
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setError('Failed to create WebSocket connection');
      setIsConnecting(false);
    }
  }, [session, onNotification, onConnect, onDisconnect, autoReconnect, reconnectInterval, isConnecting, websocketDisabled]);

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
    if (websocketDisabled) {
      return;
    }
    if (session?.user && !isConnected && !isConnecting) {
      connect();
    }
  }, [session, isConnected, isConnecting, connect, websocketDisabled]);

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
