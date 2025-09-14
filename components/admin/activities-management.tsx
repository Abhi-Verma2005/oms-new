'use client';

import { useAdminFilters } from '@/hooks/use-admin-filters';
import { AdminFilterPanel } from '@/components/admin/admin-filter-panel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Activity,
  User,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';

interface ActivityLog {
  id: string;
  action: string;
  user: string;
  userId: string;
  userTags: Array<{
    id: string;
    name: string;
    color: string;
    description?: string;
  }>;
  resource: string;
  resourceId: string | null;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  timestamp: string;
  createdAt: string;
}

export function ActivitiesManagement() {
  const {
    data: activities,
    loading,
    pagination,
    filters,
    updateFilters,
    toggleTag
  } = useAdminFilters('/api/admin/activities');

  const filterConfig = {
    search: {
      placeholder: "Search activities, users, or descriptions...",
      enabled: true
    },
    category: {
      label: "All Categories",
      options: [
        { value: 'AUTHENTICATION', label: 'Authentication' },
        { value: 'NAVIGATION', label: 'Navigation' },
        { value: 'ORDER', label: 'Order' },
        { value: 'PAYMENT', label: 'Payment' },
        { value: 'CART', label: 'Cart' },
        { value: 'WISHLIST', label: 'Wishlist' },
        { value: 'PROFILE', label: 'Profile' },
        { value: 'ADMIN', label: 'Admin' },
        { value: 'API', label: 'API' },
        { value: 'ERROR', label: 'Error' },
        { value: 'OTHER', label: 'Other' }
      ],
      enabled: true
    },
    tags: {
      enabled: true
    },
    userRoles: {
      enabled: true
    },
    dateRange: {
      enabled: true
    },
    sorting: {
      enabled: true,
      options: [
        { value: 'createdAt', label: 'Date' },
        { value: 'activity', label: 'Activity' },
        { value: 'category', label: 'Category' }
      ]
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Activities</h1>
            <p className="text-muted-foreground">
              Monitor and track user activities across the system.
            </p>
          </div>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
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
          <h1 className="text-3xl font-bold tracking-tight">User Activities</h1>
          <p className="text-muted-foreground">
            Monitor and track user activities across the system.
          </p>
        </div>
      </div>

      {/* Filters */}
      <AdminFilterPanel
        filters={filters}
        updateFilters={updateFilters}
        toggleTag={toggleTag}
        config={filterConfig}
        title="Filters"
      />

      {/* Activities Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Activity Log ({pagination?.total || 0})
          </CardTitle>
          <CardDescription>
            Recent user activities and system events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>User Tags</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((activity: ActivityLog) => (
                  <TableRow key={activity.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{activity.action}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{activity.user}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {activity.userTags && activity.userTags.length > 0 ? (
                          activity.userTags.map((tag) => (
                            <Badge
                              key={tag.id}
                              variant="outline"
                              className="text-xs"
                              style={{
                                backgroundColor: `${tag.color}20`,
                                borderColor: tag.color,
                                color: tag.color
                              }}
                            >
                              {tag.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">No tags</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{activity.resource}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {activity.details || '-'}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {activity.ipAddress || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1 text-sm">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span>
                          {new Date(activity.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-2 py-4">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} results
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateFilters({ page: 1 })}
                  disabled={pagination.page === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateFilters({ page: Math.max(1, pagination.page - 1) })}
                  disabled={pagination.page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateFilters({ page: Math.min(pagination.totalPages, pagination.page + 1) })}
                  disabled={pagination.page === pagination.totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateFilters({ page: pagination.totalPages })}
                  disabled={pagination.page === pagination.totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
