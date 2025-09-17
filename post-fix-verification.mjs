import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function postFixVerification() {
  console.log('Post-Fix Verification Test');
  console.log('========================\n');
  
  // Test users
  const testUsers = [
    { email: 'manish.epacific@gmail.com', password: 'password', role: 'admin' },
    { email: 'manager@epacific.com', password: 'manager123', role: 'manager' },
    { email: 'user@epacific.com', password: 'user123', role: 'user' }
  ];
  
  for (const user of testUsers) {
    console.log(`Testing ${user.role} (${user.email})...`);
    
    try {
      // Create a new client for testing
      const testClient = createClient(supabaseUrl, supabaseAnonKey);
      
      // Attempt login
      const { error: signInError } = await testClient.auth.signInWithPassword({
        email: user.email,
        password: user.password,
      });
      
      if (signInError) {
        console.log(`❌ Login failed: ${signInError.message}`);
        continue;
      }
      
      console.log('✅ Login successful!');
      
      // Fetch user profile (this was failing before the fix)
      const { data: profile, error: profileError } = await testClient
        .from('users')
        .select('id, email, full_name, role, is_active')
        .eq('email', user.email)
        .single();
      
      if (profileError) {
        console.log(`❌ Profile fetch failed: ${profileError.message}`);
      } else {
        console.log('✅ Profile fetch successful!');
        console.log(`   ID: ${profile.id}`);
        console.log(`   Name: ${profile.full_name}`);
        console.log(`   Role: ${profile.role}`);
        console.log(`   Active: ${profile.is_active}`);
      }
      
      // Sign out
      await testClient.auth.signOut();
      console.log('✅ Signed out successfully\n');
      
    } catch (error) {
      console.log(`❌ Unexpected error: ${error.message}\n`);
    }
  }
  
  console.log('Verification complete!');
  console.log('\nIf all tests passed, the RLS policy fix was successful.');
  console.log('The "User profile not found or inactive" error should now be resolved.');
}

postFixVerification();