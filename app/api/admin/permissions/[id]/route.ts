import { NextRequest, NextResponse } from 'next/server';
import { requireAdminForAPI } from '@/lib/rbac';
import { prisma } from '@/lib/db';
import { z } from 'zod';

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

    const permission = await prisma.permission.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            rolePermissions: true
          }
        }
      }
    });

    if (!permission) {
      return NextResponse.json(
        { error: 'Permission not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(permission);
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
    const body = await request.json();
    const { id } = await params;
    
    const validatedData = updatePermissionSchema.parse(body);
    
    // Check if permission exists
    const existingPermission = await prisma.permission.findUnique({
      where: { id }
    });
    
    if (!existingPermission) {
      return NextResponse.json(
        { error: 'Permission not found' },
        { status: 404 }
      );
    }

    // Check if permission is system permission
    if (existingPermission.isSystem && validatedData.name && validatedData.name !== existingPermission.name) {
      return NextResponse.json(
        { error: 'Cannot modify system permission name' },
        { status: 400 }
      );
    }

    // Check if new name already exists (if name is being changed)
    if (validatedData.name && validatedData.name !== existingPermission.name) {
      const nameExists = await prisma.permission.findUnique({
        where: { name: validatedData.name }
      });
      
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
      const resource = validatedData.resource || existingPermission.resource;
      const action = validatedData.action || existingPermission.action;
      
      const resourceActionExists = await prisma.permission.findUnique({
        where: {
          resource_action: {
            resource,
            action
          }
        }
      });
      
      if (resourceActionExists && resourceActionExists.id !== id) {
        return NextResponse.json(
          { error: 'Permission with this resource-action combination already exists' },
          { status: 400 }
        );
      }
    }

    // Update permission
    const permission = await prisma.permission.update({
      where: { id },
      data: {
        name: validatedData.name,
        displayName: validatedData.displayName,
        description: validatedData.description,
        resource: validatedData.resource,
        action: validatedData.action
      },
      include: {
        _count: {
          select: {
            rolePermissions: true
          }
        }
      }
    });

    return NextResponse.json(permission);
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
    const existingPermission = await prisma.permission.findUnique({
      where: { id }
    });
    
    if (!existingPermission) {
      return NextResponse.json(
        { error: 'Permission not found' },
        { status: 404 }
      );
    }

    // Check if permission is system permission
    if (existingPermission.isSystem) {
      return NextResponse.json(
        { error: 'Cannot delete system permission' },
        { status: 400 }
      );
    }

    // Check if permission has active role assignments
    const activeAssignments = await prisma.rolePermission.count({
      where: { permissionId: id }
    });

    if (activeAssignments > 0) {
      return NextResponse.json(
        { error: 'Cannot delete permission with active role assignments' },
        { status: 400 }
      );
    }

    // Delete permission
    await prisma.permission.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting permission:', error);
    return NextResponse.json(
      { error: 'Failed to delete permission' },
      { status: 500 }
    );
  }
}