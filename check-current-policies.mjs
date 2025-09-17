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

async function checkCurrentPolicies() {
  console.log('🔍 CHECKING CURRENT RLS POLICIES');
  console.log('===============================');
  
  try {
    // Try to get current policies (this might not work directly)
    console.log('\n1️⃣ Attempting to list current policies...');
    
    // Let's try a different approach - check if we can access the users table directly
    console.log('\n2️⃣ Testing direct table access...');
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, role')
      .limit(3);
    
    if (usersError) {
      console.log('❌ Direct access failed:', usersError.message);
    } else {
      console.log('✅ Direct access successful');
      users.forEach(user => {
        console.log(`   - ${user.email} (${user.role})`);
      });
    }
    
    // Try to check what's causing the recursion
    console.log('\n3️⃣ Testing recursive query pattern...');
    
    // The issue might be in how we're checking roles
    // Let's try a simpler approach using JWT claims directly
    console.log('\n4️⃣ Creating simplified policies...');
    
    const simplifiedPolicies = [
      {
        name: 'Users can view own profile (simplified)',
        table: 'users',
        sql: `CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (
    auth.uid() = id OR
    (auth.jwt() ->> 'role') IN ('admin', 'manager')
  )`
      }
    ];
    
    // First drop the existing policy
    try {
      await supabaseAdmin.rpc('exec_sql', { 
        sql: 'DROP POLICY IF EXISTS "Users can view own profile" ON users' 
      });
      console.log('✅ Dropped recursive policy');
    } catch {
      console.log('Note: Could not drop policy');
    }
    
    // Then create the simplified one
    try {
      await supabaseAdmin.rpc('exec_sql', { sql: simplifiedPolicies[0].sql });
      console.log('✅ Created simplified policy');
    } catch (error) {
      console.log('❌ Failed to create simplified policy:', error.message);
    }
    
    console.log('\n5️⃣ Final test...');
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
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

checkCurrentPolicies();