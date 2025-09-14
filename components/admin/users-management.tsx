'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  BarChart,
  Filter,
  Tag as TagIcon,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Trash2,
  Edit
} from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useAdminFilters } from '@/hooks/use-admin-filters';

interface Tag {
  id: string
  name: string
  color: string
  description?: string
}

interface UserTag {
  id: string
  tag: Tag
  assignedAt: string
  notes?: string
}

interface User {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
  userTags: UserTag[]
  _count: {
    userRoles: number;
  };
}

interface Pagination {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export function UsersManagement() {
  const [tags, setTags] = useState<Tag[]>([]);
  
  // Use standardized filtering
  const {
    data: users,
    loading,
    pagination,
    filters,
    updateFilters,
    handlePageChange,
    resetFilters,
    toggleTag,
    setSearch,
    setHasRoles,
    setDateRange,
    setSorting
  } = useAdminFilters('/api/admin/users', {
    searchPlaceholder: 'Search users, names, or emails...',
    hasRolesOptions: [
      { value: 'all', label: 'All Users' },
      { value: 'true', label: 'With Roles' },
      { value: 'false', label: 'Without Roles' }
    ],
    sortOptions: [
      { value: 'createdAt-desc', label: 'Newest First' },
      { value: 'createdAt-asc', label: 'Oldest First' },
      { value: 'name-asc', label: 'Name A-Z' },
      { value: 'name-desc', label: 'Name Z-A' },
      { value: 'email-asc', label: 'Email A-Z' },
      { value: 'email-desc', label: 'Email Z-A' }
    ],
    enableDateRange: true,
    enableTags: true,
    enableRoles: true,
    defaultSort: 'createdAt-desc',
    defaultLimit: 20
  });
  
  // Modal states
  const [isBulkTagOpen, setIsBulkTagOpen] = useState(false);
  const [isIndividualTagOpen, setIsIndividualTagOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedBulkTagId, setSelectedBulkTagId] = useState('');
  const [bulkTagNotes, setBulkTagNotes] = useState('');
  const [individualTagId, setIndividualTagId] = useState('');
  const [individualTagNotes, setIndividualTagNotes] = useState('');
  const [bulkTagSearch, setBulkTagSearch] = useState('');
  const [individualTagSearch, setIndividualTagSearch] = useState('');


  const fetchTags = async () => {
    try {
      const response = await fetch('/api/admin/tags');
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched tags:', data.tags); // Debug log
        setTags(data.tags || []);
      } else {
        console.error('Failed to fetch tags:', response.status);
        toast.error('Failed to fetch tags');
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
      toast.error('Failed to fetch tags');
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return email[0].toUpperCase();
  };

  const handleBulkTagAssignment = async () => {
    if (!selectedBulkTagId) {
      toast.error('Please select a tag');
      return;
    }

    try {
      const response = await fetch('/api/admin/users/bulk-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tagId: selectedBulkTagId,
          filters: {
            query: filters.search,
            tagIds: filters.tagIds,
            hasRoles: filters.hasRoles === 'all' ? undefined : filters.hasRoles === 'true',
            dateFrom: filters.dateFrom,
            dateTo: filters.dateTo
          },
          notes: bulkTagNotes
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to assign tags');
      }

      const result = await response.json();
      toast.success(result.message);
      setIsBulkTagOpen(false);
      setSelectedBulkTagId('');
      setBulkTagNotes('');
      setBulkTagSearch('');
      // Refresh data
      updateFilters({}, true);
    } catch (error: any) {
      console.error('Error assigning bulk tags:', error);
      toast.error(error.message || 'Failed to assign tags');
    }
  };

  const handleIndividualTagAssignment = async () => {
    if (!selectedUser || !individualTagId) {
      toast.error('Please select a tag');
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tagId: individualTagId,
          notes: individualTagNotes
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to assign tag');
      }

      toast.success('Tag assigned successfully');
      setIsIndividualTagOpen(false);
      setSelectedUser(null);
      setIndividualTagId('');
      setIndividualTagNotes('');
      setIndividualTagSearch('');
      // Refresh data
      updateFilters({}, true);
    } catch (error: any) {
      console.error('Error assigning tag:', error);
      toast.error(error.message || 'Failed to assign tag');
    }
  };

  const handleRemoveUserTag = async (userId: string, tagId: string) => {
    if (!confirm('Are you sure you want to remove this tag from the user?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}/tags/${tagId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove tag');
      }

      toast.success('Tag removed successfully');
      // Refresh data
      updateFilters({}, true);
    } catch (error: any) {
      console.error('Error removing tag:', error);
      toast.error(error.message || 'Failed to remove tag');
    }
  };

  const openIndividualTagModal = (user: User) => {
    setSelectedUser(user);
    setIsIndividualTagOpen(true);
  };

  const getFilteredTagsForBulk = () => {
    return tags.filter(tag => 
      tag.name.toLowerCase().includes(bulkTagSearch.toLowerCase()) ||
      tag.description?.toLowerCase().includes(bulkTagSearch.toLowerCase())
    );
  };

  const getFilteredTagsForIndividual = () => {
    return tags.filter(tag => {
      const matchesSearch = tag.name.toLowerCase().includes(individualTagSearch.toLowerCase()) ||
                           tag.description?.toLowerCase().includes(individualTagSearch.toLowerCase());
      const notAlreadyAssigned = !selectedUser?.userTags.some(ut => ut.tag.id === tag.id);
      return matchesSearch && notAlreadyAssigned;
    });
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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">User Management</h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage user accounts with comprehensive filtering and tag assignment.
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
        <CardHeader className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
          <CardTitle className="flex items-center font-semibold text-gray-800 dark:text-gray-100">
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          {/* Search and Quick Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search users, names, or emails..."
                  value={filters.search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filters.hasRoles} onValueChange={setHasRoles}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="true">With Roles</SelectItem>
                <SelectItem value="false">Without Roles</SelectItem>
              </SelectContent>
            </Select>
            <Select value={`${filters.sortBy}-${filters.sortOrder}`} onValueChange={(value) => {
              const [sortBy, sortOrder] = value.split('-');
              setSorting(sortBy, sortOrder);
            }}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt-desc">Newest First</SelectItem>
                <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                <SelectItem value="name-asc">Name A-Z</SelectItem>
                <SelectItem value="name-desc">Name Z-A</SelectItem>
                <SelectItem value="email-asc">Email A-Z</SelectItem>
                <SelectItem value="email-desc">Email Z-A</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={() => setIsBulkTagOpen(true)} 
              className="bg-violet-600 hover:bg-violet-700"
              disabled={users.length === 0}
            >
              <TagIcon className="w-4 h-4 mr-2" />
              Assign Tag to All
            </Button>
          </div>

          {/* Date Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dateFrom">From Date</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setDateRange(e.target.value, filters.dateTo)}
              />
            </div>
            <div>
              <Label htmlFor="dateTo">To Date</Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={(e) => setDateRange(filters.dateFrom, e.target.value)}
              />
            </div>
          </div>

          {/* Tag Filters */}
          {tags.length > 0 && (
            <div className="space-y-2">
              <Label>Filter by Tags:</Label>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm border transition-colors ${
                      filters.tagIds.includes(tag.id)
                        ? 'bg-violet-100 border-violet-300 text-violet-800 dark:bg-violet-900/20 dark:border-violet-700 dark:text-violet-300'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 dark:bg-gray-900/20 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800/20'
                    }`}
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span>{tag.name}</span>
                    {filters.tagIds.includes(tag.id) && (
                      <X className="w-3 h-3" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
        <CardHeader className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
          <CardTitle className="flex items-center justify-between font-semibold text-gray-800 dark:text-gray-100">
            <div className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Users ({pagination?.totalCount || 0})
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="group">
                    <TableCell>
                      <div className="flex items-center">
                        <div className="w-10 h-10 shrink-0 mr-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src="" />
                            <AvatarFallback>
                              {getInitials(user.name, user.email)}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">{user.name || 'No name'}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">ID: {user.id.slice(0, 8)}...</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <UserCheck className="h-4 w-4 text-gray-400" />
                        <Badge variant="outline" className="text-xs">
                          {user._count.userRoles} role{user._count.userRoles !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.userTags.map((userTag) => (
                          <div
                            key={userTag.id}
                            className="inline-flex items-center space-x-1 px-2 py-1 rounded text-xs"
                            style={{ 
                              backgroundColor: `${userTag.tag.color}20`,
                              color: userTag.tag.color,
                              border: `1px solid ${userTag.tag.color}40`
                            }}
                          >
                            <span>{userTag.tag.name}</span>
                            <button
                              onClick={() => handleRemoveUserTag(user.id, userTag.tag.id)}
                              className="hover:bg-black/10 rounded-full p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        {user.userTags.length === 0 && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">No tags</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{new Date(user.createdAt).toLocaleDateString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="w-5 h-5" />
                          <span className="sr-only">Actions</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                          <DropdownMenuItem 
                            onClick={() => openIndividualTagModal(user)}
                            className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <TagIcon className="w-4 h-4 mr-2" />
                            Assign Tag
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link 
                              href={`/admin/users/${user.id}/search-interests`}
                              className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              View Search Interests
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link 
                              href={`/admin/users/${user.id}/feedback`}
                              className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              View Feedback
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of {pagination.totalCount} users
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrevPage}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNextPage}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Tag Assignment Modal */}
      <Dialog open={isBulkTagOpen} onOpenChange={setIsBulkTagOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Tag to All Filtered Users</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="bulkTagSelect">Select Tag</Label>
              <div className="space-y-2">
                <Input
                  placeholder="Search tags..."
                  value={bulkTagSearch}
                  onChange={(e) => setBulkTagSearch(e.target.value)}
                  className="w-full"
                />
                <Select value={selectedBulkTagId} onValueChange={setSelectedBulkTagId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a tag" />
                  </SelectTrigger>
                  <SelectContent>
                    {tags.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-gray-500 dark:text-gray-400">
                        No tags available. Create some tags first in the Tags section.
                      </div>
                    ) : getFilteredTagsForBulk().length > 0 ? (
                      getFilteredTagsForBulk().map(tag => (
                        <SelectItem key={tag.id} value={tag.id}>
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: tag.color }}
                            />
                            <span>{tag.name}</span>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-gray-500 dark:text-gray-400">
                        No tags found matching "{bulkTagSearch}"
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="bulkTagNotes">Notes (Optional)</Label>
              <Textarea
                id="bulkTagNotes"
                value={bulkTagNotes}
                onChange={(e) => setBulkTagNotes(e.target.value)}
                placeholder="Add notes about this tag assignment..."
                rows={3}
              />
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              This will assign the selected tag to all {pagination?.totalCount || 0} users matching your current filters.
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => {
                setIsBulkTagOpen(false);
                setBulkTagSearch('');
                setSelectedBulkTagId('');
                setBulkTagNotes('');
              }}>
                Cancel
              </Button>
              <Button onClick={handleBulkTagAssignment} className="bg-violet-600 hover:bg-violet-700">
                Assign Tag
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Individual Tag Assignment Modal */}
      <Dialog open={isIndividualTagOpen} onOpenChange={setIsIndividualTagOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Tag to {selectedUser?.name || selectedUser?.email}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="individualTagSelect">Select Tag</Label>
              <div className="space-y-2">
                <Input
                  placeholder="Search tags..."
                  value={individualTagSearch}
                  onChange={(e) => setIndividualTagSearch(e.target.value)}
                  className="w-full"
                />
                <Select value={individualTagId} onValueChange={setIndividualTagId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a tag" />
                  </SelectTrigger>
                  <SelectContent>
                    {tags.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-gray-500 dark:text-gray-400">
                        No tags available. Create some tags first in the Tags section.
                      </div>
                    ) : getFilteredTagsForIndividual().length > 0 ? (
                      getFilteredTagsForIndividual().map(tag => (
                        <SelectItem key={tag.id} value={tag.id}>
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: tag.color }}
                            />
                            <span>{tag.name}</span>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-gray-500 dark:text-gray-400">
                        {individualTagSearch ? `No tags found matching "${individualTagSearch}"` : 'No available tags to assign'}
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="individualTagNotes">Notes (Optional)</Label>
              <Textarea
                id="individualTagNotes"
                value={individualTagNotes}
                onChange={(e) => setIndividualTagNotes(e.target.value)}
                placeholder="Add notes about this tag assignment..."
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => {
                setIsIndividualTagOpen(false);
                setIndividualTagSearch('');
                setIndividualTagId('');
                setIndividualTagNotes('');
                setSelectedUser(null);
              }}>
                Cancel
              </Button>
              <Button onClick={handleIndividualTagAssignment} className="bg-violet-600 hover:bg-violet-700">
                Assign Tag
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
