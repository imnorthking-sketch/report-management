-- COMPLETE RLS POLICY FIX
-- This script fixes all recursive RLS policies in the database

-- Drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can view own reports" ON reports;
DROP POLICY IF EXISTS "Users can insert own reports" ON reports;
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
DROP POLICY IF EXISTS "Users can insert activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Admins can view all activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Users can view own payment proofs" ON payment_proofs;
DROP POLICY IF EXISTS "Users can insert own payment proofs" ON payment_proofs;
DROP POLICY IF EXISTS "Managers can update payment proofs" ON payment_proofs;
DROP POLICY IF EXISTS "Users can view own partial payments" ON partial_payments;
DROP POLICY IF EXISTS "Users can view report comments" ON comments;
DROP POLICY IF EXISTS "Users can insert comments" ON comments;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view own notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can manage own notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can view own invoices" ON invoices;
DROP POLICY IF EXISTS "Admins can view all audit trail" ON audit_trail;
DROP POLICY IF EXISTS "Users can view own file upload sessions" ON file_upload_sessions;
DROP POLICY IF EXISTS "Users can manage own file upload sessions" ON file_upload_sessions;
DROP POLICY IF EXISTS "Users can insert own payments" ON payments;
DROP POLICY IF EXISTS "Managers can update payments" ON payments;

-- Create new non-recursive policies for core tables
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (
    auth.uid() = id OR
    (auth.jwt() ->> 'role') IN ('admin', 'manager')
  );

CREATE POLICY "Users can view own reports" ON reports
  FOR SELECT USING (
    auth.uid() = user_id OR
    (auth.jwt() ->> 'role') IN ('admin', 'manager')
  );

CREATE POLICY "Users can insert own reports" ON reports
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (
    auth.uid() = user_id OR
    (auth.jwt() ->> 'role') IN ('admin', 'manager')
  );

CREATE POLICY "Users can insert activity logs" ON activity_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all activity logs" ON activity_logs
  FOR SELECT USING (
    (auth.jwt() ->> 'role') = 'admin'
  );

-- Create new non-recursive policies for enhanced tables
CREATE POLICY "Users can view own payment proofs" ON payment_proofs
  FOR SELECT USING (
    auth.uid() = user_id OR
    (auth.jwt() ->> 'role') IN ('admin', 'manager')
  );

CREATE POLICY "Users can insert own payment proofs" ON payment_proofs
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

CREATE POLICY "Managers can update payment proofs" ON payment_proofs
  FOR UPDATE USING (
    (auth.jwt() ->> 'role') IN ('admin', 'manager')
  );

CREATE POLICY "Users can view own partial payments" ON partial_payments
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM payments WHERE id = payment_id) OR
    (auth.jwt() ->> 'role') IN ('admin', 'manager')
  );

CREATE POLICY "Users can view report comments" ON comments
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM reports WHERE id = report_id) OR
    auth.uid() = user_id OR
    (auth.jwt() ->> 'role') IN ('admin', 'manager')
  );

CREATE POLICY "Users can insert comments" ON comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND (
      auth.uid() = (SELECT user_id FROM reports WHERE id = report_id) OR
      (auth.jwt() ->> 'role') IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (
    auth.uid() = user_id
  );

CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (
    auth.uid() = user_id
  );

CREATE POLICY "Users can view own notification preferences" ON notification_preferences
  FOR SELECT USING (
    auth.uid() = user_id
  );

CREATE POLICY "Users can manage own notification preferences" ON notification_preferences
  FOR ALL USING (
    auth.uid() = user_id
  );

CREATE POLICY "Users can view own invoices" ON invoices
  FOR SELECT USING (
    auth.uid() = user_id OR
    (auth.jwt() ->> 'role') IN ('admin', 'manager')
  );

CREATE POLICY "Admins can view all audit trail" ON audit_trail
  FOR SELECT USING (
    (auth.jwt() ->> 'role') = 'admin'
  );

CREATE POLICY "Users can view own file upload sessions" ON file_upload_sessions
  FOR SELECT USING (
    auth.uid() = user_id
  );

CREATE POLICY "Users can manage own file upload sessions" ON file_upload_sessions
  FOR ALL USING (
    auth.uid() = user_id
  );

CREATE POLICY "Users can insert own payments" ON payments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

CREATE POLICY "Managers can update payments" ON payments
  FOR UPDATE USING (
    (auth.jwt() ->> 'role') IN ('admin', 'manager')
  );

-- Refresh schema
NOTIFY pgrst, 'reload schema';