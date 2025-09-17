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

async function diagnoseDeep() {
  console.log('🔍 DEEP DIAGNOSIS OF RLS ISSUE');
  console.log('============================');
  
  try {
    console.log('\n1️⃣ Checking if the issue is with the policy definition...');
    
    // Let's try to access the users table without any policies
    console.log('\n2️⃣ Temporarily disabling RLS on users table...');
    try {
      await supabaseAdmin.rpc('exec_sql', { 
        sql: 'ALTER TABLE users DISABLE ROW LEVEL SECURITY' 
      });
      console.log('✅ RLS disabled on users table');
    } catch (error) {
      console.log('Note: Could not disable RLS:', error.message);
    }
    
    // Test direct access
    console.log('\n3️⃣ Testing direct access without RLS...');
    const { data: directData, error: directError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, role')
      .eq('email', 'manish.epacific@gmail.com')
      .single();
    
    if (directError) {
      console.log('❌ Direct access failed:', directError.message);
    } else {
      console.log('✅ Direct access successful!');
      console.log('   User:', directData.full_name, `(${directData.role})`);
    }
    
    // Re-enable RLS
    console.log('\n4️⃣ Re-enabling RLS on users table...');
    try {
      await supabaseAdmin.rpc('exec_sql', { 
        sql: 'ALTER TABLE users ENABLE ROW LEVEL SECURITY' 
      });
      console.log('✅ RLS re-enabled on users table');
    } catch (error) {
      console.log('Note: Could not re-enable RLS:', error.message);
    }
    
    console.log('\n5️⃣ Checking for any functions that might cause recursion...');
    
    // Check if there are any functions that reference the users table
    const { data: functions, error: functionsError } = await supabaseAdmin
      .from('pg_proc')
      .select('proname, prosrc')
      .ilike('proname', '%user%');
    
    if (functionsError) {
      console.log('Note: Could not check functions:', functionsError.message);
    } else {
      console.log(`Found ${functions.length} functions with 'user' in name:`);
      functions.forEach(func => {
        if (func.prosrc && func.prosrc.includes('users')) {
          console.log(`   - ${func.proname} (references users table)`);
        }
      });
    }
    
    console.log('\n6️⃣ Final attempt with minimal policy...');
    
    // Drop all policies again
    try {
      await supabaseAdmin.rpc('exec_sql', { 
        sql: 'DROP POLICY IF EXISTS "Users can view own profile" ON users' 
      });
    } catch {}
    
    // Create a very simple policy
    const simplePolicy = `CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id)`;
    
    try {
      await supabaseAdmin.rpc('exec_sql', { sql: simplePolicy });
      console.log('✅ Created minimal policy (only own user access)');
    } catch (error) {
      console.log('❌ Failed to create minimal policy:', error.message);
    }
    
    console.log('\n7️⃣ Final test with minimal policy...');
    
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
        console.log('The issue persists even with minimal policy.');
        console.log('This suggests the problem might be deeper in the database schema.');
      } else {
        console.log('✅ Profile fetch successful with minimal policy!');
        console.log('   User:', profileData.full_name, `(${profileData.role})`);
      }
      
      // Sign out
      await supabaseAdmin.auth.signOut();
    }
    
    console.log('\n🔍 DEEP DIAGNOSIS COMPLETE');
    console.log('========================');
    
    if (directError && !profileError) {
      console.log('💡 INSIGHT: Direct access works but RLS fails');
      console.log('   This confirms the issue is with RLS policy definition');
    } else if (profileError) {
      console.log('⚠️  ISSUE: Even minimal policy fails');
      console.log('   The problem might be in database functions or triggers');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

diagnoseDeep();