export interface SearchItem {
  id: string
  title: string
  description?: string
  href: string
  category: 'page' | 'feature' | 'admin' | 'settings' | 'dashboard' | 'community' | 'finance' | 'analytics'
  icon?: string
  keywords: string[]
  isActive?: boolean
  requiredRoles?: string[] // Roles required to see this item
  isAdminOnly?: boolean // Shortcut for admin-only items
}

export const searchData: SearchItem[] = [
  // Dashboard Pages
  {
    id: 'dashboard-main',
    title: 'Dashboard',
    description: 'Main dashboard overview',
    href: '/dashboard',
    category: 'dashboard',
    icon: 'LayoutDashboard',
    keywords: ['dashboard', 'main', 'overview', 'home']
  },
  {
    id: 'dashboard-analytics',
    title: 'Analytics',
    description: 'Analytics and reporting dashboard',
    href: '/dashboard/analytics',
    category: 'analytics',
    icon: 'BarChart3',
    keywords: ['analytics', 'reports', 'charts', 'data', 'metrics']
  },
  {
    id: 'dashboard-fintech',
    title: 'Fintech Dashboard',
    description: 'Financial technology dashboard',
    href: '/dashboard/fintech',
    category: 'finance',
    icon: 'CreditCard',
    keywords: ['fintech', 'finance', 'financial', 'payments', 'transactions']
  },

  // Publishers
  {
    id: 'publishers',
    title: 'Publishers',
    description: 'Manage publishers and content creators',
    href: '/publishers',
    category: 'page',
    icon: 'Users',
    keywords: ['publishers', 'creators', 'content', 'users', 'manage']
  },

  // Community
  {
    id: 'community-feed',
    title: 'Community Feed',
    description: 'Community discussions and posts',
    href: '/community/feed',
    category: 'community',
    icon: 'MessageSquare',
    keywords: ['community', 'feed', 'discussions', 'posts', 'social']
  },
  {
    id: 'community-forum',
    title: 'Community Forum',
    description: 'Community forum and Q&A',
    href: '/community/forum',
    category: 'community',
    icon: 'MessageCircle',
    keywords: ['forum', 'community', 'qa', 'questions', 'answers']
  },

  // Settings
  {
    id: 'settings-account',
    title: 'My Account',
    description: 'Account settings and profile',
    href: '/settings/account',
    category: 'settings',
    icon: 'User',
    keywords: ['account', 'profile', 'settings', 'personal', 'user']
  },
  {
    id: 'settings-notifications',
    title: 'My Notifications',
    description: 'Notification preferences and settings',
    href: '/settings/notifications',
    category: 'settings',
    icon: 'Bell',
    keywords: ['notifications', 'alerts', 'settings', 'preferences']
  },
  {
    id: 'settings-apps',
    title: 'Connected Apps',
    description: 'Manage connected applications',
    href: '/settings/apps',
    category: 'settings',
    icon: 'AppWindow',
    keywords: ['apps', 'connected', 'integrations', 'settings']
  },
  {
    id: 'settings-plans',
    title: 'Plans',
    description: 'Subscription plans and billing',
    href: '/settings/plans',
    category: 'settings',
    icon: 'CreditCard',
    keywords: ['plans', 'billing', 'subscription', 'pricing']
  },

  // Admin Pages
  {
    id: 'admin-dashboard',
    title: 'Admin Dashboard',
    description: 'Administrative dashboard',
    href: '/admin',
    category: 'admin',
    icon: 'Shield',
    keywords: ['admin', 'administrative', 'management', 'control'],
    isAdminOnly: true
  },
  {
    id: 'admin-users',
    title: 'User Management',
    description: 'Manage users and permissions',
    href: '/admin/users',
    category: 'admin',
    icon: 'Users',
    keywords: ['users', 'management', 'admin', 'permissions', 'roles'],
    isAdminOnly: true
  },
  {
    id: 'admin-roles',
    title: 'Role Management',
    description: 'Manage user roles and access levels',
    href: '/admin/roles',
    category: 'admin',
    icon: 'Shield',
    keywords: ['roles', 'permissions', 'admin', 'access', 'management'],
    isAdminOnly: true
  },
  {
    id: 'admin-permissions',
    title: 'Permission Management',
    description: 'Configure system permissions',
    href: '/admin/permissions',
    category: 'admin',
    icon: 'Key',
    keywords: ['permissions', 'access', 'admin', 'security', 'rights'],
    isAdminOnly: true
  },
  {
    id: 'admin-ai-chatbot',
    title: 'AI Chatbot Configuration',
    description: 'Configure AI chatbot settings and navigation',
    href: '/admin/ai-chatbot',
    category: 'admin',
    icon: 'Bot',
    keywords: ['ai', 'chatbot', 'bot', 'configuration', 'admin', 'assistant'],
    isAdminOnly: true
  },

  // Features
  {
    id: 'ai-chatbot',
    title: 'AI Assistant',
    description: 'AI-powered chatbot and assistant',
    href: '#',
    category: 'feature',
    icon: 'Bot',
    keywords: ['ai', 'assistant', 'chatbot', 'help', 'support', 'bot']
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'View and manage notifications',
    href: '#',
    category: 'feature',
    icon: 'Bell',
    keywords: ['notifications', 'alerts', 'messages', 'updates']
  },
  {
    id: 'theme-toggle',
    title: 'Theme Toggle',
    description: 'Switch between light and dark themes',
    href: '#',
    category: 'feature',
    icon: 'Sun',
    keywords: ['theme', 'dark', 'light', 'appearance', 'toggle']
  },

  // Finance & Analytics
  {
    id: 'finance-transactions',
    title: 'Transactions',
    description: 'View financial transactions',
    href: '/finance/transactions',
    category: 'finance',
    icon: 'Receipt',
    keywords: ['transactions', 'finance', 'payments', 'money', 'billing']
  },
  {
    id: 'analytics-reports',
    title: 'Reports',
    description: 'Generate and view analytics reports',
    href: '/analytics/reports',
    category: 'analytics',
    icon: 'FileText',
    keywords: ['reports', 'analytics', 'data', 'insights', 'metrics']
  }
]

export const searchCategories = {
  dashboard: { label: 'Dashboard', icon: 'LayoutDashboard' },
  analytics: { label: 'Analytics', icon: 'BarChart3' },
  finance: { label: 'Finance', icon: 'CreditCard' },
  community: { label: 'Community', icon: 'MessageSquare' },
  settings: { label: 'Settings', icon: 'Settings' },
  admin: { label: 'Admin', icon: 'Shield' },
  page: { label: 'Pages', icon: 'File' },
  feature: { label: 'Features', icon: 'Star' }
}

export function searchItems(query: string, userRoles: string[] = [], isAdmin: boolean = false): SearchItem[] {
  if (!query.trim()) return []
  
  const lowercaseQuery = query.toLowerCase()
  
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
    .sort((a, b) => {
      // Prioritize exact title matches
      const aTitleMatch = a.title.toLowerCase().startsWith(lowercaseQuery)
      const bTitleMatch = b.title.toLowerCase().startsWith(lowercaseQuery)
      
      if (aTitleMatch && !bTitleMatch) return -1
      if (!aTitleMatch && bTitleMatch) return 1
      
      // Then prioritize by category importance
      const categoryOrder = ['dashboard', 'page', 'feature', 'admin', 'settings', 'community', 'finance', 'analytics']
      const aCategoryIndex = categoryOrder.indexOf(a.category)
      const bCategoryIndex = categoryOrder.indexOf(b.category)
      
      return aCategoryIndex - bCategoryIndex
    })
}
