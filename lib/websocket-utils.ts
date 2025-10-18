/**
 * Utility functions for WebSocket URL configuration
 */

/**
 * Get the WebSocket URL with consistent fallback
 * Primary: process.env.NEXT_PUBLIC_WEBSOCKET_URL
 * Fallback: ws://localhost:8000 for dev, wss://oms-ws.onrender.com for production
 */
export function getWebSocketUrl(): string {
  if (process.env.NEXT_PUBLIC_WEBSOCKET_URL) {
    const raw = process.env.NEXT_PUBLIC_WEBSOCKET_URL;
    // Normalize http/https to ws/wss if needed
    if (raw.startsWith('http://')) return raw.replace('http://', 'ws://');
    if (raw.startsWith('https://')) return raw.replace('https://', 'wss://');
    return raw;
  }
  
  // Default to production URL if in production, localhost for development
  if (process.env.NODE_ENV === 'production') {
    return 'wss://oms-ws.onrender.com';
  }
  
  return 'ws://localhost:3000';
}

/**
 * Get the WebSocket URL for client-side usage
 * Handles protocol detection (ws:// vs wss://) based on current location
 */
export function getClientWebSocketUrl(): string {
  // Check for client-side environment variable first (NEXT_PUBLIC_ prefix required)
  const clientWsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL;
  if (clientWsUrl) {
    if (clientWsUrl.startsWith('http://')) return clientWsUrl.replace('http://', 'ws://');
    if (clientWsUrl.startsWith('https://')) return clientWsUrl.replace('https://', 'wss://');
    return clientWsUrl;
  }
  
  // For localhost in development, always use ws:// regardless of page protocol
  if (typeof window !== 'undefined') {
    // Check if we're in development (localhost or 127.0.0.1)
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname === '0.0.0.0';
    
    if (isLocalhost) {
      return 'ws://localhost:3000';
    }
    
    // For production (non-localhost), use the Render URL
    return 'wss://oms-ws.onrender.com';
  }
  
  // Server-side fallback - use production URL in production
  if (process.env.NODE_ENV === 'production') {
    return 'wss://oms-ws.onrender.com';
  }
  return 'ws://localhost:3000';
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
  
  // Debug logging disabled to reduce noise
  
  return fullUrl;
}
