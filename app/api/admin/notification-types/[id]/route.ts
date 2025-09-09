import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// PUT /api/admin/notification-types/[id] - Update notification type
export async function PUT(
  request: NextRequest,
  { params }: any
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

    const notificationTypeId = params.id;
    const body = await request.json();
    const { name, displayName, description, icon, color, isActive } = body;

    // Check if notification type exists
    const existingType = await prisma.notificationType.findUnique({
      where: { id: notificationTypeId }
    });

    if (!existingType) {
      return NextResponse.json(
        { error: 'Notification type not found' },
        { status: 404 }
      );
    }

    // Check if name is being changed and if it conflicts
    if (name && name !== existingType.name) {
      const nameConflict = await prisma.notificationType.findUnique({
        where: { name }
      });

      if (nameConflict) {
        return NextResponse.json(
          { error: 'Notification type with this name already exists' },
          { status: 400 }
        );
      }
    }

    // Update notification type
    const updatedType = await prisma.notificationType.update({
      where: { id: notificationTypeId },
      data: {
        ...(name && { name }),
        ...(displayName && { displayName }),
        ...(description !== undefined && { description }),
        ...(icon !== undefined && { icon }),
        ...(color !== undefined && { color }),
        ...(isActive !== undefined && { isActive })
      }
    });

    return NextResponse.json(updatedType);

  } catch (error) {
    console.error('Error updating notification type:', error);
    return NextResponse.json(
      { error: 'Failed to update notification type' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/notification-types/[id] - Delete notification type
export async function DELETE(
  request: NextRequest,
  { params }: any
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

    const notificationTypeId = params.id;

    // Check if notification type exists
    const existingType = await prisma.notificationType.findUnique({
      where: { id: notificationTypeId },
      include: {
        notifications: true
      }
    });

    if (!existingType) {
      return NextResponse.json(
        { error: 'Notification type not found' },
        { status: 404 }
      );
    }

    // Check if there are notifications using this type
    if (existingType.notifications.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete notification type that has associated notifications' },
        { status: 400 }
      );
    }

    // Delete notification type
    await prisma.notificationType.delete({
      where: { id: notificationTypeId }
    });

    return NextResponse.json({ message: 'Notification type deleted successfully' });

  } catch (error) {
    console.error('Error deleting notification type:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification type' },
      { status: 500 }
    );
  }
}
