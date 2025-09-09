import { NextRequest, NextResponse } from 'next/server';
import { requireAdminForAPI } from '@/lib/rbac';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    await requireAdminForAPI();

    // Get basic counts
    const [totalUsers, totalRoles, totalPermissions, activeUserRoles] = await Promise.all([
      prisma.user.count(),
      prisma.role.count(),
      prisma.permission.count(),
      prisma.userRole.count({ where: { isActive: true } })
    ]);

    // Get recent activity (mock data for now - you can implement audit logs later)
    const recentActivity = [
      {
        id: '1',
        action: 'Created new role "Editor"',
        user: 'Admin User',
        timestamp: new Date().toISOString()
      },
      {
        id: '2',
        action: 'Assigned role "Moderator" to user',
        user: 'Admin User',
        timestamp: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: '3',
        action: 'Updated permission "content.create"',
        user: 'Admin User',
        timestamp: new Date(Date.now() - 7200000).toISOString()
      }
    ];

    return NextResponse.json({
      totalUsers,
      totalRoles,
      totalPermissions,
      activeUserRoles,
      recentActivity
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
