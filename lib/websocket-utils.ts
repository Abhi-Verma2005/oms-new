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
  const baseUrl = process.env.WEBSOCKET_URL || 'ws://localhost:8000';
  
  // If WEBSOCKET_URL is set, use it as-is
  if (process.env.WEBSOCKET_URL) {
    return baseUrl;
  }
  
  // For fallback, determine protocol based on current location
  if (typeof window !== 'undefined') {
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
  return `${baseUrl}${separator}${endpoint.replace(/^\//, '')}`;
}
