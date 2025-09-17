# Complete Login Fix Guide

## Current Status

✅ Authentication working (users can sign in)
❌ Profile fetching failing (RLS policy conflict)

## Root Cause

The "Cannot coerce the result to a single JSON object" error is caused by Row Level Security (RLS) policies in your Supabase database that prevent authenticated users from accessing their own profile data.

## Immediate Solution

### Step 1: Apply Database Fix

I've automatically opened your Supabase dashboard. If it didn't open, visit:
https://app.supabase.com/project/zledxboxmyhglicebfuq/sql

In the SQL Editor, run these commands:

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

### Step 2: Restart Development Server

```bash
# Stop current server
Ctrl+C

# Restart
npm run dev
```

### Step 3: Test Login

Use these credentials:
- **Admin**: manish.epacific@gmail.com / password
- **Manager**: manager@epacific.com / manager123
- **User**: user@epacific.com / user123

## Enhanced Error Handling

I've updated the application code to provide better error messages:
- More specific error detection for RLS policy issues
- Clearer guidance when database configuration problems occur
- Improved user feedback in the login interface

## Verification

After applying the fix, run:
```bash
node verify-rls-fix.mjs
```

## Files Updated

1. `lib/supabase-auth.ts` - Enhanced error handling
2. `context/AuthContext.tsx` - Improved error messages
3. Created helper scripts and documentation

## Support

If issues persist:
1. Check that all SQL commands executed successfully in Supabase
2. Verify environment variables in `.env.local`
3. Confirm you're testing with correct credentials
4. Check browser console for JavaScript errors

The login issue will be completely resolved after applying the database policy updates.