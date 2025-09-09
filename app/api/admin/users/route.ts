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

    const { data: users, error } = await supabase
      .from('users')
      .select(`
        id,
        name,
        email,
        created_at,
        user_roles!inner(count)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Transform the data to match the expected format
    const transformedUsers = users?.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.created_at,
      _count: {
        userRoles: user.user_roles?.[0]?.count || 0
      }
    })) || [];

    return NextResponse.json({ users: transformedUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}