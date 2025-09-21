import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/admin/notification-types - Get all notification types
export async function GET() {
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

    const notificationTypes = await prisma.notificationType.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(notificationTypes);

  } catch (error) {
    console.error('Error fetching notification types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification types' },
      { status: 500 }
    );
  }
}

// POST /api/admin/notification-types - Create a new notification type
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

    const body = await request.json();
    const { name, displayName, description, icon, color, isActive = true } = body;

    // Validate required fields
    if (!name || !displayName) {
      return NextResponse.json(
        { error: 'Name and displayName are required' },
        { status: 400 }
      );
    }

    // Check if name already exists
    const existingType = await prisma.notificationType.findUnique({
      where: { name }
    });

    if (existingType) {
      return NextResponse.json(
        { error: 'Notification type with this name already exists' },
        { status: 400 }
      );
    }

    // Create notification type
    const notificationType = await prisma.notificationType.create({
      data: {
        name,
        displayName,
        description,
        icon,
        color,
        isActive
      }
    });

    return NextResponse.json(notificationType, { status: 201 });

  } catch (error) {
    console.error('Error creating notification type:', error);
    return NextResponse.json(
      { error: 'Failed to create notification type' },
      { status: 500 }
    );
  }
}
