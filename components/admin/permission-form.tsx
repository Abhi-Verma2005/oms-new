'use client';

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const permissionFormSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-z._-]+$/, 'Name must contain only lowercase letters, dots, hyphens, and underscores'),
  displayName: z.string()
    .min(1, 'Display name is required')
    .max(100, 'Display name must be less than 100 characters'),
  description: z.string().optional(),
  resource: z.string()
    .min(1, 'Resource is required')
    .max(50, 'Resource must be less than 50 characters'),
  action: z.string()
    .min(1, 'Action is required')
    .max(50, 'Action must be less than 50 characters')
});

type PermissionFormData = z.infer<typeof permissionFormSchema>;

interface Permission {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  resource: string;
  action: string;
  isSystem: boolean;
}

interface PermissionFormProps {
  permission?: Permission;
  onSuccess: () => void;
}

const commonResources = [
  'admin',
  'user',
  'content',
  'moderation',
  'settings',
  'dashboard',
  'profile',
  'auth'
];

const commonActions = [
  'view',
  'create',
  'read',
  'update',
  'delete',
  'manage',
  'moderate',
  'settings'
];

export function PermissionForm({ permission, onSuccess }: PermissionFormProps) {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<PermissionFormData>({
    resolver: zodResolver(permissionFormSchema),
    defaultValues: {
      name: permission?.name || '',
      displayName: permission?.displayName || '',
      description: permission?.description || '',
      resource: permission?.resource || '',
      action: permission?.action || ''
    }
  });

  const watchedResource = watch('resource');
  const watchedAction = watch('action');

  // Auto-generate name when resource and action change
  const generateName = (resource: string, action: string) => {
    if (resource && action) {
      return `${resource}.${action}`;
    }
    return '';
  };

  // Use useCallback to prevent infinite re-renders
  const handleResourceChange = useCallback((value: string) => {
    setValue('resource', value);
    // Auto-generate name
    const newName = generateName(value, watchedAction);
    if (newName) {
      setValue('name', newName);
    }
  }, [setValue, watchedAction]);

  const handleActionChange = useCallback((value: string) => {
    setValue('action', value);
    // Auto-generate name
    const newName = generateName(watchedResource, value);
    if (newName) {
      setValue('name', newName);
    }
  }, [setValue, watchedResource]);

  const onSubmit = async (data: PermissionFormData) => {
    if (loading) return; // Prevent double submission
    
    setLoading(true);
    try {
      const url = permission ? `/api/admin/permissions/${permission.id}` : '/api/admin/permissions';
      const method = permission ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        toast.success(permission ? 'Permission updated successfully' : 'Permission created successfully');
        onSuccess();
        if (!permission) {
          reset();
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save permission');
      }
    } catch (error) {
      console.error('Error saving permission:', error);
      toast.error('Failed to save permission');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="resource">Resource *</Label>
          <Select
            value={watchedResource}
            onValueChange={handleResourceChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select resource" />
            </SelectTrigger>
            <SelectContent>
              {commonResources.map((resource) => (
                <SelectItem key={resource} value={resource}>
                  {resource.charAt(0).toUpperCase() + resource.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.resource && (
            <p className="text-sm text-destructive">{errors.resource.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="action">Action *</Label>
          <Select
            value={watchedAction}
            onValueChange={handleActionChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select action" />
            </SelectTrigger>
            <SelectContent>
              {commonActions.map((action) => (
                <SelectItem key={action} value={action}>
                  {action.charAt(0).toUpperCase() + action.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.action && (
            <p className="text-sm text-destructive">{errors.action.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="e.g., admin.dashboard.view"
          disabled={permission?.isSystem}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Auto-generated from resource and action, or enter custom name
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="displayName">Display Name *</Label>
        <Input
          id="displayName"
          {...register('displayName')}
          placeholder="e.g., View Admin Dashboard"
        />
        {errors.displayName && (
          <p className="text-sm text-destructive">{errors.displayName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Describe what this permission allows"
          rows={3}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {permission ? 'Update Permission' : 'Create Permission'}
        </Button>
      </div>
    </form>
  );
}
