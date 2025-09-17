import { NextApiRequest, NextApiResponse } from 'next'
import { AuthService } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
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
    const manager = await AuthService.verifyToken(token)

    if (manager.role !== 'manager' && manager.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied' 
      })
    }

    const { reportId, action, comments } = req.body

    if (!reportId || !action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Report ID and valid action (approve/reject) are required'
      })
    }

    // Get the report first
    const { data: report, error: fetchError } = await supabaseAdmin
      .from('reports')
      .select('*, users!inner(full_name, email)')
      .eq('id', reportId)
      .single()

    if (fetchError || !report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      })
    }

    // Update report status
    const newStatus = action === 'approve' ? 'approved' : 'rejected'
    const { error: updateError } = await supabaseAdmin
      .from('reports')
      .update({
        status: newStatus,
        processing_details: {
          ...report.processing_details,
          managerAction: {
            action,
            comments: comments || '',
            managerId: manager.id,
            managerName: manager.fullName,
            actionDate: new Date().toISOString()
          }
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId)

    if (updateError) {
      console.error('Error updating report:', updateError)
      return res.status(500).json({
        success: false,
        message: 'Failed to update report status'
      })
    }

    // Log activity
    await supabaseAdmin
      .from('activity_logs')
      .insert({
        user_id: manager.id,
        action: `Report ${action}d`,
        details: {
          reportId,
          userId: report.user_id,
          userName: report.users.full_name,
          comments: comments || '',
          totalAmount: report.total_amount
        }
      })

    return res.status(200).json({
      success: true,
      message: `Report ${action}d successfully`
    })

  } catch (error: any) {
    console.error('Report approval error:', error)
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to process report approval'
    })
  }
}