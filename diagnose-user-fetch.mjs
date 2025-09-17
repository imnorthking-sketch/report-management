import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnoseUserFetch() {
  console.log('Diagnosing user fetch issue...\n');
  
  try {
    // Test 1: Check if we can fetch a specific user with admin client
    console.log('Test 1: Fetching admin user with admin client...');
    const { data: adminUsers, error: adminError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', 'manish.epacific@gmail.com');
    
    if (adminError) {
      console.error('❌ Admin client error:', adminError.message);
    } else {
      console.log('✅ Admin client success:');
      console.log('  Found', adminUsers.length, 'users');
      if (adminUsers.length > 0) {
        console.log('  First user:', adminUsers[0].email, `(${adminUsers[0].role})`);
      }
    }
    
    // Test 2: Check if there are duplicate emails
    console.log('\nTest 2: Checking for duplicate emails...');
    try {
      await supabaseAdmin
        .from('users')
        .select('email, count(*)')
        .group('email')
        .gt('count', 1);
    } catch {
      console.log('Note: Group query not supported, checking duplicates manually...');
      const { data: userEmails, error: emailsError } = await supabaseAdmin
        .from('users')
        .select('email');
      
      if (!emailsError) {
        const emailCounts = userEmails.reduce((acc, user) => {
          acc[user.email] = (acc[user.email] || 0) + 1;
          return acc;
        }, {});
        
        const duplicates = Object.entries(emailCounts)
          .filter(([, count]) => count > 1);
        
        if (duplicates.length > 0) {
          console.log('⚠️  Found duplicate emails:');
          duplicates.forEach(([email, count]) => {
            console.log(`  ${email}: ${count} entries`);
          });
        } else {
          console.log('✅ No duplicate emails found');
        }
      }
    }
    
    // Test 3: Try fetching with single() on a known unique email
    console.log('\nTest 3: Testing single() fetch on unique email...');
    const { error: singleError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', 'nonexistent@email.com')
      .single();
    
    if (singleError) {
      console.log('Expected error for nonexistent user:', singleError.message);
    }
    
    // Test 4: Check the structure of a specific user record
    console.log('\nTest 4: Examining user record structure...');
    const { data: userDetails, error: userDetailsError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', 'manish.epacific@gmail.com')
      .limit(1);
    
    if (userDetailsError) {
      console.error('❌ User details error:', userDetailsError.message);
    } else if (userDetails && userDetails.length > 0) {
      console.log('✅ User record structure:');
      Object.keys(userDetails[0]).forEach(key => {
        console.log(`  ${key}: ${typeof userDetails[0][key]} = ${JSON.stringify(userDetails[0][key]).substring(0, 50)}...`);
      });
    } else {
      console.log('❌ No user found for detailed examination');
    }
    
    // Test 5: Try auth-based fetch after sign in
    console.log('\nTest 5: Testing auth-based fetch...');
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: 'manish.epacific@gmail.com',
      password: 'password',
    });
    
    if (authError) {
      console.error('❌ Auth error:', authError.message);
    } else {
      console.log('✅ Auth successful');
      
      // Now try to fetch the user profile
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'manish.epacific@gmail.com')
        .single();
      
      if (profileError) {
        console.error('❌ Profile fetch error:', profileError.message);
      } else {
        console.log('✅ Profile fetch success:', profileData.email, `(${profileData.role})`);
      }
      
      // Sign out
      await supabase.auth.signOut();
    }
    
  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
}

diagnoseUserFetch();