import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

interface User {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  roles?: string[]
  isAdmin?: boolean
}

interface AuthState {
  user: User | null
  isLoading: boolean
  error: string | null
  session: any | null
  isAuthenticated: boolean
  
  // MFA state
  mfaEnabled: boolean
  mfaVerified: boolean
  mfaChallenge: string | null
  
  // Passkey state
  passkeyEnabled: boolean
  passkeyVerified: boolean
  
  // Preferences
  preferences: {
    rememberMe: boolean
    autoLogin: boolean
    notifications: {
      email: boolean
      push: boolean
      sms: boolean
    }
  }
}

interface AuthActions {
  // User actions
  setUser: (user: User | null) => void
  setSession: (session: any | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // Auth status
  setAuthenticated: (authenticated: boolean) => void
  logout: () => void
  
  // MFA actions
  setMfaEnabled: (enabled: boolean) => void
  setMfaVerified: (verified: boolean) => void
  setMfaChallenge: (challenge: string | null) => void
  
  // Passkey actions
  setPasskeyEnabled: (enabled: boolean) => void
  setPasskeyVerified: (verified: boolean) => void
  
  // Preferences
  setPreference: (key: string, value: any) => void
  setNotificationPreference: (type: 'email' | 'push' | 'sms', enabled: boolean) => void
  
  // Utility actions
  hasRole: (role: string) => boolean
  hasAnyRole: (roles: string[]) => boolean
  isAdmin: () => boolean
}

type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>()(
  persist(
    immer((set, get) => ({
      // Initial state
      user: null,
      isLoading: false,
      error: null,
      session: null,
      isAuthenticated: false,
      mfaEnabled: false,
      mfaVerified: false,
      mfaChallenge: null,
      passkeyEnabled: false,
      passkeyVerified: false,
      preferences: {
        rememberMe: false,
        autoLogin: false,
        notifications: {
          email: true,
          push: true,
          sms: false,
        },
      },

      // User actions
      setUser: (user: User | null) => {
        set((state) => {
          state.user = user
          state.isAuthenticated = !!user
        })
      },

      setSession: (session: any | null) => {
        set((state) => {
          state.session = session
          state.user = session?.user || null
          state.isAuthenticated = !!session
        })
      },

      setLoading: (loading: boolean) => {
        set((state) => {
          state.isLoading = loading
        })
      },

      setError: (error: string | null) => {
        set((state) => {
          state.error = error
        })
      },

      setAuthenticated: (authenticated: boolean) => {
        set((state) => {
          state.isAuthenticated = authenticated
        })
      },

      logout: () => {
        set((state) => {
          state.user = null
          state.session = null
          state.isAuthenticated = false
          state.error = null
          state.mfaVerified = false
          state.mfaChallenge = null
          state.passkeyVerified = false
        })
      },

      // MFA actions
      setMfaEnabled: (enabled: boolean) => {
        set((state) => {
          state.mfaEnabled = enabled
        })
      },

      setMfaVerified: (verified: boolean) => {
        set((state) => {
          state.mfaVerified = verified
        })
      },

      setMfaChallenge: (challenge: string | null) => {
        set((state) => {
          state.mfaChallenge = challenge
        })
      },

      // Passkey actions
      setPasskeyEnabled: (enabled: boolean) => {
        set((state) => {
          state.passkeyEnabled = enabled
        })
      },

      setPasskeyVerified: (verified: boolean) => {
        set((state) => {
          state.passkeyVerified = verified
        })
      },

      // Preferences
      setPreference: (key: string, value: any) => {
        set((state) => {
          if (key in state.preferences) {
            ;(state.preferences as any)[key] = value
          }
        })
      },

      setNotificationPreference: (type: 'email' | 'push' | 'sms', enabled: boolean) => {
        set((state) => {
          state.preferences.notifications[type] = enabled
        })
      },

      // Utility actions
      hasRole: (role: string) => {
        const user = get().user
        return user?.roles?.includes(role) || false
      },

      hasAnyRole: (roles: string[]) => {
        const user = get().user
        return roles.some((role) => user?.roles?.includes(role)) || false
      },

      isAdmin: () => {
        const user = get().user
        return user?.isAdmin || user?.roles?.includes('admin') || false
      },
    })),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        mfaEnabled: state.mfaEnabled,
        passkeyEnabled: state.passkeyEnabled,
        preferences: state.preferences,
      }),
    }
  )
)
