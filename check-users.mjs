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

async function checkUsers() {
  console.log('Checking users in database...');
  
  try {
    // List all users in the users table
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching users:', error.message);
      return;
    }
    
    console.log('\nUsers in database:');
    users.forEach(user => {
      console.log(`- ${user.email} (${user.role}) - Active: ${user.is_active}`);
    });
    
    // List all auth users
    console.log('\nAuth users:');
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching auth users:', authError.message);
      return;
    }
    
    authUsers.users.forEach(user => {
      console.log(`- ${user.email} (${user.role || 'no role'}) - Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
    });
    
  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
}

checkUsers();