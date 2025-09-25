// Centralized store exports
export { useCartStore } from './cart-store'
export { useNotificationStore } from './notification-store'
export { useSearchStore } from './search-store'
export { useUIStore } from './ui-store'
export { useAuthStore } from './auth-store'
export { useUserContextStore } from './user-context-store'

// Re-export types for convenience
export type { CartItem, CartProductItemData } from './cart-store'
export type { NotificationData } from './notification-store'
export type { UserContextData, CompanyInfo, ProfessionalContext, Preferences, AIInsights, ContextUpdate } from './user-context-store'
