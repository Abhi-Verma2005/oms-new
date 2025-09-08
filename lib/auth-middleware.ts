import { prisma } from './db';
import { auth } from './auth';

export interface UserWithRoles {
  id: string;
  name: string | null;
  email: string;
  userRoles: Array<{
    id: string;
    isActive: boolean;
    role: {
      id: string;
      name: string;
      displayName: string;
      isActive: boolean;
      rolePermissions: Array<{
        permission: {
          id: string;
          name: string;
          displayName: string;
          resource: string;
          action: string;
        };
      }>;
    };
  }>;
}

export async function requireAdminRole(userId: string): Promise<UserWithRoles> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true
                }
              }
            }
          }
        },
        where: { isActive: true }
      }
    }
  });

  if (!user) {
    throw new Error('User not found');
  }

  const hasAdminRole = user.userRoles.some(ur => 
    ur.role.name === 'admin' && ur.role.isActive
  );

  if (!hasAdminRole) {
    throw new Error('Access denied: Admin role required');
  }
  
  return user as UserWithRoles;
}

export async function hasPermission(userId: string, permissionName: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        where: { isActive: true },
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!user || !user.userRoles) return false;

  const hasAdminRole = user.userRoles.some((ur: any) => 
    ur.role.name === 'admin' && ur.role.isActive
  );

  if (hasAdminRole) return true;

  const hasPerm = user.userRoles.some((ur: any) =>
    ur.role.rolePermissions.some((rp: any) =>
      rp.permission.name === permissionName
    )
  );

  return hasPerm;
}

export async function getUserPermissions(userId: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        where: { isActive: true },
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!user || !user.userRoles) return [];

  const hasAdminRole = user.userRoles.some((ur: any) => 
    ur.role.name === 'admin' && ur.role.isActive
  );

  if (hasAdminRole) {
    const allPermissions = await prisma.permission.findMany({
      select: { name: true }
    });
    return allPermissions.map(p => p.name);
  }

  const permissions = new Set<string>();
  user.userRoles.forEach((ur: any) => {
    ur.role.rolePermissions.forEach((rp: any) => {
      permissions.add(rp.permission.name);
    });
  });

  return Array.from(permissions);
}

export async function getUserWithRoles(userId: string): Promise<UserWithRoles | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true
                }
              }
            }
          }
        },
        where: { isActive: true }
      }
    }
  });

  return user as UserWithRoles | null;
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const session = await auth();
    return (session as any)?.user?.isAdmin || false;
  } catch {
    return false;
  }
}

export async function requireAdminForAPI(): Promise<UserWithRoles> {
  const session = await auth();
  
  if (!(session as any)?.user?.id) {
    throw new Error('Authentication required');
  }

  if (!(session as any).user.isAdmin) {
    throw new Error('Access denied: Admin role required');
  }

  return await getUserWithRoles((session as any).user.id) as UserWithRoles;
}

export async function getRolesWithCounts() {
  return await prisma.role.findMany({
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
}

export async function getPermissionsWithCounts() {
  return await prisma.permission.findMany({
    include: {
      _count: {
        select: {
          rolePermissions: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getUsersWithRoles() {
  return await prisma.user.findMany({
    include: {
      userRoles: {
        where: { isActive: true },
        include: {
          role: true
        }
      },
      _count: {
        select: {
          userRoles: { where: { isActive: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}


