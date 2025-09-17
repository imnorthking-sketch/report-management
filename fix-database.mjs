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

async function fixDatabase() {
  console.log('Fixing database...');
  
  try {
    // First, let's check the current structure of the users table
    console.log('Checking users table structure...');
    
    // Try to update existing users to have null password_hash
    console.log('Updating existing users to have null password_hash...');
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ password_hash: null })
      .neq('password_hash', null);
    
    if (updateError) {
      console.log('Note: Could not update password_hash values:', updateError.message);
    } else {
      console.log('✅ Updated existing users to have null password_hash');
    }
    
    // Now let's manually set the password_hash to null for our specific users
    const userEmails = ['manager@epacific.com', 'user@epacific.com'];
    
    for (const email of userEmails) {
      console.log(`Setting password_hash to null for ${email}...`);
      const { error } = await supabaseAdmin
        .from('users')
        .update({ password_hash: null })
        .eq('email', email);
      
      if (error) {
        console.log(`Note: Could not update password_hash for ${email}:`, error.message);
      } else {
        console.log(`✅ Updated password_hash for ${email}`);
      }
    }
    
    console.log('Database fix completed!');
    
  } catch (error) {
    console.error('Unexpected error fixing database:', error.message);
  }
}

fixDatabase();