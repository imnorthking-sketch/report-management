import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create admin client
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Users that need to be set up in auth system
const missingUsers = [
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

async function setupMissingUsers() {
  console.log('Setting up missing users in auth system...\n');
  
  for (const user of missingUsers) {
    try {
      console.log(`Setting up ${user.role} (${user.email})...`);
      
      // Check if user already exists in auth
      const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (listError) {
        console.error(`❌ Error listing auth users:`, listError.message);
        continue;
      }
      
      const existingAuthUser = authUsers.users.find(u => u.email === user.email);
      
      if (existingAuthUser) {
        console.log(`✅ Auth user already exists for ${user.email}`);
        
        // Update password
        console.log(`🔄 Updating password for ${user.email}...`);
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          existingAuthUser.id,
          { password: user.password }
        );
        
        if (updateError) {
          console.error(`❌ Error updating password for ${user.email}:`, updateError.message);
        } else {
          console.log(`✅ Updated password for ${user.email}`);
        }
      } else {
        console.log(`🔄 Creating auth user for ${user.email}...`);
        
        // Create auth user with signup
        const { data: authUser, error: signUpError } = await supabaseAdmin.auth.signUp({
          email: user.email,
          password: user.password,
          options: {
            data: {
              full_name: user.full_name,
              role: user.role
            }
          }
        });
        
        if (signUpError) {
          console.error(`❌ Error creating auth user ${user.email}:`, signUpError.message);
          
          // Try invite as fallback
          console.log(`🔄 Trying invite for ${user.email}...`);
          const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
            user.email,
            {
              data: {
                full_name: user.full_name,
                role: user.role
              }
            }
          );
          
          if (inviteError) {
            console.error(`❌ Error inviting user ${user.email}:`, inviteError.message);
            continue;
          }
          
          console.log(`✅ Invited user ${user.email}`);
        } else {
          console.log(`✅ Created auth user for ${user.email}`);
        }
      }
      
      console.log('');
      
    } catch (error) {
      console.error(`❌ Unexpected error processing ${user.email}:`, error.message);
    }
  }
  
  console.log('✅ Missing users setup completed!');
  console.log('\nTesting login for all users...\n');
  
  // Test all users
  const allUsers = [
    { email: 'manish.epacific@gmail.com', password: 'password', role: 'admin' },
    { email: 'manager@company.com', password: 'manager123', role: 'manager' },
    { email: 'user@company.com', password: 'user123', role: 'user' }
  ];
  
  for (const testUser of allUsers) {
    console.log(`Testing ${testUser.role} login (${testUser.email})...`);
    
    try {
      // Create a new client for testing (with anon key)
      const testClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
      
      const { data, error } = await testClient.auth.signInWithPassword({
        email: testUser.email,
        password: testUser.password,
      });
      
      if (error) {
        console.log(`❌ Login failed: ${error.message}`);
      } else {
        console.log(`✅ Login successful!`);
        // Sign out
        await testClient.auth.signOut();
      }
    } catch (error) {
      console.log(`❌ Login failed: ${error.message}`);
    }
    
    console.log('');
  }
  
  console.log('🎉 All users should now be ready for login!');
}

setupMissingUsers();