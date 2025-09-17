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

async function fixRLSPolicies() {
  console.log('Fixing RLS policies...');
  
  try {
    // Fix users table RLS policies
    console.log('Updating users table RLS policies...');
    
    // Drop existing policies
    const { error: dropPolicy1 } = await supabaseAdmin.rpc('exec_sql', {
      sql: 'DROP POLICY IF EXISTS "Users can view own profile" ON users;'
    });
    
    if (dropPolicy1) {
      console.log('Note: Error dropping policy 1:', dropPolicy1.message);
    }
    
    // Create new policy that allows users to view their own profile and admins/managers to view all
    const { error: createPolicy1 } = await supabaseAdmin.rpc('exec_sql', {
      sql: `CREATE POLICY "Users can view own profile" ON users
        FOR SELECT USING (auth.uid() = id OR 
        (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager'))));`
    });
    
    if (createPolicy1) {
      console.log('Note: Error creating policy 1:', createPolicy1.message);
    } else {
      console.log('✅ Updated users table RLS policy');
    }
    
    // Fix reports table RLS policies
    console.log('Updating reports table RLS policies...');
    
    // Drop existing policies
    const { error: dropPolicy2 } = await supabaseAdmin.rpc('exec_sql', {
      sql: 'DROP POLICY IF EXISTS "Users can view own reports" ON reports;'
    });
    
    if (dropPolicy2) {
      console.log('Note: Error dropping policy 2:', dropPolicy2.message);
    }
    
    const { error: dropPolicy3 } = await supabaseAdmin.rpc('exec_sql', {
      sql: 'DROP POLICY IF EXISTS "Users can insert own reports" ON reports;'
    });
    
    if (dropPolicy3) {
      console.log('Note: Error dropping policy 3:', dropPolicy3.message);
    }
    
    // Create new policies
    const { error: createPolicy2 } = await supabaseAdmin.rpc('exec_sql', {
      sql: `CREATE POLICY "Users can view own reports" ON reports
        FOR SELECT USING (auth.uid() = user_id OR 
        (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager'))));`
    });
    
    if (createPolicy2) {
      console.log('Note: Error creating policy 2:', createPolicy2.message);
    }
    
    const { error: createPolicy3 } = await supabaseAdmin.rpc('exec_sql', {
      sql: `CREATE POLICY "Users can insert own reports" ON reports
        FOR INSERT WITH CHECK (auth.uid() = user_id);`
    });
    
    if (createPolicy3) {
      console.log('Note: Error creating policy 3:', createPolicy3.message);
    } else {
      console.log('✅ Updated reports table RLS policies');
    }
    
    // Fix payments table RLS policies
    console.log('Updating payments table RLS policies...');
    
    // Drop existing policy
    const { error: dropPolicy4 } = await supabaseAdmin.rpc('exec_sql', {
      sql: 'DROP POLICY IF EXISTS "Users can view own payments" ON payments;'
    });
    
    if (dropPolicy4) {
      console.log('Note: Error dropping policy 4:', dropPolicy4.message);
    }
    
    // Create new policy
    const { error: createPolicy4 } = await supabaseAdmin.rpc('exec_sql', {
      sql: `CREATE POLICY "Users can view own payments" ON payments
        FOR SELECT USING (auth.uid() = user_id OR 
        (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager'))));`
    });
    
    if (createPolicy4) {
      console.log('Note: Error creating policy 4:', createPolicy4.message);
    } else {
      console.log('✅ Updated payments table RLS policy');
    }
    
    console.log('\nRLS policies fix completed!');
    
  } catch (error) {
    console.error('Unexpected error fixing RLS policies:', error.message);
  }
}

fixRLSPolicies();