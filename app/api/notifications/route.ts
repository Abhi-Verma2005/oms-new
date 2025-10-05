import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
// WebSocket server is now independent - we'll call it via HTTP API

// Use dedicated WS API base for HTTP broadcast to the WS service
const WS_SERVER_URL = process.env.WS_API_URL || 'http://localhost:8001';

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
    } else {
      console.log('✅ Notification broadcasted successfully');
    }
  } catch (error) {
    console.error('❌ Error broadcasting notification:', error);
  }
}

// GET /api/notifications - Get notifications for the current user
export async function GET(request: NextRequest) {
  try {
    if (!prisma) {
      console.error('Prisma client not available in notifications GET API');
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get notifications that are active and either global or targeted to this user
    let notifications = [];
    try {
      notifications = await prisma.notification.findMany({
        where: {
          isActive: true,
          AND: [
            {
              OR: [
                { isGlobal: true },
                { targetUserIds: { has: userId } }
              ]
            },
            {
              OR: [
                { expiresAt: null },
                { expiresAt: { gt: new Date() } }
              ]
            }
          ]
        },
        include: {
          type: true,
          userReads: {
            where: {
              userId: userId
            }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ],
        take: limit,
        skip: offset
      });
    } catch (dbError) {
      console.warn('Database connection failed for notifications, returning empty list:', dbError);
      // Return empty notifications when database is unavailable
      return NextResponse.json({
        notifications: [],
        total: 0,
        error: 'Database temporarily unavailable'
      });
    }

    // Transform the data to include read status
    const notificationsWithReadStatus = notifications.map((notification: any) => ({
      ...notification,
      isRead: notification.userReads.length > 0,
      readAt: notification.userReads[0]?.readAt || null
    }));

    return NextResponse.json({
      notifications: notificationsWithReadStatus,
      total: notifications.length
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Create a new notification (admin only)
export async function POST(request: NextRequest) {
  try {
    if (!prisma) {
      console.error('Prisma client not available in notifications POST API');
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
    }

    // Check if user has admin role
    let userRoles = [];
    try {
      userRoles = await prisma.userRole.findMany({
        where: {
          userId: userId,
          isActive: true
        },
        include: {
          role: true
        }
      });
    } catch (dbError) {
      console.warn('Database connection failed for user roles check:', dbError);
      return NextResponse.json(
        { error: 'Database temporarily unavailable' },
        { status: 503 }
      );
    }

    const isAdmin = userRoles.some((userRole: any) => 
      userRole.role.name === 'admin' || userRole.role.name === 'super_admin'
    );

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const requestBody = await request.json();
    const {
      title,
      body: notificationBody,
      imageUrl,
      typeId,
      isGlobal = true,
      targetUserIds = [],
      priority = 'NORMAL',
      expiresAt
    } = requestBody;

    // Validate required fields
    if (!title || !notificationBody || !typeId) {
      return NextResponse.json(
        { error: 'Title, body, and typeId are required' },
        { status: 400 }
      );
    }

    // Verify notification type exists
    let notificationType;
    try {
      notificationType = await prisma.notificationType.findUnique({
        where: { id: typeId }
      });
    } catch (dbError) {
      console.warn('Database connection failed for notification type check:', dbError);
      return NextResponse.json(
        { error: 'Database temporarily unavailable' },
        { status: 503 }
      );
    }

    if (!notificationType) {
      return NextResponse.json(
        { error: 'Invalid notification type' },
        { status: 400 }
      );
    }

    // Create notification
    let notification;
    try {
      notification = await prisma.notification.create({
        data: {
          title,
          body: notificationBody,
          imageUrl,
          typeId,
          isGlobal,
          targetUserIds: isGlobal ? [] : targetUserIds,
          priority,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          createdBy: userId
        },
        include: {
          type: true
        }
      });
    } catch (dbError) {
      console.warn('Database connection failed for notification creation:', dbError);
      return NextResponse.json(
        { error: 'Database temporarily unavailable' },
        { status: 503 }
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

    // Note: Notification is created but not automatically broadcast
    // Use the "Push Now" button in admin panel to broadcast manually

    return NextResponse.json(notification, { status: 201 });

  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}
