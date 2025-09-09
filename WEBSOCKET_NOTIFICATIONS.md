# Real-time Push Notifications with WebSocket

This document describes the real-time push notification system implemented using WebSockets.

## Features

- **Real-time notifications**: Notifications appear instantly as sliding toasts from the bottom-right corner
- **WebSocket connection**: Persistent connection for real-time updates
- **Admin push feature**: Admins can manually push notifications to all connected users
- **Auto-reconnection**: WebSocket automatically reconnects on connection loss
- **User targeting**: Notifications can be sent to all users or specific user groups
- **Priority levels**: Support for LOW, NORMAL, HIGH, and URGENT priority notifications

## Architecture

### WebSocket Server
- **File**: `ws-server/src/websocket-server.ts`
- **Endpoint**: `/api/notifications/ws`
- **Features**:
  - Client authentication
  - User targeting (global vs specific users)
  - Admin broadcasting
  - Connection management

### Client-side Components
- **NotificationToast**: Sliding toast component from bottom-right
- **NotificationToastContainer**: Manages multiple toast instances
- **useNotificationWebSocket**: Hook for WebSocket connection
- **NotificationProvider**: Context for global notification state

### API Integration
- **Notification Creation**: Automatically broadcasts new notifications
- **Admin Push**: Manual push endpoint for admins
- **Real-time Updates**: All notification lists update in real-time

## Usage

### For Users
1. Notifications automatically appear as sliding toasts
2. Click "Mark as read" to dismiss and mark as read
3. Notifications also appear in the notification dropdown and full page

### For Admins
1. Create notifications in the admin panel
2. Use the "Push Now" button to immediately send to all connected users
3. Monitor connected clients count

## Development

### Starting the Server
```bash
# Use the custom server with WebSocket support
pnpm dev

# Or use the standard Next.js server (WebSocket won't work)
pnpm dev:next
```

### Testing WebSocket
```bash
# Run the test client
node scripts/test-websocket.mjs
```

### WebSocket Message Types

#### Client to Server
```typescript
// Authenticate
{
  type: 'authenticate',
  userId: string,
  isAdmin: boolean
}

// Ping
{
  type: 'ping'
}
```

#### Server to Client
```typescript
// Connection confirmation
{
  type: 'connected',
  clientId: string
}

// Authentication confirmation
{
  type: 'authenticated',
  userId: string,
  isAdmin: boolean
}

// New notification
{
  type: 'notification',
  data: {
    id: string,
    title: string,
    body: string,
    // ... other notification fields
  }
}

// Pong response
{
  type: 'pong'
}
```

## Configuration

### Environment Variables
No additional environment variables required. The WebSocket server uses the same port as the Next.js application.

### Customization
- **Toast duration**: Modify `duration` prop in `NotificationToast` component
- **Auto-close**: Toggle `autoClose` prop in `NotificationToast` component
- **Reconnection interval**: Modify `reconnectInterval` in `useNotificationWebSocket` hook

## Troubleshooting

### WebSocket Connection Issues
1. Ensure you're using the custom server (`pnpm dev`)
2. Check browser console for WebSocket errors
3. Verify the WebSocket endpoint is accessible

### Notifications Not Appearing
1. Check if WebSocket is connected (look for connection status in context)
2. Verify user authentication
3. Check notification targeting (global vs specific users)

### Admin Push Not Working
1. Ensure user has admin role
2. Check if notification is active
3. Verify WebSocket server is running

## Security Considerations

- WebSocket connections are authenticated using session data
- Admin functions require proper role verification
- User targeting respects notification permissions
- Connection limits can be implemented if needed

## Performance Notes

- WebSocket connections are lightweight
- Automatic cleanup on component unmount
- Efficient message broadcasting
- Connection health monitoring with ping/pong

