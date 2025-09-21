# Zustand Store Management

This directory contains all Zustand stores for centralized state management in the application.

## 🚀 Quick Start

### Import stores
```typescript
import { 
  useCartStore, 
  useNotificationStore, 
  useSearchStore, 
  useUIStore, 
  useAuthStore 
} from '@/stores'
```

### Basic usage
```typescript
// In your component
function MyComponent() {
  const { items, addItem, removeItem } = useCartStore()
  const { notifications, markAsRead } = useNotificationStore()
  const { isSearchOpen, openSearch, closeSearch } = useSearchStore()
  
  return (
    <div>
      <button onClick={() => addItem(site)}>Add to Cart</button>
      <span>{items.length} items</span>
    </div>
  )
}
```

## 📦 Available Stores

### 1. Cart Store (`useCartStore`)
Manages shopping cart state with persistence.

**Features:**
- Add/remove items (sites & products)
- Quantity management
- Cart modal state
- Price calculations
- Local storage persistence

**Usage:**
```typescript
const { 
  items, 
  isOpen, 
  addItem, 
  addProduct, 
  removeItem, 
  clearCart,
  getTotalItems,
  getTotalPrice 
} = useCartStore()
```

### 2. Notification Store (`useNotificationStore`)
Handles notifications and toast messages.

**Features:**
- Real-time notifications via WebSocket
- Toast management
- Read/unread states
- Notification types and priorities

**Usage:**
```typescript
const { 
  notifications, 
  unreadCount, 
  toasts,
  markAsRead, 
  markAllAsRead,
  addToast,
  removeToast 
} = useNotificationStore()
```

### 3. Search Store (`useSearchStore`)
Manages search functionality and recent searches.

**Features:**
- Search modal state
- Query and results management
- Recent searches/pages
- Search history persistence

**Usage:**
```typescript
const { 
  isSearchOpen, 
  query, 
  results, 
  recentSearches,
  openSearch, 
  closeSearch,
  addRecentSearch 
} = useSearchStore()
```

### 4. UI Store (`useUIStore`)
Centralized UI state management.

**Features:**
- Theme management
- Sidebar states
- Modal management
- Loading states
- Toast notifications
- Layout preferences

**Usage:**
```typescript
const { 
  theme, 
  sidebarOpen, 
  modals,
  loading,
  toasts,
  setTheme,
  toggleSidebar,
  openModal,
  addToast 
} = useUIStore()
```

### 5. Auth Store (`useAuthStore`)
Authentication and user state management.

**Features:**
- User session management
- MFA/Passkey states
- Role-based access
- User preferences
- Authentication status

**Usage:**
```typescript
const { 
  user, 
  isAuthenticated, 
  hasRole,
  isAdmin,
  setPreference 
} = useAuthStore()
```

## 🔄 Migration from Context

### Before (Context API)
```typescript
// Old way with Context
import { useCart } from '@/contexts/cart-context'

function Component() {
  const { state, addItem } = useCart()
  return <button onClick={() => addItem(site)}>Add</button>
}
```

### After (Zustand)
```typescript
// New way with Zustand
import { useCartStore } from '@/stores'

function Component() {
  const { addItem } = useCartStore()
  return <button onClick={() => addItem(site)}>Add</button>
}
```

## 🛠 Advanced Usage

### Selective subscriptions
```typescript
// Only subscribe to specific state
const items = useCartStore((state) => state.items)
const totalPrice = useCartStore((state) => state.getTotalPrice())

// Subscribe to multiple pieces
const { items, isOpen } = useCartStore((state) => ({
  items: state.items,
  isOpen: state.isOpen
}))
```

### Actions only (no re-renders)
```typescript
// Get actions without subscribing to state changes
const addItem = useCartStore.getState().addItem
const removeItem = useCartStore.getState().removeItem

// Use in event handlers
const handleAdd = () => addItem(site)
```

### Custom hooks for complex logic
```typescript
// Create custom hooks that combine multiple stores
function useCartSummary() {
  const items = useCartStore((state) => state.items)
  const totalItems = useCartStore((state) => state.getTotalItems())
  const totalPrice = useCartStore((state) => state.getTotalPrice())
  
  return { items, totalItems, totalPrice }
}
```

## 🎯 Best Practices

1. **Keep stores focused**: Each store should handle one domain
2. **Use selectors**: Subscribe only to the state you need
3. **Actions at the bottom**: Define actions after state for better readability
4. **Type safety**: Always define proper TypeScript interfaces
5. **Persistence**: Use `persist` middleware for data that should survive page reloads
6. **Immer**: Use immer middleware for complex state updates

## 🔧 Configuration

### Adding persistence
```typescript
persist(
  store,
  {
    name: 'storage-key',
    partialize: (state) => ({ items: state.items }) // Only persist specific fields
  }
)
```

### Adding immer
```typescript
immer((set, get) => ({
  // Your store implementation
}))
```

## 🚨 Troubleshooting

### Common issues:
1. **Hydration mismatch**: Ensure client/server state consistency
2. **Too many re-renders**: Use selective subscriptions
3. **Memory leaks**: Clean up subscriptions properly

### Debug mode:
```typescript
// Enable devtools in development
const useCartStore = create<CartStore>()(
  devtools(
    persist(
      immer(/* your store */),
      { name: 'cart-storage' }
    ),
    { name: 'CartStore' }
  )
)
```
