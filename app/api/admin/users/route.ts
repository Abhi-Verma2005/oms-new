import { NextRequest, NextResponse } from 'next/server';
import { requireAdminForAPI } from '@/lib/rbac';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    await requireAdminForAPI();
    const url = new URL(request.url)
    const q = (url.searchParams.get('query') || '').trim()
    const limitParam = Number(url.searchParams.get('limit') || '20')
    const take = Math.min(50, Math.max(1, isNaN(limitParam) ? 20 : limitParam))

    const where = q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' as const } },
            { email: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : undefined

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        _count: {
          select: {
            userRoles: { where: { isActive: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take,
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}