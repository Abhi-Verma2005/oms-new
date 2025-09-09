import { NextRequest, NextResponse } from 'next/server';
import { requireAdminForAPI } from '@/lib/rbac';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const updateRoleSchema = z.object({
  name: z.string().min(1).max(50).regex(/^[a-z-_]+$/, 'Name must contain only lowercase letters, hyphens, and underscores').optional(),
  displayName: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  permissionIds: z.array(z.string().uuid()).optional()
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminForAPI();
    const { id } = await params;

    const { data: role, error } = await supabase
      .from('roles')
      .select(`
        *,
        role_permissions(
          permission:permissions(*)
        ),
        user_roles!inner(count)
      `)
      .eq('id', id)
      .eq('user_roles.is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Role not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    const transformedRole = {
      id: role.id,
      name: role.name,
      displayName: role.display_name,
      description: role.description,
      isSystem: role.is_system,
      isActive: role.is_active,
      createdAt: role.created_at,
      updatedAt: role.updated_at,
      rolePermissions: role.role_permissions || [],
      _count: {
        userRoles: role.user_roles?.[0]?.count || 0
      }
    };

    return NextResponse.json(transformedRole);
  } catch (error) {
    console.error('Error fetching role:', error);
    return NextResponse.json(
      { error: 'Failed to fetch role' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await requireAdminForAPI();
    const { id } = await params;
    const body = await request.json();
    
    const validatedData = updateRoleSchema.parse(body);
    
    // Check if role exists
    const { data: existingRole, error: fetchError } = await supabase
      .from('roles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Role not found' },
          { status: 404 }
        );
      }
      throw fetchError;
    }

    // Check if role is system role
    if (existingRole.is_system && validatedData.name && validatedData.name !== existingRole.name) {
      return NextResponse.json(
        { error: 'Cannot modify system role name' },
        { status: 400 }
      );
    }

    // Check if new name already exists (if name is being changed)
    if (validatedData.name && validatedData.name !== existingRole.name) {
      const { data: nameExists } = await supabase
        .from('roles')
        .select('id')
        .eq('name', validatedData.name)
        .single();
      
      if (nameExists) {
        return NextResponse.json(
          { error: 'Role with this name already exists' },
          { status: 400 }
        );
      }
    }

    // Update role
    const { error: updateError } = await supabase
      .from('roles')
      .update({
        name: validatedData.name,
        display_name: validatedData.displayName,
        description: validatedData.description,
        is_active: validatedData.isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    // Update permissions if provided
    if (validatedData.permissionIds !== undefined) {
      // Remove existing permissions
      const { error: deleteError } = await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', id);

      if (deleteError) {
        throw deleteError;
      }

      // Add new permissions
      if (validatedData.permissionIds.length > 0) {
        const rolePermissions = validatedData.permissionIds.map(permissionId => ({
          role_id: id,
          permission_id: permissionId,
          granted_by: adminUser.id
        }));

        const { error: permissionError } = await supabase
          .from('role_permissions')
          .insert(rolePermissions);

        if (permissionError) {
          throw permissionError;
        }
      }
    }

    // Fetch updated role with counts
    const { data: updatedRole, error: fetchUpdatedError } = await supabase
      .from('roles')
      .select(`
        *,
        role_permissions(count),
        user_roles!inner(count)
      `)
      .eq('id', id)
      .eq('user_roles.is_active', true)
      .single();

    if (fetchUpdatedError) {
      throw fetchUpdatedError;
    }

    const transformedRole = {
      id: updatedRole.id,
      name: updatedRole.name,
      displayName: updatedRole.display_name,
      description: updatedRole.description,
      isSystem: updatedRole.is_system,
      isActive: updatedRole.is_active,
      createdAt: updatedRole.created_at,
      updatedAt: updatedRole.updated_at,
      rolePermissions: updatedRole.role_permissions || [],
      _count: {
        userRoles: updatedRole.user_roles?.[0]?.count || 0,
        rolePermissions: updatedRole.role_permissions?.[0]?.count || 0
      }
    };

    return NextResponse.json(transformedRole);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error updating role:', error);
    return NextResponse.json(
      { error: 'Failed to update role' },
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

    // Check if role exists
    const { data: existingRole, error: fetchError } = await supabase
      .from('roles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Role not found' },
          { status: 404 }
        );
      }
      throw fetchError;
    }

    // Check if role is system role
    if (existingRole.is_system) {
      return NextResponse.json(
        { error: 'Cannot delete system role' },
        { status: 400 }
      );
    }

    // Check if role has active user assignments
    const { count: activeAssignments } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true })
      .eq('role_id', id)
      .eq('is_active', true);

    if (activeAssignments && activeAssignments > 0) {
      return NextResponse.json(
        { error: 'Cannot delete role with active user assignments' },
        { status: 400 }
      );
    }

    // Delete role (cascade will handle rolePermissions)
    const { error: deleteError } = await supabase
      .from('roles')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json(
      { error: 'Failed to delete role' },
      { status: 500 }
    );
  }
}