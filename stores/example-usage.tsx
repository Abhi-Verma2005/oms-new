'use client'

import React from 'react'
import { 
  useCartStore, 
  useNotificationStore, 
  useSearchStore, 
  useUIStore, 
  useAuthStore 
} from './index'

// Example component showing how to use all Zustand stores
export function ZustandExampleUsage() {
  // Cart store usage
  const {
    items: cartItems,
    isOpen: cartOpen,
    addItem,
    removeItem,
    clearCart,
    getTotalItems,
    getTotalPrice,
    toggleCart
  } = useCartStore()

  // Notification store usage
  const {
    notifications,
    unreadCount,
    toasts,
    markAsRead,
    addToast,
    removeToast
  } = useNotificationStore()

  // Search store usage
  const {
    isSearchOpen,
    query,
    results,
    recentSearches,
    openSearch,
    closeSearch,
    setQuery
  } = useSearchStore()

  // UI store usage
  const {
    theme,
    sidebarOpen,
    modals,
    loading,
    toasts: uiToasts,
    setTheme,
    toggleSidebar,
    openModal,
    addToast: addUIToast
  } = useUIStore()

  // Auth store usage
  const {
    user,
    isAuthenticated,
    hasRole,
    isAdmin,
    setPreference
  } = useAuthStore()

  // Example actions
  const handleAddToCart = () => {
    // Example: Add a site to cart
    const exampleSite = {
      id: 'example-site',
      url: 'https://example.com',
      name: 'Example Site',
      niche: 'Technology',
      category: 'Tech',
      language: 'English',
      country: 'US',
      da: 50,
      pa: 40,
      dr: 45,
      spamScore: 2,
      toolScores: {
        semrushAuthority: 1000,
        semrushOverallTraffic: 5000,
        semrushOrganicTraffic: 4500,
        trafficTrend: 'stable' as const,
        targetCountryTraffic: [{ country: 'US', percent: 80 }],
        topCountries: [{ country: 'US', percent: 80 }]
      },
      publishing: {
        price: 99,
        priceWithContent: 149,
        wordLimit: 1000,
        tatDays: 7,
        backlinkNature: 'do-follow' as const,
        backlinksAllowed: 1,
        linkPlacement: 'in-content' as const,
        permanence: 'lifetime' as const
      },
      quality: {
        sampleUrl: 'https://example.com/sample',
        remark: 'High quality site',
        lastPublished: '2024-01-15',
        outboundLinkLimit: 2,
        guidelinesUrl: 'https://example.com/guidelines'
      },
      additional: {
        availability: true,
        disclaimer: 'Standard terms apply'
      }
    }
    addItem(exampleSite)
  }

  const handleShowNotification = () => {
    addUIToast({
      type: 'success',
      title: 'Success!',
      description: 'This is a Zustand-managed toast',
      duration: 3000
    })
  }

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery)
    // Your search logic here
  }

  const handleThemeToggle = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Zustand Store Examples</h1>

      {/* Cart Section */}
      <section className="border p-4 rounded">
        <h2 className="text-xl font-semibold mb-4">Cart Store</h2>
        <div className="space-y-2">
          <p>Items in cart: {cartItems.length}</p>
          <p>Total items: {getTotalItems()}</p>
          <p>Total price: ${getTotalPrice()}</p>
          <p>Cart open: {cartOpen ? 'Yes' : 'No'}</p>
          <div className="flex gap-2">
            <button 
              onClick={handleAddToCart}
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Add Example Item
            </button>
            <button 
              onClick={toggleCart}
              className="px-4 py-2 bg-green-500 text-white rounded"
            >
              Toggle Cart
            </button>
            <button 
              onClick={clearCart}
              className="px-4 py-2 bg-red-500 text-white rounded"
            >
              Clear Cart
            </button>
          </div>
        </div>
      </section>

      {/* Notifications Section */}
      <section className="border p-4 rounded">
        <h2 className="text-xl font-semibold mb-4">Notification Store</h2>
        <div className="space-y-2">
          <p>Notifications: {notifications.length}</p>
          <p>Unread: {unreadCount}</p>
          <p>Toasts: {toasts.length}</p>
          <button 
            onClick={handleShowNotification}
            className="px-4 py-2 bg-purple-500 text-white rounded"
          >
            Show Toast
          </button>
        </div>
      </section>

      {/* Search Section */}
      <section className="border p-4 rounded">
        <h2 className="text-xl font-semibold mb-4">Search Store</h2>
        <div className="space-y-2">
          <p>Search open: {isSearchOpen ? 'Yes' : 'No'}</p>
          <p>Query: {query}</p>
          <p>Results: {results.length}</p>
          <p>Recent searches: {recentSearches.length}</p>
          <div className="flex gap-2">
            <button 
              onClick={openSearch}
              className="px-4 py-2 bg-indigo-500 text-white rounded"
            >
              Open Search
            </button>
            <button 
              onClick={closeSearch}
              className="px-4 py-2 bg-gray-500 text-white rounded"
            >
              Close Search
            </button>
          </div>
        </div>
      </section>

      {/* UI Section */}
      <section className="border p-4 rounded">
        <h2 className="text-xl font-semibold mb-4">UI Store</h2>
        <div className="space-y-2">
          <p>Theme: {theme}</p>
          <p>Sidebar open: {sidebarOpen ? 'Yes' : 'No'}</p>
          <p>Loading states: {Object.keys(loading).length}</p>
          <p>UI Toasts: {uiToasts.length}</p>
          <div className="flex gap-2">
            <button 
              onClick={handleThemeToggle}
              className="px-4 py-2 bg-yellow-500 text-white rounded"
            >
              Toggle Theme
            </button>
            <button 
              onClick={toggleSidebar}
              className="px-4 py-2 bg-orange-500 text-white rounded"
            >
              Toggle Sidebar
            </button>
          </div>
        </div>
      </section>

      {/* Auth Section */}
      <section className="border p-4 rounded">
        <h2 className="text-xl font-semibold mb-4">Auth Store</h2>
        <div className="space-y-2">
          <p>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
          <p>User: {user?.name || 'None'}</p>
          <p>Is Admin: {isAdmin() ? 'Yes' : 'No'}</p>
          <p>Has 'user' role: {hasRole('user') ? 'Yes' : 'No'}</p>
        </div>
      </section>

      {/* Selective Subscription Example */}
      <SelectiveSubscriptionExample />
    </div>
  )
}

// Example of selective subscriptions to avoid unnecessary re-renders
function SelectiveSubscriptionExample() {
  // Only subscribe to cart items count - won't re-render when other cart state changes
  const itemCount = useCartStore((state) => state.items.length)
  
  // Only subscribe to theme - won't re-render when other UI state changes
  const theme = useUIStore((state) => state.theme)
  
  // Get actions without subscribing to state (no re-renders)
  const addItem = useCartStore.getState().addItem
  const setTheme = useUIStore.getState().setTheme

  return (
    <section className="border p-4 rounded">
      <h2 className="text-xl font-semibold mb-4">Selective Subscription Example</h2>
      <div className="space-y-2">
        <p>Cart items: {itemCount} (selective subscription)</p>
        <p>Theme: {theme} (selective subscription)</p>
        <p>This component only re-renders when itemCount or theme changes!</p>
        <button 
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="px-4 py-2 bg-teal-500 text-white rounded"
        >
          Change Theme (No Re-render)
        </button>
      </div>
    </section>
  )
}

// Custom hook example
function useCartSummary() {
  const items = useCartStore((state) => state.items)
  const totalItems = useCartStore((state) => state.getTotalItems())
  const totalPrice = useCartStore((state) => state.getTotalPrice())
  
  return { items, totalItems, totalPrice }
}

// Usage of custom hook
function CartSummaryComponent() {
  const { items, totalItems, totalPrice } = useCartSummary()
  
  return (
    <div>
      <h3>Cart Summary</h3>
      <p>Items: {totalItems}</p>
      <p>Total: ${totalPrice}</p>
    </div>
  )
}
