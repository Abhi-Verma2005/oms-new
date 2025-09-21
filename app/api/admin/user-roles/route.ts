import { NextRequest, NextResponse } from 'next/server';
import { requireAdminForAPI } from '@/lib/rbac';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const assignRoleSchema = z.object({
  userId: z.string().cuid(),
  roleId: z.string().cuid(),
  expiresAt: z.string().datetime().optional()
});

export async function GET(request: NextRequest) {
  try {
    await requireAdminForAPI();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (userId) {
      // Get roles for specific user
      const userRoles = await prisma.userRole.findMany({
        where: { userId },
        include: {
          role: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { assignedAt: 'desc' }
      });

      return NextResponse.json(userRoles);
    } else {
      // Get all user-role assignments
      const userRoles = await prisma.userRole.findMany({
        include: {
          role: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { assignedAt: 'desc' }
      });

      return NextResponse.json(userRoles);
    }
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
    const existingAssignment = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId: validatedData.userId,
          roleId: validatedData.roleId
        }
      }
    });
    
    if (existingAssignment) {
      if (existingAssignment.isActive) {
        return NextResponse.json(
          { error: 'User already has this role assigned' },
          { status: 400 }
        );
      } else {
        // Reactivate existing assignment
        const updatedAssignment = await prisma.userRole.update({
          where: {
            userId_roleId: {
              userId: validatedData.userId,
              roleId: validatedData.roleId
            }
          },
          data: {
            isActive: true,
            assignedBy: adminUser.id,
            assignedAt: new Date(),
            expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : null
          },
          include: {
            role: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        });

        return NextResponse.json(updatedAssignment, { status: 201 });
      }
    }

    // Create new assignment
    const userRole = await prisma.userRole.create({
      data: {
        userId: validatedData.userId,
        roleId: validatedData.roleId,
        assignedBy: adminUser.id,
        expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : null
      },
      include: {
        role: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(userRole, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
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
