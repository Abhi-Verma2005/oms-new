'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, Key } from 'lucide-react';

const roleFormSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-z-_]+$/, 'Name must contain only lowercase letters, hyphens, and underscores'),
  displayName: z.string()
    .min(1, 'Display name is required')
    .max(100, 'Display name must be less than 100 characters'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  permissionIds: z.array(z.string()).default([])
});

type RoleFormData = z.infer<typeof roleFormSchema>;

interface Permission {
  id: string;
  name: string;
  displayName: string;
  resource: string;
  action: string;
  isSystem: boolean;
}

interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
  rolePermissions: Array<{
    permission: Permission;
  }>;
}

interface RoleFormProps {
  role?: Role;
  onSuccess: () => void;
}

export const RoleForm = React.memo(function RoleForm({ role, onSuccess }: RoleFormProps) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [permissionsLoading, setPermissionsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: role?.name || '',
      displayName: role?.displayName || '',
      description: role?.description || '',
      isActive: role?.isActive ?? true,
      permissionIds: role?.rolePermissions.map(rp => rp.permission.id) || []
    }
  });

  const selectedPermissions = watch('permissionIds');
  
  // Memoize selected permissions count to prevent unnecessary re-renders
  const selectedPermissionsCount = useMemo(() => {
    return selectedPermissions?.length || 0;
  }, [selectedPermissions]);

  // Fetch permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await fetch('/api/admin/permissions');
        if (response.ok) {
          const data = await response.json();
          setPermissions(data);
        } else {
          toast.error('Failed to fetch permissions');
        }
      } catch (error) {
        console.error('Error fetching permissions:', error);
        toast.error('Failed to fetch permissions');
      } finally {
        setPermissionsLoading(false);
      }
    };

    fetchPermissions();
  }, []);

  // Group permissions by resource - memoized to prevent recalculation on every render
  const groupedPermissions = useMemo(() => {
    return permissions.reduce((acc, permission) => {
      if (!acc[permission.resource]) {
        acc[permission.resource] = [];
      }
      acc[permission.resource].push(permission);
      return acc;
    }, {} as Record<string, Permission[]>);
  }, [permissions]);

  const onSubmit = useCallback(async (data: RoleFormData) => {
    setLoading(true);
    try {
      const url = role ? `/api/admin/roles/${role.id}` : '/api/admin/roles';
      const method = role ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        toast.success(role ? 'Role updated successfully' : 'Role created successfully');
        onSuccess();
        if (!role) {
          reset();
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save role');
      }
    } catch (error) {
      console.error('Error saving role:', error);
      toast.error('Failed to save role');
    } finally {
      setLoading(false);
    }
  }, [role, onSuccess, reset]);

  // Optimized permission toggle functions with useCallback
  const togglePermission = useCallback((permissionId: string) => {
    const current = selectedPermissions || [];
    const updated = current.includes(permissionId)
      ? current.filter(id => id !== permissionId)
      : [...current, permissionId];
    setValue('permissionIds', updated);
  }, [selectedPermissions, setValue]);

  const toggleAllPermissions = useCallback((resource: string) => {
    const resourcePermissions = groupedPermissions[resource] || [];
    const current = selectedPermissions || [];
    const resourcePermissionIds = resourcePermissions.map(p => p.id);
    
    const allSelected = resourcePermissionIds.every(id => current.includes(id));
    
    if (allSelected) {
      // Remove all permissions for this resource
      const updated = current.filter(id => !resourcePermissionIds.includes(id));
      setValue('permissionIds', updated);
    } else {
      // Add all permissions for this resource
      const updated = [...new Set([...current, ...resourcePermissionIds])];
      setValue('permissionIds', updated);
    }
  }, [groupedPermissions, selectedPermissions, setValue]);

  if (permissionsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="e.g., editor, moderator"
            disabled={role?.isSystem}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="displayName">Display Name *</Label>
          <Input
            id="displayName"
            {...register('displayName')}
            placeholder="e.g., Editor, Moderator"
          />
          {errors.displayName && (
            <p className="text-sm text-destructive">{errors.displayName.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Describe the role's purpose and responsibilities"
          rows={3}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="isActive"
          checked={watch('isActive')}
          onCheckedChange={(checked) => setValue('isActive', checked as boolean)}
        />
        <Label htmlFor="isActive">Active</Label>
      </div>

      <Separator />

      {/* Permissions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Permissions</h3>
            <p className="text-sm text-muted-foreground">
              Select the permissions for this role
            </p>
          </div>
          <Badge variant="outline">
            {selectedPermissionsCount} selected
          </Badge>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {Object.entries(groupedPermissions).map(([resource, resourcePermissions]) => {
            const allSelected = resourcePermissions.every(p => 
              selectedPermissions?.includes(p.id)
            );
            const someSelected = resourcePermissions.some(p => 
              selectedPermissions?.includes(p.id)
            );

            return (
              <PermissionResourceCard
                key={resource}
                resource={resource}
                resourcePermissions={resourcePermissions}
                allSelected={allSelected}
                someSelected={someSelected}
                selectedPermissions={selectedPermissions}
                onToggleAll={() => toggleAllPermissions(resource)}
                onTogglePermission={togglePermission}
              />
            );
          })}
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {role ? 'Update Role' : 'Create Role'}
        </Button>
      </div>
    </form>
  );
});

// Memoized component for permission resource cards to prevent unnecessary re-renders
const PermissionResourceCard = React.memo(({
  resource,
  resourcePermissions,
  allSelected,
  someSelected,
  selectedPermissions,
  onToggleAll,
  onTogglePermission
}: {
  resource: string;
  resourcePermissions: Permission[];
  allSelected: boolean;
  someSelected: boolean;
  selectedPermissions: string[] | undefined;
  onToggleAll: () => void;
  onTogglePermission: (permissionId: string) => void;
}) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm capitalize">
            {resource} ({resourcePermissions.length})
          </CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onToggleAll}
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid gap-2 md:grid-cols-2">
          {resourcePermissions.map((permission) => (
            <div key={permission.id} className="flex items-center space-x-2 py-1">
              <Checkbox
                id={permission.id}
                checked={selectedPermissions?.includes(permission.id) || false}
                onCheckedChange={() => onTogglePermission(permission.id)}
              />
              <Label 
                htmlFor={permission.id}
                className="flex-1 cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <Key className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs">{permission.displayName}</span>
                  {permission.isSystem && (
                    <Badge variant="secondary" className="text-xs px-1 py-0">
                      System
                    </Badge>
                  )}
                </div>
              </Label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

PermissionResourceCard.displayName = 'PermissionResourceCard';
