import { NextRequest, NextResponse } from 'next/server';
import { requireAdminForAPI } from '@/lib/rbac';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const updateRoleSchema = z.object({
  name: z.string().min(1).max(50).regex(/^[a-z-_]+$/, 'Name must contain only lowercase letters, hyphens, and underscores').optional(),
  displayName: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  permissionIds: z.array(z.string().cuid()).optional()
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminForAPI();
    const { id } = await params;

    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: {
            permission: true
          }
        },
        _count: {
          select: {
            userRoles: { where: { isActive: true } }
          }
        }
      }
    });

    if (!role) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(role);
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
    const body = await request.json();
    const { id } = await params;
    
    const validatedData = updateRoleSchema.parse(body);
    
    // Check if role exists
    const existingRole = await prisma.role.findUnique({
      where: { id }
    });
    
    if (!existingRole) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    // Check if role is system role
    if (existingRole.isSystem && validatedData.name && validatedData.name !== existingRole.name) {
      return NextResponse.json(
        { error: 'Cannot modify system role name' },
        { status: 400 }
      );
    }

    // Check if new name already exists (if name is being changed)
    if (validatedData.name && validatedData.name !== existingRole.name) {
      const nameExists = await prisma.role.findUnique({
        where: { name: validatedData.name }
      });
      
      if (nameExists) {
        return NextResponse.json(
          { error: 'Role with this name already exists' },
          { status: 400 }
        );
      }
    }

    // Update role
    const role = await prisma.role.update({
      where: { id },
      data: {
        name: validatedData.name,
        displayName: validatedData.displayName,
        description: validatedData.description,
        isActive: validatedData.isActive
      },
      include: {
        _count: {
          select: {
            userRoles: { where: { isActive: true } },
            rolePermissions: true
          }
        }
      }
    });

    // Update permissions if provided
    if (validatedData.permissionIds !== undefined) {
      // Remove existing permissions
      await prisma.rolePermission.deleteMany({
        where: { roleId: id }
      });

      // Add new permissions
      if (validatedData.permissionIds.length > 0) {
        await prisma.rolePermission.createMany({
          data: validatedData.permissionIds.map(permissionId => ({
            roleId: id,
            permissionId,
            grantedBy: adminUser.id
          }))
        });
      }
    }

    // Fetch updated role with permissions
    const updatedRole = await prisma.role.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            userRoles: { where: { isActive: true } },
            rolePermissions: true
          }
        }
      }
    });

    return NextResponse.json(updatedRole);
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
    const existingRole = await prisma.role.findUnique({
      where: { id }
    });
    
    if (!existingRole) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    // Check if role is system role
    if (existingRole.isSystem) {
      return NextResponse.json(
        { error: 'Cannot delete system role' },
        { status: 400 }
      );
    }

    // Check if role has active user assignments
    const activeAssignments = await prisma.userRole.count({
      where: { 
        roleId: id,
        isActive: true 
      }
    });

    if (activeAssignments > 0) {
      return NextResponse.json(
        { error: 'Cannot delete role with active user assignments' },
        { status: 400 }
      );
    }

    // Delete role (cascade will handle rolePermissions)
    await prisma.role.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json(
      { error: 'Failed to delete role' },
      { status: 500 }
    );
  }
}