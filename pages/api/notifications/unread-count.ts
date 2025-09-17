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

    // Get count of unread notifications for the user
    const { count, error } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false)

    if (error) {
      console.error('Unread notifications count error:', error)
      // Return 0 count instead of error to prevent UI crashes
      return res.status(200).json({
        success: true,
        count: 0
      })
    }

    return res.status(200).json({
      success: true,
      count: count || 0
    })

  } catch (error: unknown) {
    console.error('Unread notifications count error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch unread notifications count'
    return res.status(500).json({ 
      success: false, 
      message: errorMessage
    })
  }
}