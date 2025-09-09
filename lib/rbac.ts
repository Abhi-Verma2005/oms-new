import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

interface SessionUser extends Record<string, any> {
  id?: string;
  isAdmin?: boolean;
  roles?: string[];
}

export async function requireAdminForAPI() {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const user = session.user as SessionUser;

  if (!user.isAdmin) {
    throw new Error('Forbidden: Admin access required');
  }

  return {
    ...user,
    id: user.id || 'unknown'
  };
}

export async function requireRoleForAPI(role: string) {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const user = session.user as SessionUser;

  if (!user.roles?.includes(role)) {
    throw new Error(`Forbidden: ${role} role required`);
  }

  return user;
}

export async function requirePermissionForAPI(permission: string) {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const user = session.user as SessionUser;

  // For now, we'll check if user is admin
  // In a full implementation, you'd check user permissions
  if (!user.isAdmin) {
    throw new Error(`Forbidden: ${permission} permission required`);
  }

  return user;
}

export function hasRole(userRoles: string[] | undefined, role: string): boolean {
  return userRoles?.includes(role) || false;
}

export function hasPermission(userPermissions: string[] | undefined, permission: string): boolean {
  return userPermissions?.includes(permission) || false;
}

export function hasAnyRole(userRoles: string[] | undefined, roles: string[]): boolean {
  return roles.some(role => userRoles?.includes(role)) || false;
}

export function hasAllRoles(userRoles: string[] | undefined, roles: string[]): boolean {
  return roles.every(role => userRoles?.includes(role)) || false;
}

export function hasAnyPermission(userPermissions: string[] | undefined, permissions: string[]): boolean {
  return permissions.some(permission => userPermissions?.includes(permission)) || false;
}

export function hasAllPermissions(userPermissions: string[] | undefined, permissions: string[]): boolean {
  return permissions.every(permission => userPermissions?.includes(permission)) || false;
}
