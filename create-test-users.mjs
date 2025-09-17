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

// Default users with valid email formats and bcrypt hashed passwords
const defaultUsers = [
  {
    email: 'admin@example.com',
    password: 'admin123',
    full_name: 'System Administrator',
    role: 'admin'
  },
  {
    email: 'manager@example.com',
    password: 'manager123',
    full_name: 'Demo Manager',
    role: 'manager'
  },
  {
    email: 'user@example.com',
    password: 'user123',
    full_name: 'Demo User',
    role: 'user'
  }
];

async function createTestUsers() {
  console.log('Creating test users with proper credentials...');
  
  // Hash the passwords
  const saltRounds = 10;
  
  for (const user of defaultUsers) {
    try {
      console.log(`\nProcessing ${user.role} (${user.email})...`);
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(user.password, saltRounds);
      
      // Check if user already exists
      const { data: existingUser, error: fetchError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single();
      
      if (existingUser) {
        console.log(`User ${user.email} already exists, updating...`);
        
        // Update the user's information
        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update({
            full_name: user.full_name,
            role: user.role,
            password_hash: hashedPassword,
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingUser.id);
        
        if (updateError) {
          console.error(`Error updating user ${user.email}:`, updateError.message);
          continue;
        }
        
        console.log(`Updated user ${user.email} in database`);
      } else {
        console.log(`Creating user ${user.email}...`);
        
        // Create user in database with hashed password
        const { error: insertError } = await supabaseAdmin
          .from('users')
          .insert({
            email: user.email,
            password_hash: hashedPassword,
            full_name: user.full_name,
            role: user.role,
            is_active: true,
          });
        
        if (insertError) {
          console.error(`Error creating user ${user.email}:`, insertError.message);
          continue;
        }
        
        console.log(`Created user ${user.email} in database`);
      }
      
      // Ensure auth user exists
      try {
        // Delete any existing auth user with this email
        const { data: existingAuthUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (!listError) {
          const existingAuthUser = existingAuthUsers.users.find(u => u.email === user.email);
          if (existingAuthUser) {
            await supabaseAdmin.auth.admin.deleteUser(existingAuthUser.id);
            console.log(`Deleted existing auth user for ${user.email}`);
          }
        }
        
        // Create new auth user
        const { error: signUpError } = await supabaseAdmin.auth.signUp({
          email: user.email,
          password: user.password,
          options: {
            data: {
              full_name: user.full_name,
              role: user.role
            }
          }
        });
        
        if (signUpError && !signUpError.message.includes('already registered')) {
          console.error(`Error creating auth user for ${user.email}:`, signUpError.message);
        } else {
          console.log(`Auth user for ${user.email} is ready`);
        }
      } catch (authError) {
        if (!authError.message.includes('already registered')) {
          console.error(`Error with auth for ${user.email}:`, authError.message);
        } else {
          console.log(`Auth user for ${user.email} already exists`);
        }
      }
      
      console.log(`✅ ${user.role} user ${user.email} is ready!`);
      
    } catch (error) {
      console.error(`Unexpected error processing ${user.email}:`, error.message);
    }
  }
  
  console.log('\nTest users creation completed!');
  
  // Test the new credentials
  console.log('\nTesting login with new credentials...');
  for (const user of defaultUsers) {
    try {
      console.log(`\nTesting ${user.role} login (${user.email})...`);
      
      const { error } = await supabaseAdmin.auth.signInWithPassword({
        email: user.email,
        password: user.password,
      });
      
      if (error) {
        console.error(`❌ ${user.role} login failed:`, error.message);
      } else {
        console.log(`✅ ${user.role} login successful!`);
        // Sign out
        await supabaseAdmin.auth.signOut();
      }
    } catch (error) {
      console.error(`❌ ${user.role} login failed:`, error.message);
    }
  }
  
  console.log('\n✅ All test users are ready for use!');
  console.log('\nUse these credentials to log in:');
  defaultUsers.forEach(user => {
    console.log(`  ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}: ${user.email} / ${user.password}`);
  });
}

createTestUsers();