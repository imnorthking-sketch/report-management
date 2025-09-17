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
      return res.status(401).json({ 
        success: false,
        message: 'No token provided' 
      })
    }

    const token = authHeader.substring(7)
    const user = await AuthService.verifyToken(token)

    if (user.role !== 'manager' && user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied' 
      })
    }

    // Get pending reports with user information
    const { data: reports, error } = await supabaseAdmin
      .from('reports')
      .select(`
        *,
        users!inner(
          id,
          full_name,
          email
        )
      `)
      .eq('status', 'pending_approval')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching pending reports:', error)
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch pending reports'
      })
    }

    return res.status(200).json({
      success: true,
      reports: reports || []
    })

  } catch (error: any) {
    console.error('Pending reports API error:', error)
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch pending reports'
    })
  }
}