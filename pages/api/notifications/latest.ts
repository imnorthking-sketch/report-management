import { NextApiRequest, NextApiResponse } from 'next'
import { AuthService } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' })
    }

    const token = authHeader.substring(7)
    const user = await AuthService.verifyToken(token)

    // Get limit from query parameters (default to 5)
    const limit = parseInt(req.query.limit as string) || 5

    // Validate limit to prevent excessive queries
    const validatedLimit = Math.min(Math.max(limit, 1), 20)

    const { data: notifications, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(validatedLimit)

    if (error) {
      console.error('Latest notifications fetch error:', error)
      // Return empty array instead of error to prevent UI crashes
      return res.status(200).json({
        success: true,
        notifications: []
      })
    }

    return res.status(200).json({
      success: true,
      notifications: notifications || []
    })

  } catch (error: unknown) {
    console.error('Latest notifications fetch error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch latest notifications'
    return res.status(500).json({ 
      success: false, 
      message: errorMessage
    })
  }
}