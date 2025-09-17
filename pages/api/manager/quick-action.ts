import { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

const JWT_SECRET = process.env.JWT_SECRET!

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  try {
    // Verify authentication
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    
    // Verify manager role
    const { data: manager } = await supabaseAdmin
      .from('users')
      .select('id, role, full_name')
      .eq('id', decoded.userId)
      .eq('is_active', true)
      .single()

    if (!manager || (manager.role !== 'manager' && manager.role !== 'admin')) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' })
    }

    const { reportId, action } = req.body

    if (!reportId || !action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Report ID and valid action (approve/reject) are required'
      })
    }

    // Get the report
    const { data: report, error: reportError } = await supabaseAdmin
      .from('reports')
      .select('id, user_id, filename, status')
      .eq('id', reportId)
      .single()

    if (reportError || !report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      })
    }

    if (report.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Report is not pending approval'
      })
    }

    // Update report status
    const newStatus = action === 'approve' ? 'approved' : 'rejected'
    const updateData: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString()
    }

    if (action === 'approve') {
      updateData.approved_by = manager.id
      updateData.approved_at = new Date().toISOString()
    } else {
      updateData.rejection_reason = 'Quick rejection from dashboard'
    }

    const { error: updateError } = await supabaseAdmin
      .from('reports')
      .update(updateData)
      .eq('id', reportId)

    if (updateError) {
      console.error('Report update error:', updateError)
      return res.status(500).json({
        success: false,
        message: 'Failed to update report status'
      })
    }

    // Add to report history
    await supabaseAdmin
      .from('report_history')
      .insert({
        report_id: reportId,
        action: `report_${action}d`,
        previous_status: 'pending',
        new_status: newStatus,
        comments: `Quick ${action} from manager dashboard`,
        performed_by: manager.id
      })

    // Log activity
    await supabaseAdmin
      .from('activity_logs')
      .insert({
        user_id: manager.id,
        action: `Report ${action}d: ${report.filename}`,
        entity_type: 'report',
        entity_id: reportId,
        details: {
          reportId,
          action,
          filename: report.filename,
          quickAction: true
        }
      })

    // Create notification for user
    const notificationTitle = action === 'approve' ? 'Report Approved' : 'Report Rejected'
    const notificationMessage = action === 'approve'
      ? `Your report "${report.filename}" has been approved by ${manager.full_name}`
      : `Your report "${report.filename}" has been rejected. Please review and resubmit if needed.`

    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: report.user_id,
        type: action === 'approve' ? 'report_approved' : 'report_rejected',
        title: notificationTitle,
        message: notificationMessage,
        data: {
          reportId,
          action,
          managerId: manager.id,
          managerName: manager.full_name
        }
      })

    return res.status(200).json({
      success: true,
      message: `Report ${action}d successfully`,
      data: {
        reportId,
        newStatus,
        action
      }
    })

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    console.error('Quick action error:', error)
    return res.status(500).json({
      success: false,
      message: errorMessage
    })
  }
}