import { NextRequest, NextResponse } from 'next/server';
import { requireAdminForAPI } from '@/lib/rbac';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const createRoleSchema = z.object({
  name: z.string().min(1).max(50).regex(/^[a-z-_]+$/, 'Name must contain only lowercase letters, hyphens, and underscores'),
  displayName: z.string().min(1).max(100),
  description: z.string().optional(),
  permissionIds: z.array(z.string().uuid()).optional()
});

export async function GET(request: NextRequest) {
  try {
    await requireAdminForAPI();

    const { data: roles, error } = await supabase
      .from('roles')
      .select(`
        *,
        role_permissions(count),
        user_roles!inner(count)
      `)
      .eq('user_roles.is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Transform the data to match the expected format
    const transformedRoles = roles?.map(role => ({
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
        userRoles: role.user_roles?.[0]?.count || 0,
        rolePermissions: role.role_permissions?.[0]?.count || 0
      }
    })) || [];

    return NextResponse.json(transformedRoles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminUser = await requireAdminForAPI();
    const body = await request.json();
    
    const validatedData = createRoleSchema.parse(body);
    
    // Check if role name already exists
    const { data: existingRole } = await supabase
      .from('roles')
      .select('id')
      .eq('name', validatedData.name)
      .single();
    
    if (existingRole) {
      return NextResponse.json(
        { error: 'Role with this name already exists' },
        { status: 400 }
      );
    }

    // Create role
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .insert({
        name: validatedData.name,
        display_name: validatedData.displayName,
        description: validatedData.description,
        is_system: false,
        is_active: true
      })
      .select()
      .single();

    if (roleError) {
      throw roleError;
    }

    // Add permissions if provided
    if (validatedData.permissionIds && validatedData.permissionIds.length > 0) {
      const rolePermissions = validatedData.permissionIds.map(permissionId => ({
        role_id: role.id,
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

    // Fetch the created role with counts
    const { data: createdRole, error: fetchError } = await supabase
      .from('roles')
      .select(`
        *,
        role_permissions(count),
        user_roles!inner(count)
      `)
      .eq('id', role.id)
      .eq('user_roles.is_active', true)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    const transformedRole = {
      id: createdRole.id,
      name: createdRole.name,
      displayName: createdRole.display_name,
      description: createdRole.description,
      isSystem: createdRole.is_system,
      isActive: createdRole.is_active,
      createdAt: createdRole.created_at,
      updatedAt: createdRole.updated_at,
      rolePermissions: createdRole.role_permissions || [],
      _count: {
        userRoles: createdRole.user_roles?.[0]?.count || 0,
        rolePermissions: createdRole.role_permissions?.[0]?.count || 0
      }
    };

    return NextResponse.json(transformedRole, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error creating role:', error);
    return NextResponse.json(
      { error: 'Failed to create role' },
      { status: 500 }
    );
  }
}