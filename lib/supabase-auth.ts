import { supabase, supabaseAdmin } from './supabase'
import type { Session } from '@supabase/supabase-js'

export interface AuthUser {
  id: string
  email: string
  fullName: string
  role: 'admin' | 'manager' | 'user'
  phone?: string
  isActive: boolean
}

export interface SignInCredentials {
  email: string
  password: string
}

export interface CreateUserData {
  email: string
  fullName: string
  role: 'admin' | 'manager' | 'user'
  phone?: string
  createdBy: string
}

export class SupabaseAuthService {
  // Sign in with email and password using Supabase Auth
  static async signIn(credentials: SignInCredentials): Promise<{
    user: AuthUser
    session: Session
  }> {
    const { email, password } = credentials

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !authData.user) {
      throw new Error(authError?.message || 'Invalid credentials')
    }

    // Get user profile from our users table with emergency error handling
    const { data: userProfileData, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)

    if (profileError) {
      console.error('CRITICAL: Profile query error:', profileError)
      // Handle the specific "Cannot coerce the result to a single JSON object" error
      if (profileError.message.includes('Cannot coerce the result to a single JSON object')) {
        throw new Error('EMERGENCY_FIX_REQUIRED: Database RLS policies need immediate update. Copy SQL from EMERGENCY_RLS_FIX.md and run in Supabase SQL Editor.')
      }
      // Handle other RLS policy issues
      if (profileError.message.includes('infinite recursion') || 
          profileError.message.includes('42P17') || 
          profileError.message.includes('permission denied')) {
        throw new Error('RLS_POLICY_CONFLICT: Database security policies need to be updated. Please contact administrator.')
      }
      throw new Error(profileError.message || 'User profile not found or inactive')
    }

    // Check if we got exactly one user
    if (!userProfileData || userProfileData.length === 0) {
      throw new Error('User profile not found or inactive')
    }
    
    if (userProfileData.length > 1) {
      throw new Error('Multiple user profiles found. Please contact administrator.')
    }

    const userProfile = userProfileData[0]

    return {
      user: {
        id: userProfile.id,
        email: userProfile.email,
        fullName: userProfile.full_name,
        role: userProfile.role,
        phone: userProfile.phone,
        isActive: userProfile.is_active,
      },
      session: authData.session,
    }
  }

  // Sign out using Supabase Auth
  static async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw new Error(error.message)
    }
  }

  // Get current session
  static async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      throw new Error(error.message)
    }
    return session
  }

  // Get current user with profile data
  static async getCurrentUser(): Promise<AuthUser | null> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return null
    }

    // Get user profile from our users table with better error handling
    const { data: userProfileData, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('email', user.email)
      .eq('is_active', true)

    if (profileError) {
      console.error('Current user profile query error:', profileError)
      // Handle RLS policy issues specifically
      if (profileError.message.includes('Cannot coerce the result to a single JSON object') ||
          profileError.message.includes('infinite recursion') || 
          profileError.message.includes('42P17') || 
          profileError.message.includes('permission denied')) {
        // Try to get user profile using admin client as fallback
        try {
          const { data: adminUserProfile, error: adminProfileError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', user.email)
            .eq('is_active', true)
            .single()
          
          if (adminProfileError || !adminUserProfile) {
            return null
          }
          
          // Return the user profile from admin query
          return {
            id: adminUserProfile.id,
            email: adminUserProfile.email,
            fullName: adminUserProfile.full_name,
            role: adminUserProfile.role,
            phone: adminUserProfile.phone,
            isActive: adminUserProfile.is_active,
          }
        } catch (adminError) {
          console.error('Admin fallback failed:', adminError)
          return null
        }
      }
      return null
    }

    // Check if we got exactly one user
    if (!userProfileData || userProfileData.length === 0) {
      return null
    }
    
    if (userProfileData.length > 1) {
      console.error('Multiple user profiles found for email:', user.email)
      return null
    }

    const userProfile = userProfileData[0]

    return {
      id: userProfile.id,
      email: userProfile.email,
      fullName: userProfile.full_name,
      role: userProfile.role,
      phone: userProfile.phone,
      isActive: userProfile.is_active,
    }
  }

  // Create user account (admin/manager only) - sends invite email
  static async createUserAccount(userData: CreateUserData, creatorRole: string): Promise<string> {
    const { email, fullName, role, phone, createdBy } = userData

    // Role-based creation validation
    if (creatorRole === 'manager' && role === 'admin') {
      throw new Error('Managers cannot create admin accounts')
    }

    if (creatorRole === 'user') {
      throw new Error('Users cannot create accounts')
    }

    // Check if user already exists in auth.users by email lookup
    const { data: existingUsers, error: lookupError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .limit(1)
    
    if (lookupError) {
      console.error('Error checking existing users:', lookupError)
    }
    
    if (existingUsers && existingUsers.length > 0) {
      throw new Error('User with this email already exists')
    }

    // Check if user already exists in our users table
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      throw new Error('User with this email already exists')
    }

    // Create auth user with email invitation
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          full_name: fullName,
          role,
          phone,
          created_by: createdBy
        },
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/confirm`
      }
    )

    if (authError || !authUser.user) {
      throw new Error(authError?.message || 'Failed to create auth user')
    }

    // Create user profile in our users table
    const { data: newUser, error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authUser.user.id,
        email,
        full_name: fullName,
        role,
        phone,
        created_by: createdBy,
        is_active: true,
      })
      .select('id')
      .single()

    if (profileError || !newUser) {
      // Clean up auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      throw new Error('Failed to create user profile')
    }

    return newUser.id
  }

  // Reset password - sends reset email
  static async resetPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset/confirm`,
    })

    if (error) {
      throw new Error(error.message)
    }
  }

  // Update password (requires current session)
  static async updatePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      throw new Error(error.message)
    }
  }

  // Update user profile
  static async updateProfile(updates: Partial<{
    fullName: string
    phone: string
  }>): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('No authenticated user')
    }

    // Update user metadata in auth
    if (updates.fullName) {
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: updates.fullName }
      })
      if (authError) {
        throw new Error(authError.message)
      }
    }

    // Update user profile in our users table
    const profileUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (updates.fullName) profileUpdates.full_name = updates.fullName
    if (updates.phone) profileUpdates.phone = updates.phone

    const { error: profileError } = await supabase
      .from('users')
      .update(profileUpdates)
      .eq('id', user.id)

    if (profileError) {
      throw new Error('Failed to update profile')
    }
  }

  // Deactivate user account (admin/manager only)
  static async deactivateUser(userId: string): Promise<void> {
    // Update user status in our users table
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .update({ 
        is_active: false, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', userId)

    if (profileError) {
      throw new Error('Failed to deactivate user')
    }

    // Revoke all sessions for the user
    const { error: revokeError } = await supabaseAdmin.auth.admin.signOut(userId, 'global')
    if (revokeError) {
      console.warn('Failed to revoke user sessions:', revokeError.message)
    }
  }

  // Reactivate user account (admin/manager only)
  static async reactivateUser(userId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('users')
      .update({ 
        is_active: true, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', userId)

    if (error) {
      throw new Error('Failed to reactivate user')
    }
  }

  // Get all users (admin/manager only)
  static async getUsers(filters?: {
    role?: string
    createdBy?: string
    isActive?: boolean
  }): Promise<AuthUser[]> {
    let query = supabaseAdmin
      .from('users')
      .select('*')

    if (filters?.role) {
      query = query.eq('role', filters.role)
    }

    if (filters?.createdBy) {
      query = query.eq('created_by', filters.createdBy)
    }

    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive)
    }

    const { data: users, error } = await query.order('created_at', { ascending: false })

    if (error) {
      throw new Error('Failed to fetch users')
    }

    return (users || []).map(user => ({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      phone: user.phone,
      isActive: user.is_active,
    }))
  }

  // Listen to auth state changes
  static onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        try {
          const user = await this.getCurrentUser()
          callback(user)
        } catch (error) {
          console.error('Error getting current user:', error)
          callback(null)
        }
      } else {
        callback(null)
      }
    })
  }
}