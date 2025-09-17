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

async function createAdminAccount() {
  const email = 'manish.epacific@gmail.com';
  const fullName = 'Manish Admin';
  const role = 'admin';
  
  try {
    console.log(`Checking if user with email ${email} already exists...`);
    
    // Check if user already exists in users table
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error checking existing user:', fetchError);
      return;
    }
    
    // If user exists in users table, remove them
    if (existingUser) {
      console.log(`User with email ${email} already exists in users table. Removing...`);
      
      // Try to delete from auth.users first (might not exist)
      try {
        await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
        console.log('Successfully removed user from auth system');
      } catch {
        console.log('Note: User not found in auth system, but that\'s okay');
      }
      
      // Delete from users table
      const { error: deleteError } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', existingUser.id);
      
      if (deleteError) {
        console.error('Error deleting user from users table:', deleteError);
        return;
      }
      
      console.log(`Successfully removed existing user with email ${email}`);
    }
    
    console.log(`Creating admin account with email ${email}...`);
    
    // Create auth user with email invitation
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          full_name: fullName,
          role: role
        },
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/confirm`
      }
    );
    
    if (authError) {
      console.error('Error creating auth user:', authError);
      return;
    }
    
    if (!authUser.user) {
      console.error('No user returned from auth creation');
      return;
    }
    
    console.log('Auth user created successfully. Creating user record...');
    
    // Create user record in our users table
    const { data: newUser, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authUser.user.id,
        email: email,
        full_name: fullName,
        role: role,
        is_active: true,
        password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' // Default password: password
      })
      .select('id')
      .single();
    
    if (userError) {
      // Clean up auth user if user creation fails
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      console.error('Error creating user record:', userError);
      return;
    }
    
    console.log(`✅ Admin account created successfully!`);
    console.log(`Email: ${email}`);
    console.log(`Password: password`);
    console.log(`User ID: ${newUser.id}`);
    console.log(`An invitation email has been sent to ${email}`);
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createAdminAccount();