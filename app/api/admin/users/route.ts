import { NextRequest, NextResponse } from 'next/server';
import { requireAdminForAPI } from '@/lib/rbac';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    await requireAdminForAPI();
    const url = new URL(request.url)
    
    // Filter parameters
    const q = (url.searchParams.get('query') || '').trim()
    const tagIds = url.searchParams.get('tagIds')?.split(',').filter(Boolean) || []
    const hasRoles = url.searchParams.get('hasRoles') === 'true' ? true : url.searchParams.get('hasRoles') === 'false' ? false : undefined
    const dateFrom = url.searchParams.get('dateFrom')
    const dateTo = url.searchParams.get('dateTo')
    const sortBy = url.searchParams.get('sortBy') || 'createdAt'
    const sortOrder = url.searchParams.get('sortOrder') || 'desc'
    
    // Pagination
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'))
    const limitParam = Number(url.searchParams.get('limit') || '20')
    const take = Math.min(50, Math.max(1, isNaN(limitParam) ? 20 : limitParam))
    const skip = (page - 1) * take

    // Build where clause
    const where: any = {}

    // Search query
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' as const } },
        { email: { contains: q, mode: 'insensitive' as const } },
      ]
    }

    // Tag filters
    if (tagIds.length > 0) {
      where.userTags = {
        some: {
          tagId: { in: tagIds }
        }
      }
    }

    // Role filters
    if (hasRoles !== undefined) {
      where.userRoles = hasRoles 
        ? { some: { isActive: true } }
        : { none: { isActive: true } }
    }

    // Date filters
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo)
      }
    }

    // Build orderBy
    const orderBy: any = {}
    if (sortBy === 'name') {
      orderBy.name = sortOrder
    } else if (sortBy === 'email') {
      orderBy.email = sortOrder
    } else if (sortBy === 'createdAt') {
      orderBy.createdAt = sortOrder
    }

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          userTags: {
            include: {
              tag: true
            }
          },
          _count: {
            select: {
              userRoles: { where: { isActive: true } }
            }
          }
        },
        orderBy,
        skip,
        take,
      }),
      prisma.user.count({ where })
    ]);

    const totalPages = Math.ceil(totalCount / take)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({ 
      users,
      pagination: {
        page,
        limit: take,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}