import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import bcrypt from 'bcryptjs';

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

// Required users to create
const requiredUsers = [
  {
    email: 'manager@epacific.com',
    password: 'manager123',
    full_name: 'Demo Manager',
    role: 'manager'
  },
  {
    email: 'user@epacific.com',
    password: 'user123',
    full_name: 'Demo User',
    role: 'user'
  }
];

async function setupAuthUsers() {
  console.log('Setting up auth users...');
  
  // Generate a default password hash for the database
  const defaultPasswordHash = await bcrypt.hash('default', 10);
  
  for (const user of requiredUsers) {
    try {
      console.log(`\nProcessing ${user.role} (${user.email})...`);
      
      // Check if user already exists in auth
      const { data: existingAuthUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (listError) {
        console.error(`Error listing auth users:`, listError.message);
        continue;
      }
      
      const existingAuthUser = existingAuthUsers.users.find(u => u.email === user.email);
      
      if (existingAuthUser) {
        console.log(`Auth user ${user.email} already exists, deleting...`);
        // Delete existing auth user
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(existingAuthUser.id);
        
        if (deleteError) {
          console.error(`Error deleting auth user ${user.email}:`, deleteError.message);
          continue;
        }
        
        console.log(`Deleted existing auth user ${user.email}`);
      }
      
      // Create auth user
      console.log(`Creating auth user for ${user.email}...`);
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
      
      console.log(`Auth user created for ${user.email}`);
      
      // Check if user exists in users table
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single();
      
      if (existingUser) {
        console.log(`User ${user.email} exists in users table, updating...`);
        
        // Update the user's information
        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update({
            full_name: user.full_name,
            role: user.role,
            is_active: true,
            password_hash: defaultPasswordHash, // Required but not used
            updated_at: new Date().toISOString()
          })
          .eq('id', existingUser.id);
        
        if (updateError) {
          console.error(`Error updating user ${user.email}:`, updateError.message);
          continue;
        }
        
        console.log(`Updated user ${user.email} in database`);
      } else {
        console.log(`Creating user ${user.email} in users table...`);
        
        // Create user in database
        const { error: insertError } = await supabaseAdmin
          .from('users')
          .insert({
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            is_active: true,
            password_hash: defaultPasswordHash // Required but not used
          });
        
        if (insertError) {
          console.error(`Error creating user ${user.email}:`, insertError.message);
          continue;
        }
        
        console.log(`Created user ${user.email} in database`);
      }
      
      console.log(`✅ ${user.role} user ${user.email} is ready!`);
      
    } catch (error) {
      console.error(`Unexpected error processing ${user.email}:`, error.message);
    }
  }
  
  console.log('\nUser setup completed!');
  
  // Test the credentials
  console.log('\nTesting login with credentials...');
  for (const user of requiredUsers) {
    try {
      console.log(`\nTesting ${user.role} login (${user.email})...`);
      
      // Create a new client for testing (with anon key)
      const testClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
      
      const { error } = await testClient.auth.signInWithPassword({
        email: user.email,
        password: user.password,
      });
      
      if (error) {
        console.error(`❌ ${user.role} login failed:`, error.message);
      } else {
        console.log(`✅ ${user.role} login successful!`);
        // Sign out
        await testClient.auth.signOut();
      }
    } catch (error) {
      console.error(`❌ ${user.role} login failed:`, error.message);
    }
  }
  
  console.log('\n✅ All auth users are ready for use!');
  console.log('\nUse these credentials to log in:');
  requiredUsers.forEach(user => {
    console.log(`  ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}: ${user.email} / ${user.password}`);
  });
}

setupAuthUsers();