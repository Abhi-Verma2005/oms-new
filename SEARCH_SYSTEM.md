# Comprehensive Search System

This document describes the comprehensive search system implemented in the Mosaic Next.js application.

## Overview

The search system provides a powerful, user-friendly way to navigate and find content throughout the application. It includes:

- **Real-time search** with instant results
- **Keyboard shortcuts** (⌘K / Ctrl+K)
- **Search history** and recent pages
- **Categorized results** with icons
- **Keyboard navigation** (arrow keys, enter, escape)
- **API endpoints** for dynamic content search
- **Responsive design** that works on all devices

## Components

### 1. Search Modal (`components/search-modal.tsx`)

The main search interface that appears when users trigger search.

**Features:**
- Real-time search as you type
- Categorized results with icons
- Recent searches and pages
- Quick access shortcuts
- Keyboard navigation
- Responsive design

**Usage:**
```tsx
import SearchModal from '@/components/search-modal'

<SearchModal isOpen={isOpen} setIsOpen={setIsOpen} />
```

### 2. Search Data (`lib/search-data.ts`)

Centralized search data structure containing all searchable items.

**Features:**
- Comprehensive list of all app routes and pages
- Categorized items (dashboard, admin, settings, etc.)
- Keywords for better search matching
- Icons for visual identification
- Search algorithm with relevance scoring

**Adding new searchable items:**
```typescript
{
  id: 'unique-id',
  title: 'Page Title',
  description: 'Page description',
  href: '/page-route',
  category: 'dashboard' | 'admin' | 'settings' | 'page' | 'feature',
  icon: 'IconName',
  keywords: ['keyword1', 'keyword2'],
  isActive: true
}
```

### 3. Search API (`app/api/search/route.ts`)

RESTful API endpoints for search functionality.

**Endpoints:**
- `GET /api/search?q=query&category=category&limit=20` - Search with filters
- `POST /api/search` - Advanced search with filters in body

**Example usage:**
```typescript
// GET request
const response = await fetch('/api/search?q=dashboard&category=admin&limit=10')
const data = await response.json()

// POST request
const response = await fetch('/api/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'dashboard',
    filters: { category: 'admin', isActive: true }
  })
})
```

### 4. Search Hooks (`hooks/use-search.ts`)

Custom React hooks for search functionality.

**Hooks:**
- `useSearch(options)` - Main search hook with debouncing
- `useRecentSearches()` - Recent searches management
- `useRecentPages()` - Recent pages management

**Example usage:**
```tsx
import { useSearch } from '@/hooks/use-search'

function MyComponent() {
  const { query, setQuery, results, isLoading } = useSearch({
    debounceMs: 300,
    minQueryLength: 2,
    maxResults: 20
  })
  
  return (
    <div>
      <input 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
      />
      {isLoading && <div>Loading...</div>}
      {results.map(item => (
        <div key={item.id}>{item.title}</div>
      ))}
    </div>
  )
}
```

### 5. Search Context (`contexts/search-context.tsx`)

React context for global search state management.

**Features:**
- Global search state
- Navigation helpers
- Recent searches/pages management
- Search modal control

**Usage:**
```tsx
import { SearchProvider, useSearchContext } from '@/contexts/search-context'

// Wrap your app
<SearchProvider>
  <App />
</SearchProvider>

// Use in components
function MyComponent() {
  const { openSearch, isSearchOpen, results } = useSearchContext()
  
  return (
    <button onClick={openSearch}>
      Search ({results.length} results)
    </button>
  )
}
```

## Keyboard Shortcuts

- **⌘K / Ctrl+K** - Open search modal
- **↑ / ↓** - Navigate through results
- **Enter** - Select highlighted result
- **Escape** - Close search modal
- **Tab** - Focus next element

## Styling

The search system uses Tailwind CSS classes and follows the Mosaic design system:

- **Dark mode support** with proper color schemes
- **Hover states** and transitions
- **Focus indicators** for accessibility
- **Responsive design** for mobile and desktop
- **Consistent spacing** and typography

## Customization

### Adding New Categories

1. Update `searchCategories` in `lib/search-data.ts`
2. Add new category items to `searchData` array
3. Update icon mapping in `components/search-modal.tsx`

### Custom Search Logic

1. Modify `searchItems` function in `lib/search-data.ts`
2. Add custom scoring algorithms
3. Implement fuzzy search if needed

### Styling Customization

1. Update Tailwind classes in `components/search-modal.tsx`
2. Modify color schemes for different themes
3. Adjust spacing and typography as needed

## Performance

- **Debounced search** prevents excessive API calls
- **Local storage** for recent searches/pages
- **Efficient filtering** with early returns
- **Memoized components** to prevent unnecessary re-renders
- **Lazy loading** for large result sets

## Accessibility

- **ARIA labels** and roles
- **Keyboard navigation** support
- **Screen reader** compatibility
- **Focus management** for modal
- **High contrast** support

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Keyboard navigation support
- Touch gesture support

## Future Enhancements

- **Fuzzy search** for better matching
- **Search analytics** and tracking
- **Personalized results** based on user behavior
- **Search suggestions** and autocomplete
- **Voice search** integration
- **Search filters** and advanced options
- **Search result caching** for better performance
