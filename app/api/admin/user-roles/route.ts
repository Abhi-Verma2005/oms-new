import { NextRequest, NextResponse } from 'next/server';
import { requireAdminForAPI } from '@/lib/rbac';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const assignRoleSchema = z.object({
  userId: z.string().uuid(),
  roleId: z.string().uuid(),
  expiresAt: z.string().datetime().optional()
});

export async function GET(request: NextRequest) {
  try {
    await requireAdminForAPI();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    let query = supabase
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
      .order('assigned_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: userRoles, error } = await query;

    if (error) {
      throw error;
    }

    // Transform the data to match the expected format
    const transformedUserRoles = userRoles?.map(userRole => ({
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
    })) || [];

    return NextResponse.json(transformedUserRoles);
  } catch (error) {
    console.error('Error fetching user roles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user roles' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminUser = await requireAdminForAPI();
    const body = await request.json();
    
    const validatedData = assignRoleSchema.parse(body);
    
    // Check if assignment already exists
    const { data: existingAssignment } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', validatedData.userId)
      .eq('role_id', validatedData.roleId)
      .single();
    
    if (existingAssignment) {
      if (existingAssignment.is_active) {
        return NextResponse.json(
          { error: 'User already has this role assigned' },
          { status: 400 }
        );
      } else {
        // Reactivate existing assignment
        const { data: updatedAssignment, error: updateError } = await supabase
          .from('user_roles')
          .update({
            is_active: true,
            assigned_by: adminUser.id,
            assigned_at: new Date().toISOString(),
            expires_at: validatedData.expiresAt ? new Date(validatedData.expiresAt).toISOString() : null
          })
          .eq('user_id', validatedData.userId)
          .eq('role_id', validatedData.roleId)
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

        const transformedAssignment = {
          id: updatedAssignment.id,
          userId: updatedAssignment.user_id,
          roleId: updatedAssignment.role_id,
          assignedBy: updatedAssignment.assigned_by,
          assignedAt: updatedAssignment.assigned_at,
          expiresAt: updatedAssignment.expires_at,
          isActive: updatedAssignment.is_active,
          role: {
            id: updatedAssignment.role.id,
            name: updatedAssignment.role.name,
            displayName: updatedAssignment.role.display_name,
            isSystem: updatedAssignment.role.is_system
          },
          user: {
            id: updatedAssignment.user.id,
            name: updatedAssignment.user.name,
            email: updatedAssignment.user.email
          }
        };

        return NextResponse.json(transformedAssignment, { status: 201 });
      }
    }

    // Create new assignment
    const { data: userRole, error: createError } = await supabase
      .from('user_roles')
      .insert({
        user_id: validatedData.userId,
        role_id: validatedData.roleId,
        assigned_by: adminUser.id,
        expires_at: validatedData.expiresAt ? new Date(validatedData.expiresAt).toISOString() : null
      })
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

    if (createError) {
      throw createError;
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

    return NextResponse.json(transformedUserRole, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error assigning role:', error);
    return NextResponse.json(
      { error: 'Failed to assign role' },
      { status: 500 }
    );
  }
}
