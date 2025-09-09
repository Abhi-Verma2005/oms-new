import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function requireAdminForAPI() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  if (!session.user.isAdmin) {
    throw new Error('Forbidden: Admin access required');
  }

  return {
    ...session.user,
    id: session.user.id || 'unknown'
  };
}

export async function requireRoleForAPI(role: string) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  if (!session.user.roles?.includes(role)) {
    throw new Error(`Forbidden: ${role} role required`);
  }

  return session.user;
}

export async function requirePermissionForAPI(permission: string) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  // For now, we'll check if user is admin
  // In a full implementation, you'd check user permissions
  if (!session.user.isAdmin) {
    throw new Error(`Forbidden: ${permission} permission required`);
  }

  return session.user;
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
