# Role-Based Search Filtering

This document explains how the search system now implements role-based access control (RBAC) to ensure users only see search results they have permission to access.

## Overview

The search system now filters results based on:
- **User roles** (admin, user, etc.)
- **Admin status** (isAdmin flag)
- **Required permissions** (specific role requirements)

## Implementation Details

### 1. Search Data Structure

Each search item can now specify access requirements:

```typescript
interface SearchItem {
  id: string
  title: string
  description?: string
  href: string
  category: string
  icon?: string
  keywords: string[]
  isActive?: boolean
  requiredRoles?: string[] // Roles required to see this item
  isAdminOnly?: boolean   // Shortcut for admin-only items
}
```

### 2. Admin-Only Items

All admin pages are marked with `isAdminOnly: true`:

```typescript
{
  id: 'admin-dashboard',
  title: 'Admin Dashboard',
  description: 'Administrative dashboard',
  href: '/admin',
  category: 'admin',
  icon: 'Shield',
  keywords: ['admin', 'administrative', 'management', 'control'],
  isAdminOnly: true  // Only visible to admins
}
```

### 3. Search Filtering Logic

The `searchItems` function now filters results based on user permissions:

```typescript
export function searchItems(query: string, userRoles: string[] = [], isAdmin: boolean = false): SearchItem[] {
  return searchData
    .filter(item => {
      // Filter by role-based access
      if (item.isAdminOnly && !isAdmin) return false
      if (item.requiredRoles && !item.requiredRoles.some(role => userRoles.includes(role))) return false
      
      // Filter by search query
      return item.title.toLowerCase().includes(lowercaseQuery) ||
        item.description?.toLowerCase().includes(lowercaseQuery) ||
        item.keywords.some(keyword => keyword.toLowerCase().includes(lowercaseQuery))
    })
    // ... sorting logic
}
```

## User Experience

### For Regular Users
- **Cannot see** admin-specific search results
- **Cannot access** admin pages through search
- **See only** content they have permission to access
- **Clean search results** without confusing admin options

### For Admin Users
- **Can see** all search results including admin pages
- **Full access** to all functionality
- **Admin-specific** search suggestions and shortcuts

## Testing the Implementation

### 1. Test as Regular User
1. Sign in as a non-admin user
2. Open search (⌘K / Ctrl+K)
3. Search for "admin" or "user management"
4. **Expected**: No admin results should appear

### 2. Test as Admin User
1. Sign in as an admin user
2. Open search (⌘K / Ctrl+K)
3. Search for "admin" or "user management"
4. **Expected**: Admin results should appear

### 3. Test API Endpoints
```bash
# As regular user
curl -H "Authorization: Bearer <token>" "/api/search?q=admin"

# As admin user
curl -H "Authorization: Bearer <admin-token>" "/api/search?q=admin"
```

## Security Benefits

1. **Data Privacy**: Users can't accidentally discover admin functionality
2. **Access Control**: Search respects existing permission system
3. **Clean UX**: No confusing or inaccessible results
4. **Consistent**: Search behavior matches navigation permissions

## Configuration

### Adding New Admin-Only Items
```typescript
{
  id: 'new-admin-feature',
  title: 'New Admin Feature',
  href: '/admin/new-feature',
  category: 'admin',
  isAdminOnly: true  // Only admins can see this
}
```

### Adding Role-Specific Items
```typescript
{
  id: 'moderator-only',
  title: 'Moderator Tools',
  href: '/moderator/tools',
  category: 'tools',
  requiredRoles: ['moderator', 'admin']  // Only moderators and admins
}
```

## Migration Notes

- **Existing search data** remains unchanged
- **New items** can use role-based filtering
- **Backward compatible** with existing search functionality
- **No breaking changes** to search API

## Future Enhancements

1. **Permission-based filtering** for more granular control
2. **Dynamic role loading** from user session
3. **Search analytics** to track role-based usage
4. **Custom search scopes** based on user context
