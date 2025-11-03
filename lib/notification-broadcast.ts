/**
 * Utility to broadcast notifications via WebSocket from the frontend
 * This opens a temporary WebSocket connection, authenticates as admin,
 * sends the broadcast message, and closes the connection.
 */

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
  type: {
    id: string;
    name: string;
    displayName: string;
    icon?: string;
    color?: string;
  };
}

export async function broadcastNotificationViaWebSocket(
  notification: NotificationData
): Promise<{ success: boolean; error?: string }> {
  // Use same WS URL as notification context
  const WS_URL = process.env.NEXT_PUBLIC_NOTIFICATION_WS_URL || 'ws://localhost:8081/';

  // Validate notification data
  if (!notification || !notification.id || !notification.type) {
    console.error('[Broadcast] Invalid notification data:', notification);
    return { success: false, error: 'Invalid notification data' };
  }

  return new Promise((resolve) => {
    let settled = false;
    let ackTimeout: NodeJS.Timeout | null = null;
    const ws = new WebSocket(WS_URL);

    const fail = (reason: string) => {
      if (settled) return;
      settled = true;
      if (ackTimeout) clearTimeout(ackTimeout);
      try {
        ws.close();
      } catch {}
      console.error('[Broadcast] Failed:', reason);
      resolve({ success: false, error: reason });
    };

    const ok = () => {
      if (settled) return;
      settled = true;
      if (ackTimeout) clearTimeout(ackTimeout);
      try {
        ws.close();
      } catch {}
      resolve({ success: true });
    };

    const timeout = setTimeout(() => {
      fail('Connection timeout');
    }, 5000); // 5 second timeout

    // Set up message handler before connection opens
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'authenticated') {
          // Now send the broadcast message
          ws.send(JSON.stringify({
            type: 'broadcast',
            notification: notification
          }));
          // Wait for broadcast-complete acknowledgment
          ackTimeout = setTimeout(() => {
            // If no ack received, assume success (server might not send ack immediately)
            clearTimeout(timeout);
            ok();
          }, 300);
        } else if (msg.type === 'broadcast-complete') {
          clearTimeout(timeout);
          if (ackTimeout) clearTimeout(ackTimeout);
          ok();
        } else if (msg.type === 'error') {
          clearTimeout(timeout);
          if (ackTimeout) clearTimeout(ackTimeout);
          fail(msg.message || 'Broadcast failed');
        }
      } catch {
        // Ignore non-JSON or parsing errors
      }
    };

    ws.onopen = () => {
      try {
        // Authenticate as admin first
        ws.send(JSON.stringify({
          type: 'authenticate',
          userId: 'system-broadcast-client',
          isAdmin: true
        }));
      } catch (err) {
        clearTimeout(timeout);
        fail(`Failed to send message: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    };

    ws.onerror = (error) => {
      clearTimeout(timeout);
      if (ackTimeout) clearTimeout(ackTimeout);
      console.error('[Broadcast] WebSocket error:', error);
      fail('WebSocket connection error');
    };

    ws.onclose = (code) => {
      clearTimeout(timeout);
      if (ackTimeout) clearTimeout(ackTimeout);
      if (!settled) {
        if (code === 1000) {
          // Normal closure - might have succeeded
          ok();
        } else {
          fail(`WebSocket closed unexpectedly (code: ${code})`);
        }
      }
    };
  });
}

