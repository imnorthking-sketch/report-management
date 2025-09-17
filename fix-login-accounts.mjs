import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test credentials that should work
const testCredentials = [
  {
    email: 'manish.epacific@gmail.com',
    password: 'password',
    role: 'admin'
  },
  {
    email: 'manager@epacific.com',
    password: 'manager123',
    role: 'manager'
  },
  {
    email: 'user@epacific.com',
    password: 'user123',
    role: 'user'
  }
];

async function fixLoginAccounts() {
  console.log('Fixing login accounts...');
  
  // First, let's test if the accounts work
  console.log('\nTesting current accounts...');
  
  for (const credential of testCredentials) {
    try {
      console.log(`\nTesting ${credential.role} login (${credential.email})...`);
      
      // Create a new client for testing
      const testClient = createClient(supabaseUrl, supabaseAnonKey);
      
      const { data, error } = await testClient.auth.signInWithPassword({
        email: credential.email,
        password: credential.password,
      });
      
      if (error) {
        console.error(`❌ ${credential.role} login failed:`, error.message);
        
        // If login fails, let's try to create/update the user
        console.log(`Attempting to fix ${credential.role} account...`);
        await fixUserAccount(credential);
      } else {
        console.log(`✅ ${credential.role} login successful!`);
        console.log(`User ID: ${data.user.id}`);
        
        // Sign out for next test
        await testClient.auth.signOut();
      }
    } catch (error) {
      console.error(`❌ ${credential.role} login failed:`, error.message);
    }
  }
  
  console.log('\nLogin account fixing completed!');
}

async function fixUserAccount(credential) {
  try {
    // Check if user exists in auth
    const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error(`Error listing auth users:`, listError.message);
      return;
    }
    
    const existingAuthUser = authUsers.users.find(u => u.email === credential.email);
    
    if (existingAuthUser) {
      console.log(`Auth user ${credential.email} exists, updating password...`);
      // Update password
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingAuthUser.id,
        { password: credential.password }
      );
      
      if (updateError) {
        console.error(`Error updating auth user password for ${credential.email}:`, updateError.message);
      } else {
        console.log(`Updated auth user password for ${credential.email}`);
      }
    } else {
      console.log(`Creating auth user for ${credential.email}...`);
      // Create auth user
      const { error: authError } = await supabaseAdmin.auth.signUp({
        email: credential.email,
        password: credential.password,
        options: {
          data: {
            full_name: `${credential.role.charAt(0).toUpperCase() + credential.role.slice(1)} User`,
            role: credential.role
          }
        }
      });
      
      if (authError) {
        console.error(`Error creating auth user ${credential.email}:`, authError.message);
        return;
      }
      
      console.log(`Auth user created for ${credential.email}`);
    }
    
    // Check if user exists in users table
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', credential.email)
      .single();
    
    if (existingUser) {
      console.log(`User ${credential.email} exists in users table, updating...`);
      
      // Update the user's information
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          full_name: `${credential.role.charAt(0).toUpperCase() + credential.role.slice(1)} User`,
          role: credential.role,
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingUser.id);
      
      if (updateError) {
        console.error(`Error updating user ${credential.email}:`, updateError.message);
      } else {
        console.log(`Updated user ${credential.email} in database`);
      }
    } else {
      console.log(`Creating user ${credential.email} in users table...`);
      
      // Create user in database
      const { error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          email: credential.email,
          full_name: `${credential.role.charAt(0).toUpperCase() + credential.role.slice(1)} User`,
          role: credential.role,
          is_active: true,
        });
      
      if (insertError) {
        console.error(`Error creating user ${credential.email}:`, insertError.message);
      } else {
        console.log(`Created user ${credential.email} in database`);
      }
    }
    
    console.log(`✅ ${credential.role} user ${credential.email} fix attempt completed!`);
    
  } catch (error) {
    console.error(`Unexpected error fixing ${credential.email}:`, error.message);
  }
}

fixLoginAccounts();