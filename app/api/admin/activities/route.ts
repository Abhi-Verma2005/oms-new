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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const { data: activities, error } = await supabase
      .from('activity_logs')
      .select(`
        *,
        user:users(
          id,
          name,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    // Transform the data to match the expected format
    const transformedActivities = activities?.map(activity => ({
      id: activity.id,
      action: activity.action,
      user: activity.user?.name || activity.user?.email || 'Unknown User',
      userId: activity.user_id,
      resource: activity.resource,
      resourceId: activity.resource_id,
      details: activity.details,
      ipAddress: activity.ip_address,
      userAgent: activity.user_agent,
      timestamp: activity.created_at,
      createdAt: activity.created_at
    })) || [];

    return NextResponse.json(transformedActivities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}