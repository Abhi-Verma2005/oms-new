/**
 * Utility functions for WebSocket URL configuration
 */

/**
 * Get the WebSocket URL with consistent fallback
 * Primary: process.env.WEBSOCKET_URL
 * Fallback: ws://localhost:8000
 */
export function getWebSocketUrl(): string {
  return process.env.WEBSOCKET_URL || 'ws://localhost:8000';
}

/**
 * Get the WebSocket URL for client-side usage
 * Handles protocol detection (ws:// vs wss://) based on current location
 */
export function getClientWebSocketUrl(): string {
  // Check for client-side environment variable first (NEXT_PUBLIC_ prefix required)
  const clientWsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL;
  if (clientWsUrl) {
    return clientWsUrl;
  }
  
  // For localhost in development, always use ws:// regardless of page protocol
  if (typeof window !== 'undefined') {
    // Check if we're in development (localhost or 127.0.0.1)
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname === '0.0.0.0';
    
    if (isLocalhost) {
      return 'ws://localhost:8000';
    }
    
    // For non-localhost, determine protocol based on current location
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//localhost:8000`;
  }
  
  // Server-side fallback
  return 'ws://localhost:8000';
}

/**
 * Get the WebSocket endpoint path
 */
export function getWebSocketEndpoint(): string {
  return '/api/notifications/ws';
}

/**
 * Get the full WebSocket URL with endpoint
 */
export function getFullWebSocketUrl(): string {
  const baseUrl = getWebSocketUrl();
  const endpoint = getWebSocketEndpoint();
  
  // Ensure baseUrl doesn't already end with the endpoint
  if (baseUrl.endsWith(endpoint)) {
    return baseUrl;
  }
  
  // Ensure proper URL joining
  const separator = baseUrl.endsWith('/') ? '' : '/';
  return `${baseUrl}${separator}${endpoint.replace(/^\//, '')}`;
}

/**
 * Get the full WebSocket URL for client-side usage
 */
export function getFullClientWebSocketUrl(): string {
  const baseUrl = getClientWebSocketUrl();
  const endpoint = getWebSocketEndpoint();
  
  // Ensure baseUrl doesn't already end with the endpoint
  if (baseUrl.endsWith(endpoint)) {
    return baseUrl;
  }
  
  // Ensure proper URL joining
  const separator = baseUrl.endsWith('/') ? '' : '/';
  const fullUrl = `${baseUrl}${separator}${endpoint.replace(/^\//, '')}`;
  
  // Debug logging in development
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('🔌 WebSocket URL generated:', {
      baseUrl,
      endpoint,
      fullUrl,
      hostname: window.location.hostname,
      protocol: window.location.protocol,
      NEXT_PUBLIC_WEBSOCKET_URL: process.env.NEXT_PUBLIC_WEBSOCKET_URL,
      WEBSOCKET_URL: process.env.WEBSOCKET_URL
    });
  }
  
  return fullUrl;
}
