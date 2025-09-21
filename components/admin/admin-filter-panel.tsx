'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Filter,
  X,
  Calendar,
  User,
  Tag
} from 'lucide-react';

interface FilterConfig {
  search?: {
    placeholder?: string;
    enabled?: boolean;
  };
  category?: {
    label?: string;
    options: Array<{ value: string; label: string }>;
    enabled?: boolean;
  };
  status?: {
    label?: string;
    options: Array<{ value: string; label: string }>;
    enabled?: boolean;
  };
  paymentStatus?: {
    label?: string;
    options: Array<{ value: string; label: string }>;
    enabled?: boolean;
  };
  tags?: {
    enabled?: boolean;
  };
  userRoles?: {
    enabled?: boolean;
  };
  dateRange?: {
    enabled?: boolean;
  };
  sorting?: {
    enabled?: boolean;
    options: Array<{ value: string; label: string }>;
  };
}

interface AdminFilterPanelProps {
  filters: any;
  updateFilters?: (filters: any) => void;
  toggleTag?: (tagId: string) => void;
  config: FilterConfig;
  title?: string;
  // Legacy support for individual setters
  setSearch?: (value: string) => void;
  setStatus?: (value: string) => void;
  setPaymentStatus?: (value: string) => void;
  setSorting?: (sortBy: string, sortOrder: string) => void;
}

export function AdminFilterPanel({ 
  filters, 
  updateFilters, 
  toggleTag, 
  config,
  title = "Filters",
  setSearch,
  setStatus,
  setPaymentStatus,
  setSorting
}: AdminFilterPanelProps) {
  const [tags, setTags] = useState<any[]>([]);

  // Fetch tags if tag filtering is enabled
  useEffect(() => {
    if (config.tags?.enabled) {
      const fetchTags = async () => {
        try {
          const response = await fetch('/api/admin/tags');
          if (response.ok) {
            const data = await response.json();
            setTags(data.tags || data);
          } else {
            console.error('Failed to fetch tags:', response.status);
          }
        } catch (error) {
          console.error('Error fetching tags:', error);
        }
      };
      fetchTags();
    }
  }, [config.tags?.enabled]);

  const getSortOrderOptions = () => {
    if (filters.sortBy === 'user') {
      return [
        { value: 'asc', label: 'A-Z' },
        { value: 'desc', label: 'Z-A' }
      ];
    }
    return [
      { value: 'desc', label: 'Newest First' },
      { value: 'asc', label: 'Oldest First' }
    ];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Filter className="h-5 w-5 mr-2" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Primary Filters Row */}
        <div className="flex flex-col sm:flex-row gap-4">
          {config.search?.enabled !== false && (
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={config.search?.placeholder || "Search..."}
                value={filters.search || ''}
                onChange={(e) => {
                  if (setSearch) {
                    setSearch(e.target.value);
                  } else if (updateFilters) {
                    updateFilters({ search: e.target.value });
                  }
                }}
                className="pl-10"
              />
            </div>
          )}

          {config.category?.enabled !== false && config.category?.options && (
            <Select 
              value={filters.status || 'all'} 
              onValueChange={(value) => {
                if (setStatus) {
                  setStatus(value);
                } else if (updateFilters) {
                  updateFilters({ status: value === 'all' ? '' : value });
                }
              }}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder={config.category?.label || "All Categories"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {config.category.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {config.status?.enabled !== false && config.status?.options && (
            <Select 
              value={filters.status || 'all'} 
              onValueChange={(value) => {
                if (updateFilters) {
                  updateFilters({ status: value === 'all' ? '' : value });
                }
              }}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder={config.status?.label || "All Statuses"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {config.status.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {config.paymentStatus?.enabled !== false && config.paymentStatus?.options && (
            <Select 
              value={filters.paymentStatus || 'all'} 
              onValueChange={(value) => {
                if (setPaymentStatus) {
                  setPaymentStatus(value);
                } else if (updateFilters) {
                  updateFilters({ paymentStatus: value === 'all' ? '' : value });
                }
              }}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder={config.paymentStatus?.label || "All Payments"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                {config.paymentStatus.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Date Range Filter */}
        {config.dateRange?.enabled !== false && (
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                From Date
              </label>
              <Input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => {
                  if (updateFilters) {
                    updateFilters({ dateFrom: e.target.value });
                  }
                }}
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                To Date
              </label>
              <Input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => {
                  if (updateFilters) {
                    updateFilters({ dateTo: e.target.value });
                  }
                }}
              />
            </div>
          </div>
        )}

        {/* User Role Filter */}
        {config.userRoles?.enabled !== false && (
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 flex items-center">
                <User className="h-4 w-4 mr-1" />
                User Roles
              </label>
              <Select 
                value={filters.hasRoles || 'all'} 
                onValueChange={(value) => {
                  if (updateFilters) {
                    updateFilters({ hasRoles: value === 'all' ? '' : value });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="User Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="with_roles">Users with Roles</SelectItem>
                  <SelectItem value="without_roles">Users without Roles</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Tag Filter */}
        {config.tags?.enabled !== false && (
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center">
              <Tag className="h-4 w-4 mr-1" />
              Filter by User Tags:
            </label>
            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => {
                      if (toggleTag) {
                        toggleTag(tag.id);
                      }
                    }}
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
            ) : (
              <div className="text-sm text-muted-foreground">No tags available</div>
            )}
          </div>
        )}

        {/* Sort Options */}
        {config.sorting?.enabled !== false && config.sorting?.options && (
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Sort by</label>
              <Select 
                value={filters.sortBy || 'createdAt'} 
                onValueChange={(value) => {
                  if (updateFilters) {
                    updateFilters({ sortBy: value });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {config.sorting.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Order</label>
              <Select 
                value={filters.sortOrder || 'desc'} 
                onValueChange={(value) => {
                  if (updateFilters) {
                    updateFilters({ sortOrder: value });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Order" />
                </SelectTrigger>
                <SelectContent>
                  {getSortOrderOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
