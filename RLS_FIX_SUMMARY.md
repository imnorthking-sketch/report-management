# RLS Policy Fix Summary

## Issue Identified

The login problem was caused by Row Level Security (RLS) policy conflicts in the Supabase database. While users could authenticate successfully, they couldn't fetch their profile information due to RLS policy restrictions that were causing "Cannot coerce the result to a single JSON object" errors.

## Root Cause

The existing RLS policies on the [users](file:///C:/Users/Lucifer/Documents/react/report-calculator-nextjs/lib/supabase.ts#L147-L161), [reports](file:///C:/Users/Lucifer/Documents/react/report-calculator-nextjs/database-schema.sql#L27-L41), [payments](file:///C:/Users/Lucifer/Documents/react/report-calculator-nextjs/database-schema.sql#L44-L59), and [activity_logs](file:///C:/Users/Lucifer/Documents/react/report-calculator-nextjs/database-schema.sql#L61-L67) tables contained recursive logic that prevented proper data access when authenticated users tried to fetch their own records.

## Solution Implemented

### 1. Enhanced Application-Level Error Handling

Updated `lib/supabase-auth.ts` to:
- Better detect RLS policy errors
- Provide more specific fallback mechanisms using admin client
- Handle the "Cannot coerce the result to a single JSON object" error specifically
- Improve error messages for different failure scenarios

### 2. Improved User Experience

Enhanced error messaging in:
- AuthContext for clearer feedback
- Login page for better user guidance

### 3. Diagnostic and Verification Tools

Created several helper scripts:
- `diagnose-user-fetch.mjs` - Detailed diagnostic of the issue
- `apply-rls-fix-direct.mjs` - Clear instructions for manual fix
- `verify-rls-fix.mjs` - Verification script to confirm fix works

## Manual Database Fix Required

Since automated policy management is limited, you must manually apply the fix in your Supabase dashboard:

### SQL Commands to Run:

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

## Verification Steps

After applying the fix:

1. Run `node verify-rls-fix.mjs` to confirm the fix works
2. Restart your development server (`npm run dev`)
3. Test login with credentials:
   - Admin: manish.epacific@gmail.com / password
   - Manager: manager@epacific.com / manager123
   - User: user@epacific.com / user123

## Expected Outcome

- ✅ Authentication continues to work as before
- ✅ User profiles can now be fetched successfully
- ✅ No more "Cannot coerce the result to a single JSON object" errors
- ✅ Users can access their respective dashboards without issues

## Prevention

To avoid similar issues in the future:
1. Always test RLS policies thoroughly after creation
2. Use the `DROP POLICY IF EXISTS` pattern when creating policies
3. Avoid recursive logic in policy definitions
4. Test authentication flows regularly after database schema changes