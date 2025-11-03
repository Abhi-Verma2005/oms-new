import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import WebSocket from 'ws';

// POST /api/admin/notifications/push - Push a notification to all connected users
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
    }

    // Check if user has admin role
    const userRoles = await prisma.userRole.findMany({
      where: {
        userId: userId,
        isActive: true
      },
      include: {
        role: true
      }
    });

    const isAdmin = userRoles.some((userRole: any) => 
      userRole.role.name === 'admin' || userRole.role.name === 'super_admin'
    );

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let requestBody;
    try {
      requestBody = await request.json();
    } catch (error) {
      console.error('❌ [Push] Error parsing request body:', error);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { notificationId } = requestBody;

    if (!notificationId) {
      console.error('❌ [Push] Missing notificationId in request:', requestBody);
      return NextResponse.json(
        { error: 'Notification ID is required', received: requestBody },
        { status: 400 }
      );
    }

    // Get the notification with its type
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      include: {
        type: true
      }
    });

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    if (!notification.isActive) {
      return NextResponse.json(
        { error: 'Cannot push inactive notification' },
        { status: 400 }
      );
    }

    // Check if notification has expired
    if (notification.expiresAt && new Date(notification.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'Cannot push expired notification' },
        { status: 400 }
      );
    }

    // Prepare notification data for WebSocket broadcast
    const notificationData = {
      id: notification.id,
      title: notification.title,
      body: notification.body,
      imageUrl: notification.imageUrl,
      typeId: notification.typeId,
      isActive: notification.isActive,
      isGlobal: notification.isGlobal,
      targetUserIds: notification.targetUserIds,
      priority: notification.priority,
      expiresAt: notification.expiresAt?.toISOString(),
      createdAt: notification.createdAt.toISOString(),
      updatedAt: notification.updatedAt.toISOString(),
      type: {
        id: notification.type.id,
        name: notification.type.name,
        displayName: notification.type.displayName,
        icon: notification.type.icon,
        color: notification.type.color
      }
    };

    // Broadcast via backend Notification WebSocket (pure WS path)
    const wsPort = parseInt(process.env.WS_PORT || '8080', 10) + 1; // notifications on ws port + 1
    const wsUrl = process.env.NOTIFICATION_WS_URL || `ws://localhost:${wsPort}`;

    // Open a short-lived admin WS client to send the broadcast
    const ws = new WebSocket(wsUrl);

    const result = await new Promise<{ success: boolean; reason?: string }>((resolve) => {
      let settled = false;

      const fail = (reason: string) => {
        if (settled) return; settled = true; resolve({ success: false, reason });
      };
      const ok = () => { if (settled) return; settled = true; resolve({ success: true }); };

      ws.on('open', () => {
        try {
          // authenticate as admin
          ws.send(JSON.stringify({ type: 'authenticate', userId: 'system-broadcast-client', isAdmin: true }));
          // send broadcast
          ws.send(JSON.stringify({ type: 'broadcast', notification: notificationData }));
          // wait briefly for ack then succeed
          const timeout = setTimeout(() => ok(), 150);
          ws.on('message', (data) => {
            try {
              const msg = JSON.parse(data.toString());
              if (msg.type === 'broadcast-complete') {
                clearTimeout(timeout);
                ok();
              }
            } catch {
              // ignore non-JSON
            }
          });
        } catch (err) {
          fail('send-failed');
        }
      });

      ws.on('error', () => fail('ws-error'));
      ws.on('close', (code) => {
        if (!settled && code !== 1000) fail('ws-closed');
      });
    });

    try { ws.close(); } catch {}

    if (!result.success) {
      return NextResponse.json({ 
        message: 'Notification created but failed to broadcast (ws error)',
        success: false
      }, { status: 503 });
    }

    return NextResponse.json({ 
      message: 'Notification pushed successfully',
      success: true
    });

  } catch (error) {
    console.error('Error pushing notification:', error);
    return NextResponse.json(
      { error: 'Failed to push notification' },
      { status: 500 }
    );
  }
}
