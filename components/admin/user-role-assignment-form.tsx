'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Users, Shield } from 'lucide-react';

const assignmentFormSchema = z.object({
  userId: z.string().min(1, 'User is required'),
  roleId: z.string().min(1, 'Role is required'),
  expiresAt: z.string().optional()
});

type AssignmentFormData = z.infer<typeof assignmentFormSchema>;

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface Role {
  id: string;
  name: string;
  displayName: string;
  isSystem: boolean;
  isActive: boolean;
}

interface UserRoleAssignmentFormProps {
  onSuccess: () => void;
}

export function UserRoleAssignmentForm({ onSuccess }: UserRoleAssignmentFormProps) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentFormSchema)
  });

  const watchedUserId = watch('userId');
  const watchedRoleId = watch('roleId');

  // Fetch users and roles
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersResponse, rolesResponse] = await Promise.all([
          fetch('/api/admin/users'),
          fetch('/api/admin/roles')
        ]);

        if (usersResponse.ok && rolesResponse.ok) {
          const [usersData, rolesData] = await Promise.all([
            usersResponse.json(),
            rolesResponse.json()
          ]);
          
          setUsers(usersData.users || usersData);
          setRoles(rolesData.filter((role: Role) => role.isActive));
        } else {
          toast.error('Failed to fetch users or roles');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to fetch data');
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, []);

  const onSubmit = async (data: AssignmentFormData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/user-roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: data.userId,
          roleId: data.roleId,
          expiresAt: data.expiresAt || undefined
        })
      });

      if (response.ok) {
        toast.success('Role assigned successfully');
        onSuccess();
        reset();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to assign role');
      }
    } catch (error) {
      console.error('Error assigning role:', error);
      toast.error('Failed to assign role');
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* User Selection */}
      <div className="space-y-2">
        <Label htmlFor="userId">User *</Label>
        <Select
          value={watchedUserId}
          onValueChange={(value) => setValue('userId', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a user" />
          </SelectTrigger>
          <SelectContent>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <div>
                    <div className="font-medium">
                      {user.name || 'No name'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {user.email}
                    </div>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.userId && (
          <p className="text-sm text-destructive">{errors.userId.message}</p>
        )}
      </div>

      {/* Role Selection */}
      <div className="space-y-2">
        <Label htmlFor="roleId">Role *</Label>
        <Select
          value={watchedRoleId}
          onValueChange={(value) => setValue('roleId', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            {roles.map((role) => (
              <SelectItem key={role.id} value={role.id}>
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <div>
                    <div className="font-medium">{role.displayName}</div>
                    <div className="text-sm text-muted-foreground">
                      {role.name}
                    </div>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.roleId && (
          <p className="text-sm text-destructive">{errors.roleId.message}</p>
        )}
      </div>

      {/* Expiration Date */}
      <div className="space-y-2">
        <Label htmlFor="expiresAt">Expiration Date (Optional)</Label>
        <Input
          id="expiresAt"
          type="datetime-local"
          {...register('expiresAt')}
        />
        {errors.expiresAt && (
          <p className="text-sm text-destructive">{errors.expiresAt.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Leave empty for permanent assignment
        </p>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Assign Role
        </Button>
      </div>
    </form>
  );
}
