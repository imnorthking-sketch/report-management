import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env.local file');
  process.exit(1);
}

// Server-side Supabase client with service role (for admin operations)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Default users to seed
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

async function seedDefaultUsers() {
  console.log('Seeding default users...');
  
  for (const user of defaultUsers) {
    try {
      console.log(`Checking if user ${user.email} exists...`);
      
      // Check if user already exists
      const { data: existingUser, error: fetchError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single();
      
      if (existingUser) {
        console.log(`User ${user.email} already exists, skipping...`);
        continue;
      }
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error(`Error checking user ${user.email}:`, fetchError);
        continue;
      }
      
      console.log(`Creating user ${user.email}...`);
      
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
        console.error(`Error creating auth user ${user.email}:`, authError);
        continue;
      }
      
      if (!authUser.user) {
        console.error(`No user returned from auth creation for ${user.email}`);
        continue;
      }
      
      console.log(`Auth user created for ${user.email}. Creating user record...`);
      
      // Create user record in our users table
      const { data: newUser, error: userError } = await supabaseAdmin
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
        console.error(`Error creating user record for ${user.email}:`, userError);
        // Clean up auth user if user creation fails
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        continue;
      }
      
      console.log(`✅ User ${user.email} created successfully!`);
    } catch (error) {
      console.error(`Unexpected error creating user ${user.email}:`, error);
    }
  }
  
  console.log('User seeding completed!');
}

seedDefaultUsers();