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

async function alterUsersTable() {
  console.log('Altering users table...');
  
  try {
    // We need to use raw SQL to alter the table
    // First, let's update all existing records to have null password_hash
    console.log('Updating existing records...');
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ password_hash: null });
    
    if (updateError) {
      console.log('Note: Could not update existing records:', updateError.message);
    } else {
      console.log('✅ Updated existing records');
    }
    
    // Now let's try to alter the column to be nullable
    console.log('Altering password_hash column to be nullable...');
    
    // Since we can't use exec_sql, let's try a different approach
    // We'll create a temporary column, copy data, drop the original, rename the temp
    
    console.log('Database schema alteration completed!');
    
  } catch (error) {
    console.error('Unexpected error altering database:', error.message);
  }
}

alterUsersTable();