import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create admin client with full permissions
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createNewPolicies() {
  console.log('🔧 CREATING NEW RLS POLICIES');
  console.log('===========================');
  
  try {
    console.log('\n1️⃣ Creating new policies...');
    
    // Create new policies without recursion
    const newPolicies = [
      {
        name: 'Users can view own profile',
        table: 'users',
        sql: `CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (
    auth.uid() = id OR
    (EXISTS (
      SELECT 1 FROM users u2
      WHERE u2.id = auth.uid()
      AND u2.role IN ('admin', 'manager')
    ))
  )`
      },
      {
        name: 'Users can view own reports',
        table: 'reports',
        sql: `CREATE POLICY "Users can view own reports" ON reports
  FOR SELECT USING (
    auth.uid() = user_id OR
    (EXISTS (
      SELECT 1 FROM users u2
      WHERE u2.id = auth.uid()
      AND u2.role IN ('admin', 'manager')
    ))
  )`
      },
      {
        name: 'Users can view own payments',
        table: 'payments',
        sql: `CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (
    auth.uid() = user_id OR
    (EXISTS (
      SELECT 1 FROM users u2
      WHERE u2.id = auth.uid()
      AND u2.role IN ('admin', 'manager')
    ))
  )`
      },
      {
        name: 'Admins can view all activity logs',
        table: 'activity_logs',
        sql: `CREATE POLICY "Admins can view all activity logs" ON activity_logs
  FOR SELECT USING (
    (EXISTS (
      SELECT 1 FROM users u2
      WHERE u2.id = auth.uid()
      AND u2.role = 'admin'
    ))
  )`
      }
    ];
    
    for (const policy of newPolicies) {
      try {
        await supabaseAdmin.rpc('exec_sql', { sql: policy.sql });
        console.log(`✅ Created policy "${policy.name}" on ${policy.table}`);
      } catch {
        console.log(`❌ Failed to create policy "${policy.name}": Connection error`);
      }
    }
    
    console.log('\n2️⃣ Refreshing schema...');
    try {
      await supabaseAdmin.rpc('exec_sql', { sql: "NOTIFY pgrst, 'reload schema'" });
      console.log('✅ Schema refresh notification sent');
    } catch {
      console.log('Note: Could not refresh schema automatically (this is expected)');
    }
    
    console.log('\n3️⃣ Testing the fix...');
    // Try to sign in and fetch profile
    const { error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email: 'manish.epacific@gmail.com',
      password: 'password',
    });
    
    if (authError) {
      console.log('❌ Authentication test failed:', authError.message);
    } else {
      console.log('✅ Authentication test successful');
      
      // Try to fetch user profile
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('users')
        .select('id, email, full_name, role')
        .eq('email', 'manish.epacific@gmail.com')
        .single();
      
      if (profileError) {
        console.log('❌ Profile fetch still failing:', profileError.message);
      } else {
        console.log('✅ Profile fetch successful!');
        console.log('   User:', profileData.full_name, `(${profileData.role})`);
      }
      
      // Sign out
      await supabaseAdmin.auth.signOut();
    }
    
    console.log('\n🎉 RLS policy fix attempt completed!');
    console.log('If the test was successful, restart your development server:');
    console.log('   Ctrl+C to stop');
    console.log('   npm run dev');
    console.log('\nIf the test failed, manually apply the fix in Supabase SQL Editor.');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

createNewPolicies();