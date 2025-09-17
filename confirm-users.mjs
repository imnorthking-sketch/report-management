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

async function confirmUsers() {
  console.log('Confirming users...');
  
  try {
    // List all auth users
    const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing auth users:', listError.message);
      return;
    }
    
    const usersToConfirm = ['manager@epacific.com', 'user@epacific.com'];
    
    for (const email of usersToConfirm) {
      const user = authUsers.users.find(u => u.email === email);
      
      if (user) {
        if (user.email_confirmed_at) {
          console.log(`User ${email} is already confirmed`);
        } else {
          console.log(`Confirming user ${email}...`);
          
          // Update user to confirm email
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            user.id,
            { email_confirm: true }
          );
          
          if (updateError) {
            console.error(`Error confirming user ${email}:`, updateError.message);
          } else {
            console.log(`✅ User ${email} confirmed`);
          }
        }
      } else {
        console.log(`User ${email} not found in auth system`);
      }
    }
    
    console.log('User confirmation completed!');
    
  } catch (error) {
    console.error('Unexpected error confirming users:', error.message);
  }
}

confirmUsers();