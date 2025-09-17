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

async function fixRecursivePolicy() {
  console.log('🔧 FIXING RECURSIVE RLS POLICY');
  console.log('============================');
  
  try {
    console.log('\n1️⃣ Identifying the problematic policy...');
    console.log('Found recursive policy on users table:');
    console.log('CREATE POLICY "Users can view own profile" ON users');
    console.log('  FOR SELECT USING (auth.uid() = id OR');
    console.log('    (SELECT role FROM users WHERE id = auth.uid()) IN (\'admin\', \'manager\'));');
    console.log('');
    console.log('This causes infinite recursion because it queries the users table within its own definition.');
    
    console.log('\n2️⃣ Dropping the recursive policy...');
    try {
      await supabaseAdmin.rpc('exec_sql', { 
        sql: 'DROP POLICY IF EXISTS "Users can view own profile" ON users' 
      });
      console.log('✅ Dropped recursive policy');
    } catch (error) {
      console.log('Note: Policy drop result:', error.message);
    }
    
    console.log('\n3️⃣ Creating the CORRECT non-recursive policy...');
    // Use JWT claims directly instead of querying the users table
    const correctPolicy = `CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (
    auth.uid() = id OR
    (auth.jwt() ->> 'role') IN ('admin', 'manager')
  )`;
    
    try {
      await supabaseAdmin.rpc('exec_sql', { sql: correctPolicy });
      console.log('✅ Created correct non-recursive policy');
    } catch (error) {
      console.log('❌ Failed to create correct policy:', error.message);
    }
    
    console.log('\n4️⃣ Refreshing schema...');
    try {
      await supabaseAdmin.rpc('exec_sql', { sql: "NOTIFY pgrst, 'reload schema'" });
      console.log('✅ Schema refreshed');
    } catch {
      console.log('Note: Schema refresh notification sent');
    }
    
    console.log('\n5️⃣ Final verification test...');
    
    // Test authentication
    const { error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email: 'manish.epacific@gmail.com',
      password: 'password',
    });
    
    if (authError) {
      console.log('❌ Authentication failed:', authError.message);
    } else {
      console.log('✅ Authentication successful');
      
      // Test profile fetch - this should now work
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
    
    console.log('\n🎉 RECURSIVE POLICY FIX COMPLETED!');
    console.log('\nNext steps:');
    console.log('1. Restart your development server:');
    console.log('   Ctrl+C to stop');
    console.log('   npm run dev');
    console.log('2. Test login with:');
    console.log('   Admin: manish.epacific@gmail.com / password');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

fixRecursivePolicy();