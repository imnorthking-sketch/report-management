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
      return res.status(401).json({ success: false, message: 'No token provided' })
    }

    const token = authHeader.substring(7)
    const user = await AuthService.verifyToken(token)

    if (!['admin', 'manager'].includes(user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' })
    }

    const { reportId, comment, action } = req.body

    if (!reportId || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Report ID and comment are required'
      })
    }

    // Verify the report exists
    const { data: report, error: reportError } = await supabaseAdmin
      .from('reports')
      .select('id, user_id, status, filename')
      .eq('id', reportId)
      .single()

    if (reportError || !report) {
      return res.status(404).json({ success: false, message: 'Report not found' })
    }

    // Update report with manager comment
    const updateData: any = {
      manager_comments: comment,
      updated_at: new Date().toISOString()
    }

    // If action is provided, update status accordingly
    if (action === 'approve') {
      updateData.status = 'approved'
    } else if (action === 'reject') {
      updateData.status = 'rejected'
      updateData.rejection_reason = comment
    }

    const { error: updateError } = await supabaseAdmin
      .from('reports')
      .update(updateData)
      .eq('id', reportId)

    if (updateError) {
      console.error('Report update error:', updateError)
      return res.status(500).json({
        success: false,
        message: 'Failed to add comment'
      })
    }

    // Add to report history
    await supabaseAdmin
      .from('report_history')
      .insert({
        report_id: reportId,
        action: action ? `manager_${action}d` : 'comment_added',
        new_status: updateData.status || report.status,
        comments: comment,
        performed_by: user.id
      })

    // Create notification for user
    const notificationTitle = action 
      ? `Report ${action === 'approve' ? 'Approved' : 'Rejected'}`
      : 'Manager Comment Added'
    
    const notificationMessage = action
      ? `Your report "${report.filename}" has been ${action}d. ${comment}`
      : `A manager has added a comment to your report "${report.filename}". ${comment}`

    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: report.user_id,
        type: action ? `report_${action}d` : 'comment_added',
        title: notificationTitle,
        message: notificationMessage,
        data: {
          reportId: reportId,
          action: action || 'comment',
          comment: comment
        }
      })

    console.log('Manager comment added:', {
      reportId,
      managerId: user.id,
      action: action || 'comment',
      comment: comment.substring(0, 100) + '...'
    })

    return res.status(200).json({
      success: true,
      message: `Comment ${action ? 'and ' + action + ' action' : ''} added successfully`,
      data: {
        reportId,
        comment,
        action: action || 'comment',
        status: updateData.status || report.status
      }
    })

  } catch (error: unknown) {
    console.error('Add comment error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to add comment'
    return res.status(500).json({ 
      success: false, 
      message: errorMessage
    })
  }
}