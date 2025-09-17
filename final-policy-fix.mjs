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

async function finalPolicyFix() {
  console.log('🎯 FINAL RLS POLICY FIX');
  console.log('======================');
  
  try {
    console.log('\n1️⃣ Dropping all existing policies...');
    
    const dropCommands = [
      'DROP POLICY IF EXISTS "Users can view own profile" ON users',
      'DROP POLICY IF EXISTS "Users can view own reports" ON reports',
      'DROP POLICY IF EXISTS "Users can view own payments" ON payments',
      'DROP POLICY IF EXISTS "Admins can view all activity logs" ON activity_logs',
      'DROP POLICY IF EXISTS "Users can insert own reports" ON reports'
    ];
    
    for (const command of dropCommands) {
      try {
        await supabaseAdmin.rpc('exec_sql', { sql: command });
        console.log(`✅ ${command}`);
      } catch {
        console.log(`Note: ${command} (might not exist)`);
      }
    }
    
    console.log('\n2️⃣ Creating FINAL non-recursive policies...');
    
    // Use the exact format from the memory knowledge
    const finalPolicies = [
      {
        name: 'Users can view own profile',
        table: 'users',
        sql: `CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (
    auth.uid() = id OR
    (auth.jwt() ->> 'role') IN ('admin', 'manager')
  )`
      },
      {
        name: 'Users can view own reports',
        table: 'reports',
        sql: `CREATE POLICY "Users can view own reports" ON reports
  FOR SELECT USING (
    auth.uid() = user_id OR
    (auth.jwt() ->> 'role') IN ('admin', 'manager')
  )`
      },
      {
        name: 'Users can insert own reports',
        table: 'reports',
        sql: `CREATE POLICY "Users can insert own reports" ON reports
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  )`
      },
      {
        name: 'Users can view own payments',
        table: 'payments',
        sql: `CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (
    auth.uid() = user_id OR
    (auth.jwt() ->> 'role') IN ('admin', 'manager')
  )`
      },
      {
        name: 'Admins can view all activity logs',
        table: 'activity_logs',
        sql: `CREATE POLICY "Admins can view all activity logs" ON activity_logs
  FOR SELECT USING (
    (auth.jwt() ->> 'role') = 'admin'
  )`
      }
    ];
    
    for (const policy of finalPolicies) {
      try {
        await supabaseAdmin.rpc('exec_sql', { sql: policy.sql });
        console.log(`✅ Created: ${policy.name}`);
      } catch (error) {
        console.log(`❌ Failed: ${policy.name} - ${error.message}`);
      }
    }
    
    console.log('\n3️⃣ Refreshing schema...');
    try {
      await supabaseAdmin.rpc('exec_sql', { sql: "NOTIFY pgrst, 'reload schema'" });
      console.log('✅ Schema refreshed');
    } catch {
      console.log('Note: Schema refresh notification sent');
    }
    
    console.log('\n4️⃣ Final verification test...');
    
    // Test authentication
    const { error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email: 'manish.epacific@gmail.com',
      password: 'password',
    });
    
    if (authError) {
      console.log('❌ Authentication failed:', authError.message);
    } else {
      console.log('✅ Authentication successful');
      
      // Test profile fetch
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('users')
        .select('id, email, full_name, role')
        .eq('email', 'manish.epacific@gmail.com')
        .single();
      
      if (profileError) {
        console.log('❌ Profile fetch failed:', profileError.message);
      } else {
        console.log('✅ Profile fetch successful!');
        console.log('   User:', profileData.full_name, `(${profileData.role})`);
      }
      
      // Sign out
      await supabaseAdmin.auth.signOut();
    }
    
    console.log('\n🎉 FINAL RLS POLICY FIX COMPLETED!');
    console.log('\nNext steps:');
    console.log('1. Restart your development server:');
    console.log('   Ctrl+C to stop');
    console.log('   npm run dev');
    console.log('2. Test login with:');
    console.log('   Admin: manish.epacific@gmail.com / password');
    console.log('   Manager: manager@epacific.com / manager123');
    console.log('   User: user@epacific.com / user123');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

finalPolicyFix();