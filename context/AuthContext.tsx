'use client'

import { createContext, useEffect, useState, ReactNode } from 'react'
import { SupabaseAuthService, AuthUser, SignInCredentials } from '@/lib/supabase-auth'
import { supabase } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'
import { useToast } from '@/components/ui/Toast'

export interface AuthContextType {
  user: AuthUser | null
  session: Session | null
  loading: boolean
  signIn: (credentials: SignInCredentials) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
  updateProfile: (updates: { fullName?: string; phone?: string }) => Promise<void>
  hasRole: (roles: string | string[]) => boolean
  refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Session error:', error)
          showToast({
            type: 'error',
            message: 'Authentication error. Please refresh the page.'
          })
        }
        
        setSession(session)
        
        if (session?.user) {
          const currentUser = await SupabaseAuthService.getCurrentUser()
          setUser(currentUser)
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
        showToast({
          type: 'error',
          message: 'Failed to initialize authentication. Please refresh the page.'
        })
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        setSession(session)
        
        if (event === 'SIGNED_OUT') {
          setUser(null)
          localStorage.removeItem('authToken')
        } else if (session?.user) {
          try {
            const currentUser = await SupabaseAuthService.getCurrentUser()
            setUser(currentUser)
            
            // Store session token for API calls
            if (session.access_token) {
              localStorage.setItem('authToken', session.access_token)
            }
          } catch (error) {
            console.error('Error getting current user:', error)
            setUser(null)
            showToast({
              type: 'error',
              message: 'Failed to load user profile. Please try logging in again.'
            })
          }
        } else {
          setUser(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (credentials: SignInCredentials) => {
    try {
      setLoading(true)
      await SupabaseAuthService.signIn(credentials)
      // User and session will be set by the auth state change listener
    } catch (error) {
      setLoading(false)
      // Provide more specific error messages
      let errorMessage = 'Login failed. Please try again.'
      if (error instanceof Error) {
        if (error.message.includes('Invalid credentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.'
        } else if (error.message.includes('User profile not found')) {
          errorMessage = 'User account not found or inactive. Please contact administrator.'
        } else if (error.message.includes('EMERGENCY_FIX_REQUIRED')) {
          errorMessage = '🚨 EMERGENCY FIX REQUIRED 🚨 Database security policies need immediate update. Check EMERGENCY_RLS_FIX.md for SQL commands.'
        } else if (error.message.includes('RLS_POLICY_CONFLICT')) {
          errorMessage = 'System configuration issue detected. Please contact your administrator to resolve database security policies.'
        } else if (error.message.includes('configuration error')) {
          errorMessage = 'Authentication system configuration error. Please contact administrator.'
        } else if (error.message.includes('infinite recursion') || 
                   error.message.includes('Cannot coerce the result to a single JSON object') ||
                   error.message.includes('42P17')) {
          errorMessage = '🔒 DATABASE SECURITY ISSUE: RLS policies need immediate attention. Please contact administrator. (Check EMERGENCY_RLS_FIX.md)'
        } else {
          errorMessage = error.message
        }
      }
      showToast({
        type: 'error',
        message: errorMessage,
        duration: 10000 // Show for 10 seconds for emergency messages
      })
      throw error
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      await SupabaseAuthService.signOut()
      
      // Clear local storage
      localStorage.removeItem('authToken')
      
      showToast({
        type: 'success',
        message: 'Successfully signed out'
      })
      
      // User and session will be cleared by the auth state change listener
    } catch (error) {
      setLoading(false)
      showToast({
        type: 'error',
        message: 'Failed to sign out. Please try again.'
      })
      throw error
    }
  }

  const resetPassword = async (email: string) => {
    try {
      await SupabaseAuthService.resetPassword(email)
      showToast({
        type: 'success',
        message: 'Password reset email sent! Check your inbox.'
      })
    } catch (error) {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to send reset email'
      })
      throw error
    }
  }

  const updatePassword = async (newPassword: string) => {
    try {
      await SupabaseAuthService.updatePassword(newPassword)
      showToast({
        type: 'success',
        message: 'Password updated successfully!'
      })
    } catch (error) {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to update password'
      })
      throw error
    }
  }

  const updateProfile = async (updates: { fullName?: string; phone?: string }) => {
    try {
      await SupabaseAuthService.updateProfile(updates)
      // Refresh user data
      if (session?.user) {
        const updatedUser = await SupabaseAuthService.getCurrentUser()
        setUser(updatedUser)
      }
      showToast({
        type: 'success',
        message: 'Profile updated successfully!'
      })
    } catch (error) {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to update profile'
      })
      throw error
    }
  }

  const refreshUser = async () => {
    if (session?.user) {
      try {
        const currentUser = await SupabaseAuthService.getCurrentUser()
        setUser(currentUser)
      } catch (error) {
        console.error('Error refreshing user:', error)
      }
    }
  }

  const hasRole = (roles: string | string[]): boolean => {
    if (!user) return false
    
    if (typeof roles === 'string') {
      return user.role === roles
    }
    
    return roles.includes(user.role)
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    hasRole,
    refreshUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}