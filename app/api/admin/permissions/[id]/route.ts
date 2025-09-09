import { NextRequest, NextResponse } from 'next/server';
import { requireAdminForAPI } from '@/lib/rbac';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const updatePermissionSchema = z.object({
  name: z.string().min(1).max(100).regex(/^[a-z._-]+$/, 'Name must contain only lowercase letters, dots, hyphens, and underscores').optional(),
  displayName: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  resource: z.string().min(1).max(50).optional(),
  action: z.string().min(1).max(50).optional()
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminForAPI();
    const { id } = await params;

    const { data: permission, error } = await supabase
      .from('permissions')
      .select(`
        *,
        role_permissions(count)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Permission not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    const transformedPermission = {
      id: permission.id,
      name: permission.name,
      displayName: permission.display_name,
      description: permission.description,
      resource: permission.resource,
      action: permission.action,
      isSystem: permission.is_system,
      createdAt: permission.created_at,
      updatedAt: permission.updated_at,
      _count: {
        rolePermissions: permission.role_permissions?.[0]?.count || 0
      }
    };

    return NextResponse.json(transformedPermission);
  } catch (error) {
    console.error('Error fetching permission:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permission' },
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
    
    const validatedData = updatePermissionSchema.parse(body);
    
    // Check if permission exists
    const { data: existingPermission, error: fetchError } = await supabase
      .from('permissions')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Permission not found' },
          { status: 404 }
        );
      }
      throw fetchError;
    }

    // Check if permission is system permission
    if (existingPermission.is_system && validatedData.name && validatedData.name !== existingPermission.name) {
      return NextResponse.json(
        { error: 'Cannot modify system permission name' },
        { status: 400 }
      );
    }

    // Check if new name already exists (if name is being changed)
    if (validatedData.name && validatedData.name !== existingPermission.name) {
      const { data: nameExists } = await supabase
        .from('permissions')
        .select('id')
        .eq('name', validatedData.name)
        .single();
      
      if (nameExists) {
        return NextResponse.json(
          { error: 'Permission with this name already exists' },
          { status: 400 }
        );
      }
    }

    // Check if new resource-action combination already exists (if being changed)
    if ((validatedData.resource && validatedData.resource !== existingPermission.resource) ||
        (validatedData.action && validatedData.action !== existingPermission.action)) {
      const { data: resourceActionExists } = await supabase
        .from('permissions')
        .select('id')
        .eq('resource', validatedData.resource || existingPermission.resource)
        .eq('action', validatedData.action || existingPermission.action)
        .neq('id', id)
        .single();
      
      if (resourceActionExists) {
        return NextResponse.json(
          { error: 'Permission with this resource-action combination already exists' },
          { status: 400 }
        );
      }
    }

    // Update permission
    const { data: permission, error: updateError } = await supabase
      .from('permissions')
      .update({
        name: validatedData.name,
        display_name: validatedData.displayName,
        description: validatedData.description,
        resource: validatedData.resource,
        action: validatedData.action,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        role_permissions(count)
      `)
      .single();

    if (updateError) {
      throw updateError;
    }

    const transformedPermission = {
      id: permission.id,
      name: permission.name,
      displayName: permission.display_name,
      description: permission.description,
      resource: permission.resource,
      action: permission.action,
      isSystem: permission.is_system,
      createdAt: permission.created_at,
      updatedAt: permission.updated_at,
      _count: {
        rolePermissions: permission.role_permissions?.[0]?.count || 0
      }
    };

    return NextResponse.json(transformedPermission);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error updating permission:', error);
    return NextResponse.json(
      { error: 'Failed to update permission' },
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

    // Check if permission exists
    const { data: existingPermission, error: fetchError } = await supabase
      .from('permissions')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Permission not found' },
          { status: 404 }
        );
      }
      throw fetchError;
    }

    // Check if permission is system permission
    if (existingPermission.is_system) {
      return NextResponse.json(
        { error: 'Cannot delete system permission' },
        { status: 400 }
      );
    }

    // Check if permission has active role assignments
    const { count: activeAssignments } = await supabase
      .from('role_permissions')
      .select('*', { count: 'exact', head: true })
      .eq('permission_id', id);

    if (activeAssignments && activeAssignments > 0) {
      return NextResponse.json(
        { error: 'Cannot delete permission with active role assignments' },
        { status: 400 }
      );
    }

    // Delete permission
    const { error: deleteError } = await supabase
      .from('permissions')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting permission:', error);
    return NextResponse.json(
      { error: 'Failed to delete permission' },
      { status: 500 }
    );
  }
}