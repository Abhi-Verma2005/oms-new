import { NextRequest, NextResponse } from 'next/server';
import { requireAdminForAPI } from '@/lib/rbac';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const updateUserRoleSchema = z.object({
  isActive: z.boolean().optional()
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminForAPI();
    const { id } = await params;

    const { data: userRole, error } = await supabase
      .from('user_roles')
      .select(`
        *,
        role:roles(
          id,
          name,
          display_name,
          is_system
        ),
        user:users(
          id,
          name,
          email
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'User role assignment not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    const transformedUserRole = {
      id: userRole.id,
      userId: userRole.user_id,
      roleId: userRole.role_id,
      assignedBy: userRole.assigned_by,
      assignedAt: userRole.assigned_at,
      expiresAt: userRole.expires_at,
      isActive: userRole.is_active,
      role: {
        id: userRole.role.id,
        name: userRole.role.name,
        displayName: userRole.role.display_name,
        isSystem: userRole.role.is_system
      },
      user: {
        id: userRole.user.id,
        name: userRole.user.name,
        email: userRole.user.email
      }
    };

    return NextResponse.json(transformedUserRole);
  } catch (error) {
    console.error('Error fetching user role:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user role' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminForAPI();
    const { id } = await params;
    const body = await request.json();
    
    const validatedData = updateUserRoleSchema.parse(body);
    
    // Check if user role assignment exists
    const { data: existingUserRole, error: fetchError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'User role assignment not found' },
          { status: 404 }
        );
      }
      throw fetchError;
    }

    // Update user role assignment
    const { data: userRole, error: updateError } = await supabase
      .from('user_roles')
      .update({
        is_active: validatedData.isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        role:roles(
          id,
          name,
          display_name,
          is_system
        ),
        user:users(
          id,
          name,
          email
        )
      `)
      .single();

    if (updateError) {
      throw updateError;
    }

    const transformedUserRole = {
      id: userRole.id,
      userId: userRole.user_id,
      roleId: userRole.role_id,
      assignedBy: userRole.assigned_by,
      assignedAt: userRole.assigned_at,
      expiresAt: userRole.expires_at,
      isActive: userRole.is_active,
      role: {
        id: userRole.role.id,
        name: userRole.role.name,
        displayName: userRole.role.display_name,
        isSystem: userRole.role.is_system
      },
      user: {
        id: userRole.user.id,
        name: userRole.user.name,
        email: userRole.user.email
      }
    };

    return NextResponse.json(transformedUserRole);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { error: 'Failed to update user role' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminForAPI();
    const { id } = await params;

    // Check if user role assignment exists
    const { data: existingUserRole, error: fetchError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'User role assignment not found' },
          { status: 404 }
        );
      }
      throw fetchError;
    }

    // Delete user role assignment
    const { error: deleteError } = await supabase
      .from('user_roles')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user role:', error);
    return NextResponse.json(
      { error: 'Failed to delete user role' },
      { status: 500 }
    );
  }
}
