# RLS Policy Fix Instructions

## Issue Summary

The "Cannot coerce the result to a single JSON object" error occurs because Row Level Security (RLS) policies are preventing authenticated users from accessing their own profile data in the database.

## Root Cause

The current RLS policies on the [users](file:///C:/Users/Lucifer/Documents/react/report-calculator-nextjs/lib/supabase.ts#L147-L161), [reports](file:///C:/Users/Lucifer/Documents/react/report-calculator-nextjs/database-schema.sql#L27-L41), [payments](file:///C:/Users/Lucifer/Documents/react/report-calculator-nextjs/database-schema.sql#L44-L59), and [activity_logs](file:///C:/Users/Lucifer/Documents/react/report-calculator-nextjs/database-schema.sql#L61-L67) tables contain recursive logic that creates conflicts when users try to fetch their own data.

## Solution

You need to manually update the RLS policies in your Supabase database. Follow these steps:

## Step-by-Step Fix

### 1. Access Supabase Dashboard

1. Go to https://app.supabase.com/
2. Log in to your account
3. Select your project
4. Click on "SQL Editor" in the left sidebar

### 2. Execute SQL Commands

Copy and paste the following SQL commands into the editor and click "RUN":

```sql
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can view own reports" ON reports;
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
DROP POLICY IF EXISTS "Admins can view all activity logs" ON activity_logs;

-- Create new policies without recursion
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
  FOR SELECT USING ((auth.jwt() ->> 'role') = 'admin');

-- Refresh the schema
NOTIFY pgrst, 'reload schema';
```

### 3. Restart Development Server

After applying the fix:
1. Stop your development server (Ctrl+C)
2. Restart with: `npm run dev`

### 4. Verify the Fix

Test with these credentials:
- **Admin**: manish.epacific@gmail.com / password
- **Manager**: manager@epacific.com / manager123
- **User**: user@epacific.com / user123

## Test Script

You can verify the fix works by running:
```bash
node verify-rls-fix.mjs
```

## Prevention

To avoid similar issues in the future:
1. Always use `DROP POLICY IF EXISTS` before creating new policies
2. Avoid recursive logic in policy definitions
3. Test authentication flows regularly after database changes
4. Monitor Supabase logs for RLS-related errors

## Support

If you continue to experience issues:
1. Check that all SQL commands executed successfully
2. Verify your environment variables in `.env.local`
3. Confirm you're testing with the correct credentials
4. Check browser console for JavaScript errors