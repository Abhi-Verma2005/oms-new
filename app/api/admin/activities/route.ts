import { NextRequest, NextResponse } from 'next/server';
import { requireAdminForAPI } from '@/lib/rbac';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    await requireAdminForAPI();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const activities = await prisma.userActivity.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit
    });

    // Transform the data to match the expected format
    const transformedActivities = activities.map((activity: any) => ({
      id: activity.id,
      action: activity.activity,
      user: activity.user?.name || activity.user?.email || 'Unknown User',
      userId: activity.userId,
      resource: activity.category,
      resourceId: null,
      details: activity.description,
      ipAddress: activity.ipAddress,
      userAgent: activity.userAgent,
      timestamp: activity.createdAt.toISOString(),
      createdAt: activity.createdAt.toISOString()
    }));

    return NextResponse.json(transformedActivities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}