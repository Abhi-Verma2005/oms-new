import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// POST /api/notifications/[id]/read - Mark notification as read
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
    }

    const notificationId = params.id;

    // Check if notification exists and user has access to it
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        isActive: true,
        OR: [
          { isGlobal: true },
          { targetUserIds: { has: userId } }
        ]
      }
    });

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    // Check if already read
    const existingRead = await prisma.userNotificationRead.findUnique({
      where: {
        userId_notificationId: {
          userId: userId,
          notificationId: notificationId
        }
      }
    });

    if (existingRead) {
      return NextResponse.json({ message: 'Already read' });
    }

    // Mark as read
    await prisma.userNotificationRead.create({
      data: {
        userId: userId,
        notificationId: notificationId
      }
    });

    return NextResponse.json({ message: 'Notification marked as read' });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
}
