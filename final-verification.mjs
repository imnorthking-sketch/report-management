import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function finalVerification() {
  console.log('🔍 FINAL VERIFICATION OF LOGIN FIX');
  console.log('====================================');
  
  try {
    console.log('\n1️⃣ Testing authentication...');
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: 'manish.epacific@gmail.com',
      password: 'password',
    });
    
    if (authError) {
      console.error('❌ Authentication failed:', authError.message);
      return;
    }
    
    console.log('✅ Authentication successful');
    
    console.log('\n2️⃣ Testing profile fetch (this was failing before)...');
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('id, email, full_name, role')
      .eq('email', 'manish.epacific@gmail.com')
      .single();
    
    if (profileError) {
      console.error('❌ CRITICAL: Profile fetch still failing:', profileError.message);
      if (profileError.message.includes('Cannot coerce the result to a single JSON object')) {
        console.error('🚨 EMERGENCY: The RLS policy fix has NOT been applied!');
        console.error('   Please follow the instructions in EMERGENCY_RLS_FIX.md');
      }
      // Sign out before exiting
      await supabase.auth.signOut();
      return;
    }
    
    console.log('✅ Profile fetch successful!');
    console.log('   User:', profileData.full_name, `(${profileData.role})`);
    
    console.log('\n3️⃣ Testing sign out...');
    await supabase.auth.signOut();
    console.log('✅ Signed out successfully');
    
    console.log('\n🎉 SUCCESS: Login issue has been resolved!');
    console.log('   ✅ Authentication works');
    console.log('   ✅ Profile fetching works');
    console.log('   ✅ Complete login flow works');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

finalVerification();