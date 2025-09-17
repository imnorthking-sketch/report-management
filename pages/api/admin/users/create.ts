import { NextApiRequest, NextApiResponse } from 'next'
import { SupabaseAuthService } from '@/lib/supabase-auth'
import { createServerSupabaseClient } from '@/lib/supabase'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Verify admin authentication
    const supabase = createServerSupabaseClient(req, res)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      })
    }

    // Get admin user profile
    const adminUser = await SupabaseAuthService.getCurrentUser()
    if (!adminUser || !['admin', 'manager'].includes(adminUser.role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin or manager access required'
      })
    }

    const { email, fullName, role, phone } = req.body

    // Validate required fields
    if (!email || !fullName || !role) {
      return res.status(400).json({
        success: false,
        message: 'Email, full name, and role are required'
      })
    }

    // Validate role
    if (!['admin', 'manager', 'user'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      })
    }

    console.log(`👤 Creating user: ${email} with role: ${role}`)

    // Create user account (this will send an invitation email)
    const userId = await SupabaseAuthService.createUserAccount(
      {
        email,
        fullName,
        role,
        phone,
        createdBy: adminUser.id
      },
      adminUser.role
    )

    console.log(`✅ User created successfully: ${email} (ID: ${userId})`)

    res.status(201).json({
      success: true,
      message: 'User created successfully. An invitation email has been sent.',
      userId
    })
  } catch (error: unknown) {
    console.error('User creation error:', error)
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'User creation failed'
    })
  }
}
