# EMERGENCY RLS POLICY FIX

## Immediate Action Required

The login issue is caused by RLS policies in your Supabase database. You must manually update these policies.

## Step 1: Access Supabase Dashboard

Visit: https://app.supabase.com/project/zledxboxmyhglicebfuq/sql

## Step 2: Execute This Exact SQL Command

```sql
-- FIX RLS POLICY ISSUE
-- Drop and recreate policies to fix infinite recursion

-- Drop existing policies causing issues
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can view own reports" ON reports;
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
DROP POLICY IF EXISTS "Admins can view all activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Users can view own payment proofs" ON payment_proofs;
DROP POLICY IF EXISTS "Managers can update payment proofs" ON payment_proofs;
DROP POLICY IF EXISTS "Users can view own partial payments" ON partial_payments;
DROP POLICY IF EXISTS "Users can view report comments" ON comments;
DROP POLICY IF EXISTS "Users can insert comments" ON comments;
DROP POLICY IF EXISTS "Users can view own invoices" ON invoices;
DROP POLICY IF EXISTS "Admins can view all audit trail" ON audit_trail;
DROP POLICY IF EXISTS "Users can view own file upload sessions" ON file_upload_sessions;
DROP POLICY IF EXISTS "Users can manage own file upload sessions" ON file_upload_sessions;

-- Create new policies without recursion issues using JWT claims
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

CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (
    auth.uid() = user_id OR
    (auth.jwt() ->> 'role') IN ('admin', 'manager')
  );

CREATE POLICY "Admins can view all activity logs" ON activity_logs
  FOR SELECT USING (
    (auth.jwt() ->> 'role') = 'admin'
  );

CREATE POLICY "Users can view own payment proofs" ON payment_proofs
  FOR SELECT USING (
    auth.uid() = user_id OR
    (auth.jwt() ->> 'role') IN ('admin', 'manager')
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

-- Refresh schema
NOTIFY pgrst, 'reload schema';
```

## Step 3: Restart Your Development Server

1. Stop server: `Ctrl+C`
2. Restart: `npm run dev`

## Step 4: Test Login

Credentials:
- Admin: manish.epacific@gmail.com / password
- Manager: manager@epacific.com / manager123
- User: user@epacific.com / user123

## Verification

After applying the fix, run:
```bash
node verify-rls-fix.mjs
```

This should resolve the "Cannot coerce the result to a single JSON object" error immediately.