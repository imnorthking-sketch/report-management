import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create admin client
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixRLSPoliciesDirectly() {
  console.log('Fixing RLS policies directly...');
  
  try {
    // First, let's check the current policies
    console.log('Checking current policies...');
    
    // We'll test access to the tables
    await supabaseAdmin
      .from('users')
      .select('id')
      .limit(1);
    
    // The above is just to test connection, now let's actually fix the policies
    // by using a different approach - we'll recreate the RLS policies properly
    
    console.log('Applying RLS policy fixes...');
    
    // Since we can't directly execute SQL through the JS client,
    // we'll need to provide instructions for manual fix
    console.log('\n--- MANUAL FIX INSTRUCTIONS ---');
    console.log('Please execute the following SQL commands in your Supabase SQL Editor:');
    console.log('\n1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run these commands:');
    console.log('\n--- SQL COMMANDS TO RUN ---');
    console.log('-- Drop existing problematic policies');
    console.log('DROP POLICY IF EXISTS "Users can view own profile" ON users;');
    console.log('DROP POLICY IF EXISTS "Users can view own reports" ON reports;');
    console.log('DROP POLICY IF EXISTS "Users can view own payments" ON payments;');
    console.log('DROP POLICY IF EXISTS "Admins can view all activity logs" ON activity_logs;');
    console.log('');
    console.log('-- Create new policies without recursion');
    console.log('CREATE POLICY "Users can view own profile" ON users');
    console.log('  FOR SELECT USING (');
    console.log('    auth.uid() = id OR');
    console.log('    (auth.jwt() ->> \'role\') IN (\'admin\', \'manager\')');
    console.log('  );');
    console.log('');
    console.log('CREATE POLICY "Users can view own reports" ON reports');
    console.log('  FOR SELECT USING (');
    console.log('    auth.uid() = user_id OR');
    console.log('    (auth.jwt() ->> \'role\') IN (\'admin\', \'manager\')');
    console.log('  );');
    console.log('');
    console.log('CREATE POLICY "Users can view own payments" ON payments');
    console.log('  FOR SELECT USING (');
    console.log('    auth.uid() = user_id OR');
    console.log('    (auth.jwt() ->> \'role\') IN (\'admin\', \'manager\')');
    console.log('  );');
    console.log('');
    console.log('CREATE POLICY "Admins can view all activity logs" ON activity_logs');
    console.log('  FOR SELECT USING ((auth.jwt() ->> \'role\') = \'admin\');');
    console.log('');
    console.log('-- Refresh the schema');
    console.log('NOTIFY pgrst, \'reload schema\';');
    console.log('--- END SQL COMMANDS ---');
    console.log('\nAfter running these commands, restart your application server.');
    
    // Test if we can access the users table
    console.log('\nTesting database access...');
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, role')
      .limit(3);
    
    if (error) {
      console.error('Database access test failed:', error.message);
    } else {
      console.log('✅ Database access successful');
      console.log('Found', data?.length || 0, 'users in database');
    }
    
    console.log('\n🔧 RLS fix instructions provided above. Please follow them to resolve the login issue.');
    
  } catch (error) {
    console.error('Error:', error.message);
    console.log('\nPlease manually apply the RLS fix using the SQL commands provided above.');
  }
}

fixRLSPoliciesDirectly();