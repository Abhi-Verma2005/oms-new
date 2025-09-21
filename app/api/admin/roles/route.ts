import { NextRequest, NextResponse } from 'next/server';
import { requireAdminForAPI } from '@/lib/rbac';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const createRoleSchema = z.object({
  name: z.string().min(1).max(50).regex(/^[a-z-_]+$/, 'Name must contain only lowercase letters, hyphens, and underscores'),
  displayName: z.string().min(1).max(100),
  description: z.string().optional(),
  permissionIds: z.array(z.string().cuid()).optional()
});

export async function GET(request: NextRequest) {
  try {
    await requireAdminForAPI();

    const roles = await prisma.role.findMany({
      include: {
        _count: {
          select: {
            userRoles: { where: { isActive: true } },
            rolePermissions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(roles);
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
    const existingRole = await prisma.role.findUnique({
      where: { name: validatedData.name }
    });
    
    if (existingRole) {
      return NextResponse.json(
        { error: 'Role with this name already exists' },
        { status: 400 }
      );
    }

    // Create role with permissions
    const role = await prisma.role.create({
      data: {
        name: validatedData.name,
        displayName: validatedData.displayName,
        description: validatedData.description,
        rolePermissions: validatedData.permissionIds ? {
          create: validatedData.permissionIds.map(permissionId => ({
            permissionId,
            grantedBy: adminUser.id
          }))
        } : undefined
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

    return NextResponse.json(role, { status: 201 });
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