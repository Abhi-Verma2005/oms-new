'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Key,
  Shield
} from 'lucide-react';
import { PermissionForm } from './permission-form';
import { toast } from 'sonner';

interface Permission {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  resource: string;
  action: string;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    rolePermissions: number;
  };
}

export function PermissionsManagement() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);

  const fetchPermissions = useCallback(async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const handleDeletePermission = async (permissionId: string) => {
    if (!confirm('Are you sure you want to delete this permission?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/permissions/${permissionId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Permission deleted successfully');
        fetchPermissions();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete permission');
      }
    } catch (error) {
      console.error('Error deleting permission:', error);
      toast.error('Failed to delete permission');
    }
  };

  const handlePermissionCreated = useCallback(() => {
    setIsCreateDialogOpen(false);
    fetchPermissions();
  }, [fetchPermissions]);

  const handlePermissionUpdated = useCallback(() => {
    setEditingPermission(null);
    fetchPermissions();
  }, [fetchPermissions]);

  const handleCreateDialogOpenChange = useCallback((open: boolean) => {
    setIsCreateDialogOpen(open);
  }, []);

  const handleEditDialogOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setEditingPermission(null);
    }
  }, []);

  const filteredPermissions = useMemo(() => {
    if (!searchTerm.trim()) return permissions;
    
    const searchLower = searchTerm.toLowerCase();
    return permissions.filter(permission =>
      permission.name.toLowerCase().includes(searchLower) ||
      permission.displayName.toLowerCase().includes(searchLower) ||
      permission.resource.toLowerCase().includes(searchLower) ||
      permission.action.toLowerCase().includes(searchLower) ||
      (permission.description && permission.description.toLowerCase().includes(searchLower))
    );
  }, [permissions, searchTerm]);

  // Group permissions by resource for better organization
  const groupedPermissions = useMemo(() => {
    return filteredPermissions.reduce((acc, permission) => {
      if (!acc[permission.resource]) {
        acc[permission.resource] = [];
      }
      acc[permission.resource].push(permission);
      return acc;
    }, {} as Record<string, Permission[]>);
  }, [filteredPermissions]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Permission Management</h1>
            <p className="text-muted-foreground">
              Create and manage system permissions.
            </p>
          </div>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 w-32 bg-muted rounded mb-2"></div>
                <div className="h-3 w-48 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Permission Management</h1>
          <p className="text-muted-foreground">
            Create and manage system permissions.
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={handleCreateDialogOpenChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Permission
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Create New Permission</DialogTitle>
              <DialogDescription>
                Create a new permission for the system.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto">
              <PermissionForm onSuccess={handlePermissionCreated} />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search permissions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Permissions by Resource */}
      {Object.entries(groupedPermissions).map(([resource, resourcePermissions]) => (
        <Card key={resource}>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              {resource.charAt(0).toUpperCase() + resource.slice(1)} ({resourcePermissions.length})
            </CardTitle>
            <CardDescription>
              Permissions for {resource} resource
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resourcePermissions.map((permission) => (
                  <TableRow key={permission.id}>
                    <TableCell className="font-mono text-sm">{permission.name}</TableCell>
                    <TableCell>{permission.displayName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{permission.action}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {permission.description || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Key className="h-4 w-4 mr-1 text-muted-foreground" />
                        {permission._count.rolePermissions}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={permission.isSystem ? "destructive" : "outline"}>
                        {permission.isSystem ? "System" : "Custom"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setEditingPermission(permission)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {!permission.isSystem && (
                            <DropdownMenuItem
                              onClick={() => handleDeletePermission(permission.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}

      {/* Edit Permission Dialog */}
      <Dialog open={!!editingPermission} onOpenChange={handleEditDialogOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Edit Permission</DialogTitle>
            <DialogDescription>
              Update permission information.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            {editingPermission && (
              <PermissionForm 
                permission={editingPermission} 
                onSuccess={handlePermissionUpdated} 
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
