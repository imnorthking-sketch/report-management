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

async function checkAllAuthUsers() {
  console.log('Checking all auth users...');
  
  try {
    // List all auth users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching auth users:', authError.message);
      return;
    }
    
    console.log(`\nFound ${authUsers.users.length} auth users:`);
    authUsers.users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Role: ${user.role || 'no role'}`);
      console.log(`   Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
      console.log(`   Created: ${user.created_at}`);
      console.log(`   Last sign in: ${user.last_sign_in_at || 'Never'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
}

checkAllAuthUsers();