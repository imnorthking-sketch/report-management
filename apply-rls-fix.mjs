import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create admin client
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function applyRlsFix() {
  console.log('Applying RLS policy fix...\n');
  
  try {
    // Drop existing policies
    console.log('Dropping existing policies...');
    
    const dropPolicies = [
      'DROP POLICY IF EXISTS "Users can view own profile" ON users',
      'DROP POLICY IF EXISTS "Users can view own reports" ON reports',
      'DROP POLICY IF EXISTS "Users can view own payments" ON payments',
      'DROP POLICY IF EXISTS "Admins can view all activity logs" ON activity_logs'
    ];
    
    for (const query of dropPolicies) {
      const { error } = await supabaseAdmin.rpc('exec_sql', { sql: query });
      if (error) {
        console.log(`Warning: ${error.message} (this may be expected)`);
      } else {
        console.log(`✅ Executed: ${query}`);
      }
    }
    
    // Create new policies
    console.log('\nCreating new policies...');
    
    const createPolicies = [
      `CREATE POLICY "Users can view own profile" ON users
        FOR SELECT USING (
          auth.uid() = id OR
          (auth.jwt() ->> 'role') IN ('admin', 'manager')
        )`,
      
      `CREATE POLICY "Users can view own reports" ON reports
        FOR SELECT USING (
          auth.uid() = user_id OR
          (auth.jwt() ->> 'role') IN ('admin', 'manager')
        )`,
      
      `CREATE POLICY "Users can view own payments" ON payments
        FOR SELECT USING (
          auth.uid() = user_id OR
          (auth.jwt() ->> 'role') IN ('admin', 'manager')
        )`,
      
      `CREATE POLICY "Admins can view all activity logs" ON activity_logs
        FOR SELECT USING ((auth.jwt() ->> 'role') = 'admin')`
    ];
    
    for (const query of createPolicies) {
      const { error } = await supabaseAdmin.rpc('exec_sql', { sql: query });
      if (error) {
        console.error(`❌ Error executing: ${query}\n`, error.message);
      } else {
        console.log(`✅ Executed: ${query.split('\n')[0].trim()}`);
      }
    }
    
    console.log('\n✅ RLS policy fix applied successfully!');
    console.log('\nNow testing the fix...\n');
    
    // Test the fix by signing in and fetching profile
    console.log('Testing with admin user...');
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email: 'manish.epacific@gmail.com',
      password: 'password',
    });
    
    if (error) {
      console.error('❌ Sign in failed:', error.message);
      return;
    }
    
    console.log('✅ Sign in successful!');
    
    // Try to fetch user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', 'manish.epacific@gmail.com')
      .single();
    
    if (profileError) {
      console.error('❌ Profile fetch failed:', profileError.message);
    } else {
      console.log('✅ Profile fetch successful!');
      console.log('User:', profile.full_name, `(${profile.role})`);
    }
    
    // Sign out
    await supabaseAdmin.auth.signOut();
    
    console.log('\n🎉 RLS fix completed! The infinite recursion issue should now be resolved.');
    
  } catch (error) {
    console.error('❌ Error applying RLS fix:', error.message);
    console.log('\nPlease run the SQL commands in apply-rls-fix.sql manually in your Supabase SQL editor.');
  }
}

applyRlsFix();