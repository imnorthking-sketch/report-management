# Fix Login Issues

This document explains how to fix the "User profile not found or inactive" error and other login issues in the Report Calculator application.

## Root Cause

The main issue is caused by an infinite recursion in the Row Level Security (RLS) policies in the database. The problematic policy was:

```sql
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id OR
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager'));
```

This policy causes infinite recursion because it queries the same [users](file:///c:/Users/Lucifer/Documents/react/report-calculator-nextjs/database-schema.sql#L12-L23) table within its own definition.

## Solution

### 1. Apply the RLS Policy Fix (Required)

Run the SQL commands in `apply-rls-fix.sql` in your Supabase SQL editor:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `apply-rls-fix.sql`
4. Run the query

This will:
- Drop the problematic policies
- Create new policies using `auth.jwt() ->> 'role'` instead of recursive queries
- Fix the infinite recursion issue

### 2. Verify the Fix

After applying the RLS fix, run the verification script:

```bash
node verify-users.mjs
```

### 3. Test Login

Test the login functionality with these credentials:

- Admin: manish.epacific@gmail.com / password
- Manager: manager@company.com / manager123
- User: user@company.com / user123

## Alternative Solutions

If you're still having issues with email validation in Supabase:

### Use Alternative Email Addresses

The application also has users with these email addresses that may work:

- Admin: admin@company.com / admin123
- Manager: manager@example.com / manager123
- User: user@example.com / user123

### Manually Create Users

If needed, you can manually create users in the Supabase Authentication dashboard:
1. Go to your Supabase project dashboard
2. Navigate to Authentication > Users
3. Click "Add user"
4. Enter email and password
5. Set email as confirmed

## Background Animation Fix

The background animation should now work correctly. If it's still not working:

1. Ensure you're using a modern browser
2. Check that JavaScript is enabled
3. Verify that the Framer Motion library is properly installed:

```bash
npm install framer-motion
```

## Toast Notification Fix

The login error alerts now use modern toast notifications with:
- Red-500 background
- White text
- Rounded-lg styling
- Shadow-md effect
- Fade in/out animation after 3 seconds

## Troubleshooting

If you're still experiencing issues:

1. Check browser console for errors
2. Verify Supabase environment variables are correctly set
3. Ensure the database connection is working
4. Confirm that the RLS policies were applied correctly

## Contact

If you continue to experience issues, please contact the development team for further assistance.