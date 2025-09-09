import { NextRequest, NextResponse } from 'next/server';
import { requireAdminForAPI } from '@/lib/rbac';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    await requireAdminForAPI();

    // Get basic counts
    const [totalUsers, totalRoles, totalPermissions, activeUserRoles] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('roles').select('*', { count: 'exact', head: true }),
      supabase.from('permissions').select('*', { count: 'exact', head: true }),
      supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('is_active', true)
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
      totalUsers: totalUsers.count || 0,
      totalRoles: totalRoles.count || 0,
      totalPermissions: totalPermissions.count || 0,
      activeUserRoles: activeUserRoles.count || 0,
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
