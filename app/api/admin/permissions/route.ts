import { NextRequest, NextResponse } from 'next/server';
import { requireAdminForAPI } from '@/lib/rbac';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const createPermissionSchema = z.object({
  name: z.string().min(1).max(100).regex(/^[a-z._-]+$/, 'Name must contain only lowercase letters, dots, hyphens, and underscores'),
  displayName: z.string().min(1).max(100),
  description: z.string().optional(),
  resource: z.string().min(1).max(50),
  action: z.string().min(1).max(50)
});

export async function GET(request: NextRequest) {
  try {
    await requireAdminForAPI();

    const { data: permissions, error } = await supabase
      .from('permissions')
      .select(`
        *,
        role_permissions(count)
      `)
      .order('resource', { ascending: true })
      .order('action', { ascending: true });

    if (error) {
      throw error;
    }

    // Transform the data to match the expected format
    const transformedPermissions = permissions?.map(permission => ({
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
    })) || [];

    return NextResponse.json(transformedPermissions);
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permissions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminForAPI();
    const body = await request.json();
    
    const validatedData = createPermissionSchema.parse(body);
    
    // Check if permission name already exists
    const { data: existingPermission } = await supabase
      .from('permissions')
      .select('id')
      .eq('name', validatedData.name)
      .single();
    
    if (existingPermission) {
      return NextResponse.json(
        { error: 'Permission with this name already exists' },
        { status: 400 }
      );
    }

    // Check if resource-action combination already exists
    const { data: existingResourceAction } = await supabase
      .from('permissions')
      .select('id')
      .eq('resource', validatedData.resource)
      .eq('action', validatedData.action)
      .single();
    
    if (existingResourceAction) {
      return NextResponse.json(
        { error: 'Permission with this resource-action combination already exists' },
        { status: 400 }
      );
    }

    // Create permission
    const { data: permission, error: permissionError } = await supabase
      .from('permissions')
      .insert({
        name: validatedData.name,
        display_name: validatedData.displayName,
        description: validatedData.description,
        resource: validatedData.resource,
        action: validatedData.action,
        is_system: false
      })
      .select(`
        *,
        role_permissions(count)
      `)
      .single();

    if (permissionError) {
      throw permissionError;
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

    return NextResponse.json(transformedPermission, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error creating permission:', error);
    return NextResponse.json(
      { error: 'Failed to create permission' },
      { status: 500 }
    );
  }
}