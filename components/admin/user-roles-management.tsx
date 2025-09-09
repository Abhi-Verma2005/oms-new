'use client';

import { useEffect, useState } from 'react';
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
  UserCheck,
  Users,
  Shield,
  Calendar
} from 'lucide-react';
import { UserRoleAssignmentForm } from '@/components/admin/user-role-assignment-form';
import { toast } from 'sonner';

interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  assignedBy: string | null;
  assignedAt: string;
  expiresAt: string | null;
  isActive: boolean;
  role: {
    id: string;
    name: string;
    displayName: string;
    isSystem: boolean;
  };
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

export function UserRolesManagement() {
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

  const fetchUserRoles = async () => {
    try {
      const response = await fetch('/api/admin/user-roles');
      if (response.ok) {
        const data = await response.json();
        setUserRoles(data);
      } else {
        toast.error('Failed to fetch user roles');
      }
    } catch (error) {
      console.error('Error fetching user roles:', error);
      toast.error('Failed to fetch user roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserRoles();
  }, []);

  const handleRemoveRole = async (userRoleId: string) => {
    if (!confirm('Are you sure you want to remove this role assignment?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/user-roles/${userRoleId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Role assignment removed successfully');
        fetchUserRoles();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to remove role assignment');
      }
    } catch (error) {
      console.error('Error removing role assignment:', error);
      toast.error('Failed to remove role assignment');
    }
  };

  const handleToggleActive = async (userRoleId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/user-roles/${userRoleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !isActive })
      });

      if (response.ok) {
        toast.success(`Role assignment ${!isActive ? 'activated' : 'deactivated'} successfully`);
        fetchUserRoles();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update role assignment');
      }
    } catch (error) {
      console.error('Error updating role assignment:', error);
      toast.error('Failed to update role assignment');
    }
  };

  const handleRoleAssigned = () => {
    setIsAssignDialogOpen(false);
    fetchUserRoles();
  };

  const filteredUserRoles = userRoles.filter(userRole =>
    userRole.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    userRole.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    userRole.role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    userRole.role.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Role Assignments</h1>
            <p className="text-muted-foreground">
              Manage user-role assignments and permissions.
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
          <h1 className="text-3xl font-bold tracking-tight">User Role Assignments</h1>
          <p className="text-muted-foreground">
            Manage user-role assignments and permissions.
          </p>
        </div>
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Assign Role
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Assign Role to User</DialogTitle>
              <DialogDescription>
                Assign a role to a user with optional expiration date.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto">
              <UserRoleAssignmentForm onSuccess={handleRoleAssigned} />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users or roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* User Roles Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserCheck className="h-5 w-5 mr-2" />
            Role Assignments ({filteredUserRoles.length})
          </CardTitle>
          <CardDescription>
            Active and inactive user-role assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUserRoles.map((userRole) => (
                <TableRow key={userRole.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {userRole.user.name || 'No name'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {userRole.user.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{userRole.role.displayName}</div>
                        <div className="text-sm text-muted-foreground">
                          {userRole.role.name}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(userRole.assignedAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    {userRole.expiresAt ? (
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                        {new Date(userRole.expiresAt).toLocaleDateString()}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Never</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={userRole.isActive ? "default" : "secondary"}>
                      {userRole.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="hover:bg-accent hover:text-accent-foreground">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleToggleActive(userRole.id, userRole.isActive)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          {userRole.isActive ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleRemoveRole(userRole.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
