import { NextRequest, NextResponse } from 'next/server';
import { requireAdminForAPI } from '@/lib/rbac';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    await requireAdminForAPI();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const userId = searchParams.get('userId');
    const tagIds = searchParams.get('tagIds')?.split(',').filter(Boolean);
    const hasRoles = searchParams.get('hasRoles');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { activity: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }

    if (category && category !== 'all') {
      where.category = category;
    }

    if (userId) {
      where.userId = userId;
    }

    // Build user conditions for tag filtering and role filtering
    const userConditions: any = {};
    
    if (tagIds && tagIds.length > 0) {
      // Filter activities by users who have the specified tags
      userConditions.userTags = {
        some: {
          tagId: { in: tagIds }
        }
      };
    }

    if (hasRoles && hasRoles !== 'all') {
      if (hasRoles === 'with_roles') {
        userConditions.roles = {
          some: {}
        };
      } else if (hasRoles === 'without_roles') {
        userConditions.roles = {
          none: {}
        };
      }
    }

    // Apply user conditions if any exist
    if (Object.keys(userConditions).length > 0) {
      if (where.OR) {
        // If there's already an OR condition, combine with user conditions
        where.AND = [
          { OR: where.OR },
          { user: userConditions }
        ];
        delete where.OR;
      } else {
        where.user = userConditions;
      }
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy === 'user') {
      orderBy.user = { name: sortOrder };
    } else {
      orderBy[sortBy] = sortOrder;
    }

    // Get activities with pagination
    const [activities, total] = await Promise.all([
      prisma.userActivity.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              userTags: {
                include: {
                  tag: true
                }
              }
            }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.userActivity.count({ where })
    ]);

    // Transform the data to match the expected format
    const transformedActivities = activities.map((activity: any) => ({
      id: activity.id,
      action: activity.activity,
      user: activity.user?.name || activity.user?.email || 'Unknown User',
      userId: activity.userId,
      userTags: activity.user?.userTags?.map((ut: any) => ({
        id: ut.tag.id,
        name: ut.tag.name,
        color: ut.tag.color,
        description: ut.tag.description
      })) || [],
      resource: activity.category,
      resourceId: null,
      details: activity.description,
      ipAddress: activity.ipAddress,
      userAgent: activity.userAgent,
      timestamp: activity.createdAt.toISOString(),
      createdAt: activity.createdAt.toISOString()
    }));

    return NextResponse.json({
      data: transformedActivities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}