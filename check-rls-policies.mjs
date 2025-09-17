import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkRLSPolicies() {
  console.log('Checking RLS policies...');
  
  try {
    // Check if RLS is enabled on users table
    const { data: usersRLS, error: usersRLSError } = await supabaseAdmin
      .from('pg_tables')
      .select('*')
      .eq('tablename', 'users')
      .single();
    
    if (usersRLSError) {
      console.log('Error checking users RLS:', usersRLSError.message);
    } else {
      console.log('Users table RLS status:', usersRLS);
    }
    
    // Try to query users table directly to see if there's an issue
    console.log('Testing direct query to users table...');
    const { data: usersData, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.log('Error querying users table:', usersError.message);
      console.log('Error code:', usersError.code);
    } else {
      console.log('Users table query successful, found', usersData.length, 'records');
    }
    
    console.log('\nRLS policies check completed!');
    
  } catch (error) {
    console.error('Unexpected error checking RLS policies:', error.message);
  }
}

checkRLSPolicies();