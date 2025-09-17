import { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

const JWT_SECRET = process.env.JWT_SECRET!

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
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
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('id', decoded.userId)
      .eq('is_active', true)
      .single()

    if (!user || (user.role !== 'manager' && user.role !== 'admin')) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' })
    }

    // Get comprehensive manager statistics
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()))
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    const [
      pendingReportsResult,
      pendingProofsResult,
      todaySubmissionsResult,
      weekAmountResult,
      approvalStatsResult,
      totalStatsResult,
      usersResult
    ] = await Promise.all([
      // Pending reports
      supabaseAdmin
        .from('reports')
        .select('id')
        .eq('status', 'pending'),

      // Pending payment proofs
      supabaseAdmin
        .from('payment_proofs')
        .select('id')
        .eq('status', 'pending_approval'),

      // Today's submissions
      supabaseAdmin
        .from('reports')
        .select('id, total_amount')
        .gte('created_at', startOfDay.toISOString()),

      // This week's amount
      supabaseAdmin
        .from('reports')
        .select('total_amount')
        .gte('created_at', startOfWeek.toISOString()),

      // Approval statistics
      supabaseAdmin
        .from('reports')
        .select('status, approved_at, created_at')
        .gte('created_at', startOfMonth.toISOString()),

      // Total statistics
      supabaseAdmin
        .from('reports')
        .select('id, total_amount, status'),

      // Users count
      supabaseAdmin
        .from('users')
        .select('id')
        .eq('is_active', true)
    ])

    // Calculate metrics
    const pendingReports = pendingReportsResult.data?.length || 0
    const pendingPaymentProofs = pendingProofsResult.data?.length || 0
    const todaySubmissions = todaySubmissionsResult.data?.length || 0
    const totalReportsToday = todaySubmissions
    const totalAmountToday = todaySubmissionsResult.data?.reduce((sum, report) => sum + (report.total_amount || 0), 0) || 0
    const thisWeekAmount = weekAmountResult.data?.reduce((sum, report) => sum + (report.total_amount || 0), 0) || 0

    // Calculate approval rate and average time
    const allReportsThisMonth = approvalStatsResult.data || []
    const approvedReports = allReportsThisMonth.filter(r => r.status === 'approved')
    const rejectedReports = allReportsThisMonth.filter(r => r.status === 'rejected')
    
    const approvalRate = allReportsThisMonth.length > 0 
      ? Math.round((approvedReports.length / allReportsThisMonth.length) * 100) 
      : 0

    const rejectionRate = allReportsThisMonth.length > 0
      ? Math.round((rejectedReports.length / allReportsThisMonth.length) * 100)
      : 0

    // Calculate average approval time in hours
    const approvalTimes = approvedReports
      .filter(r => r.approved_at && r.created_at)
      .map(r => {
        const created = new Date(r.created_at).getTime()
        const approved = new Date(r.approved_at!).getTime()
        return (approved - created) / (1000 * 60 * 60) // Convert to hours
      })

    const averageApprovalTime = approvalTimes.length > 0 
      ? Math.round(approvalTimes.reduce((sum, time) => sum + time, 0) / approvalTimes.length)
      : 0

    // Total statistics
    const allReports = totalStatsResult.data || []
    const totalReports = allReports.length
    const totalPayments = allReports.reduce((sum, report) => sum + (report.total_amount || 0), 0)
    const totalUsers = usersResult.data?.length || 0

    // Calculate pending payments amount
    const pendingPayments = allReports
      .filter(r => r.status === 'pending' || r.status === 'processing')
      .reduce((sum, report) => sum + (report.total_amount || 0), 0)

    const stats = {
      totalUsers,
      pendingPayments,
      totalPayments,
      totalReports,
      pendingReports,
      pendingPaymentProofs,
      totalReportsToday,
      totalAmountToday,
      rejectionRate,
      todaySubmissions,
      thisWeekAmount,
      approvalRate,
      averageApprovalTime
    }

    return res.status(200).json({
      success: true,
      stats
    })

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    console.error('Manager dashboard stats error:', error)
    return res.status(500).json({
      success: false,
      message: errorMessage
    })
  }
}