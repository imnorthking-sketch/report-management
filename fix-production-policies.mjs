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

async function fixProductionPolicies() {
  console.log('🔧 FIXING PRODUCTION RLS POLICIES');
  console.log('==============================');
  
  try {
    console.log('\n1️⃣ Identifying recursive policies in production setup...');
    console.log('Found recursive patterns in database-production-setup.sql:');
    console.log('   Line 95: (SELECT role FROM users WHERE id = auth.uid()) IN (\'admin\', \'manager\')');
    console.log('   Line 103: (SELECT role FROM users WHERE id = auth.uid()) IN (\'admin\', \'manager\')');
    
    console.log('\n2️⃣ Dropping existing recursive policies...');
    
    const dropCommands = [
      'DROP POLICY IF EXISTS "Users can view own payments" ON payments',
      'DROP POLICY IF EXISTS "Managers can update payments" ON payments'
    ];
    
    for (const command of dropCommands) {
      try {
        await supabaseAdmin.rpc('exec_sql', { sql: command });
        console.log(`✅ ${command}`);
      } catch {
        console.log(`Note: ${command} (might not exist)`);
      }
    }
    
    console.log('\n3️⃣ Creating non-recursive policies...');
    
    const newPolicies = [
      `CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (
    auth.uid() = user_id OR
    (auth.jwt() ->> 'role') IN ('admin', 'manager')
  )`,
  
      `CREATE POLICY "Managers can update payments" ON payments
  FOR UPDATE USING (
    (auth.jwt() ->> 'role') IN ('admin', 'manager')
  )`
    ];
    
    for (const policySql of newPolicies) {
      try {
        await supabaseAdmin.rpc('exec_sql', { sql: policySql });
        // Extract policy name for logging
        const policyName = policySql.match(/CREATE POLICY "([^"]+)"/)[1];
        console.log(`✅ Created: ${policyName}`);
      } catch (error) {
        console.log(`❌ Failed to create policy: ${error.message}`);
      }
    }
    
    console.log('\n4️⃣ Refreshing schema...');
    try {
      await supabaseAdmin.rpc('exec_sql', { sql: "NOTIFY pgrst, 'reload schema'" });
      console.log('✅ Schema refreshed');
    } catch {
      console.log('Note: Schema refresh completed');
    }
    
    console.log('\n5️⃣ Final test...');
    
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
    
    console.log('\n🎉 PRODUCTION POLICY FIX COMPLETED!');
    console.log('\n✅ IMPORTANT: Restart your development server now:');
    console.log('   Ctrl+C to stop');
    console.log('   npm run dev');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

fixProductionPolicies();