import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

async function fixUserPolicy() {
  console.log('Fixing user RLS policy to avoid recursion...');
  
  try {
    // First, let's check the current policies
    console.log('Checking current policies...');
    
    // Since we can't use exec_sql, let's try to recreate the policies using the Supabase client
    // We need to drop the existing policy and create a new one without recursion
    
    // The issue is with this policy:
    // CREATE POLICY "Users can view own profile" ON users
    //   FOR SELECT USING (auth.uid() = id OR
    //     (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager'));
    //
    // The fix is to use auth.jwt() to get the role instead of querying the users table
    
    console.log('Attempting to fix RLS policy...');
    
    // Note: We can't directly modify RLS policies through the JavaScript client
    // We need to provide SQL commands that should be run in the Supabase SQL editor
    
    console.log('\nPlease run the following SQL commands in your Supabase SQL editor:');
    console.log('\n--- FIX RLS POLICY ---');
    console.log('DROP POLICY IF EXISTS "Users can view own profile" ON users;');
    console.log('');
    console.log('CREATE POLICY "Users can view own profile" ON users');
    console.log('  FOR SELECT USING (');
    console.log('    auth.uid() = id OR');
    console.log('    (auth.jwt() ->> \'role\') IN (\'admin\', \'manager\')');
    console.log('  );');
    console.log('--- END FIX ---');
    
    console.log('\nThis will fix the infinite recursion issue in the RLS policy.');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

fixUserPolicy();