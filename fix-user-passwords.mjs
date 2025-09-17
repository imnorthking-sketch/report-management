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

// Default users with their passwords
const defaultUsers = [
  {
    email: 'manish.epacific@gmail.com',
    password: 'password',
    full_name: 'Manish Admin',
    role: 'admin'
  },
  {
    email: 'manager@company.com',
    password: 'manager123',
    full_name: 'Demo Manager',
    role: 'manager'
  },
  {
    email: 'user@company.com',
    password: 'user123',
    full_name: 'Demo User',
    role: 'user'
  }
];

async function fixUserPasswords() {
  console.log('Fixing user passwords...');
  
  for (const user of defaultUsers) {
    try {
      console.log(`\nProcessing user ${user.email}...`);
      
      // Check if user exists
      const { data: existingUser, error: fetchError } = await supabaseAdmin
        .from('users')
        .select('id, email, full_name, role')
        .eq('email', user.email)
        .single();
      
      if (fetchError) {
        console.error(`Error fetching user ${user.email}:`, fetchError.message);
        continue;
      }
      
      if (!existingUser) {
        console.log(`User ${user.email} does not exist, creating...`);
        
        // Create auth user
        const { data: authUser, error: authError } = await supabaseAdmin.auth.signUp({
          email: user.email,
          password: user.password,
          options: {
            data: {
              full_name: user.full_name,
              role: user.role
            }
          }
        });
        
        if (authError) {
          console.error(`Error creating auth user ${user.email}:`, authError.message);
          continue;
        }
        
        if (!authUser.user) {
          console.error(`No user returned from auth creation for ${user.email}`);
          continue;
        }
        
        console.log(`Auth user created for ${user.email}. Creating user record...`);
        
        // Create user record in our users table
        const { error: userError } = await supabaseAdmin
          .from('users')
          .insert({
            id: authUser.user.id,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            is_active: true,
          })
          .select('id')
          .single();
        
        if (userError) {
          console.error(`Error creating user record for ${user.email}:`, userError.message);
          // Clean up auth user if user creation fails
          await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
          continue;
        }
        
        console.log(`✅ User ${user.email} created successfully!`);
      } else {
        console.log(`User ${user.email} exists. Updating password...`);
        
        // Update the user's password by deleting and recreating
        try {
          // Delete the existing auth user
          await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
          console.log(`Deleted existing auth user for ${user.email}`);
        } catch {
          console.log(`Note: No existing auth user found for ${user.email}, continuing...`);
        }
        
        // Create new auth user with correct password
        const { error: authError } = await supabaseAdmin.auth.signUp({
          email: user.email,
          password: user.password,
          options: {
            data: {
              full_name: user.full_name,
              role: user.role
            }
          }
        });
        
        if (authError) {
          console.error(`Error creating auth user ${user.email}:`, authError.message);
          continue;
        }
        
        console.log(`✅ Password updated for user ${user.email}!`);
      }
    } catch (error) {
      console.error(`Unexpected error processing user ${user.email}:`, error.message);
    }
  }
  
  console.log('\nPassword fixing completed!');
}

fixUserPasswords();