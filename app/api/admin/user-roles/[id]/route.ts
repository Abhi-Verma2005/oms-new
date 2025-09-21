import { NextRequest, NextResponse } from 'next/server';
import { requireAdminForAPI } from '@/lib/rbac';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const updateUserRoleSchema = z.object({
  isActive: z.boolean().optional(),
  expiresAt: z.string().datetime().optional().nullable()
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminForAPI();
    const body = await request.json();
    const { id } = await params;
    
    const validatedData = updateUserRoleSchema.parse(body);
    
    // Check if user role assignment exists
    const existingAssignment = await prisma.userRole.findUnique({
      where: { id }
    });
    
    if (!existingAssignment) {
      return NextResponse.json(
        { error: 'User role assignment not found' },
        { status: 404 }
      );
    }

    // Update assignment
    const userRole = await prisma.userRole.update({
      where: { id },
      data: {
        isActive: validatedData.isActive,
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

    return NextResponse.json(userRole);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { error: 'Failed to update user role' },
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

    // Check if user role assignment exists
    const existingAssignment = await prisma.userRole.findUnique({
      where: { id }
    });
    
    if (!existingAssignment) {
      return NextResponse.json(
        { error: 'User role assignment not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting isActive to false
    await prisma.userRole.update({
      where: { id },
      data: { isActive: false }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing user role:', error);
    return NextResponse.json(
      { error: 'Failed to remove user role' },
      { status: 500 }
    );
  }
}