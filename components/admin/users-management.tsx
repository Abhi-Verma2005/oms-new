'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Search, 
  UserCheck, 
  Users,
  Mail,
  Calendar,
  BarChart
} from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
  _count: {
    userRoles: number;
  };
}

export function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        toast.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return email[0].toUpperCase();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">
              View and manage user accounts.
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            View and manage user accounts.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Users ({filteredUsers.length})
          </CardTitle>
          <CardDescription>
            All registered users in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"><span className="sr-only">Select</span></TableHead>
                  <TableHead className="w-[40px]"><span className="sr-only">Favourite</span></TableHead>
                  <TableHead className="text-xs sm:text-sm">User</TableHead>
                  <TableHead className="text-xs sm:text-sm">Email</TableHead>
                  <TableHead className="text-xs sm:text-sm">Roles</TableHead>
                  <TableHead className="text-xs sm:text-sm">Joined</TableHead>
                  <TableHead className="w-[70px]"><span className="sr-only">Menu</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="group">
                    <TableCell className="w-px">
                      <div className="flex items-center">
                        <label className="inline-flex">
                          <span className="sr-only">Select</span>
                          <input className="form-checkbox" type="checkbox" />
                        </label>
                      </div>
                    </TableCell>
                    <TableCell className="w-px">
                      <div className="flex items-center relative">
                        <button>
                          <svg className={`shrink-0 fill-current text-gray-300`} width="16" height="16" viewBox="0 0 16 16">
                            <path d="M8 0L6 5.934H0l4.89 3.954L2.968 16 8 12.223 13.032 16 11.11 9.888 16 5.934h-6L8 0z" />
                          </svg>
                        </button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="w-10 h-10 shrink-0 mr-2 sm:mr-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src="" />
                            <AvatarFallback>
                              {getInitials(user.name, user.email)}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">{user.name || 'No name'}</div>
                          <div className="text-xs text-muted-foreground">ID: {user.id.slice(0, 8)}...</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-left flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm truncate">{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="outline" className="text-xs">
                          {user._count.userRoles} role{user._count.userRoles !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{new Date(user.createdAt).toLocaleDateString()}</span>
                      </div>
                    </TableCell>
                    <TableCell className="w-px">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-8 h-8 fill-current" viewBox="0 0 32 32">
                            <circle cx="16" cy="16" r="2" />
                            <circle cx="10" cy="16" r="2" />
                            <circle cx="22" cy="16" r="2" />
                          </svg>
                          <span className="sr-only">Actions</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/users/${user.id}/search-interests`}>View Search Interests</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/users/${user.id}/feedback`}>View Feedback</Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
