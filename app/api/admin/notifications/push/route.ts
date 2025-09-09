import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
// WebSocket server is now independent - we'll call it via HTTP API

const WS_SERVER_URL = process.env.WS_SERVER_URL || 'http://localhost:8001';

async function broadcastNotification(notification: any) {
  try {
    const response = await fetch(`${WS_SERVER_URL}/api/broadcast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ notification }),
    });

    if (!response.ok) {
      console.error('Failed to broadcast notification:', await response.text());
      return false;
    } else {
      console.log('✅ Notification broadcasted successfully');
      return true;
    }
  } catch (error) {
    console.error('❌ Error broadcasting notification:', error);
    return false;
  }
}

// POST /api/admin/notifications/push - Push a notification to all connected users
export async function POST(request: NextRequest) {
  console.log('🚀 PUSH API ROUTE CALLED - Starting notification push process');
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

    const { notificationId } = await request.json();

    if (!notificationId) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
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

    // Broadcast the notification via WebSocket
    console.log('🚀 Starting notification broadcast...');
    console.log('📋 Notification data:', {
      id: notificationData.id,
      title: notificationData.title,
      isGlobal: notificationData.isGlobal,
      targetUserIds: notificationData.targetUserIds
    });
    
    const broadcastSuccess = await broadcastNotification(notificationData);
    
    if (broadcastSuccess) {
      console.log(`✅ Notification "${notification.title}" pushed to all connected users by admin ${userId}`);
      return NextResponse.json({ 
        message: 'Notification pushed successfully',
        success: true
      });
    } else {
      return NextResponse.json({ 
        message: 'Notification created but failed to broadcast',
        success: false
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error pushing notification:', error);
    return NextResponse.json(
      { error: 'Failed to push notification' },
      { status: 500 }
    );
  }
}
