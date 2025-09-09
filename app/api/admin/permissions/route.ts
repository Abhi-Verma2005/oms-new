import { NextRequest, NextResponse } from 'next/server';
import { requireAdminForAPI } from '@/lib/rbac';
import { prisma } from '@/lib/db';
import { z } from 'zod';

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

    const permissions = await prisma.permission.findMany({
      include: {
        _count: {
          select: {
            rolePermissions: true
          }
        }
      },
      orderBy: [
        { resource: 'asc' },
        { action: 'asc' }
      ]
    });

    return NextResponse.json(permissions);
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
    const existingPermission = await prisma.permission.findUnique({
      where: { name: validatedData.name }
    });
    
    if (existingPermission) {
      return NextResponse.json(
        { error: 'Permission with this name already exists' },
        { status: 400 }
      );
    }

    // Check if resource-action combination already exists
    const existingResourceAction = await prisma.permission.findUnique({
      where: {
        resource_action: {
          resource: validatedData.resource,
          action: validatedData.action
        }
      }
    });
    
    if (existingResourceAction) {
      return NextResponse.json(
        { error: 'Permission with this resource-action combination already exists' },
        { status: 400 }
      );
    }

    // Create permission
    const permission = await prisma.permission.create({
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

    return NextResponse.json(permission, { status: 201 });
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