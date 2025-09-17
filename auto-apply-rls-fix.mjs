import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create admin client with full permissions
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function autoApplyRlsFix() {
  console.log('🤖 ATTEMPTING AUTOMATIC RLS POLICY FIX');
  console.log('=====================================');
  
  try {
    console.log('\n1️⃣ Testing admin client connection...');
    const { error } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .limit(1);
    
    if (error) {
      console.error('❌ Admin client test failed:', error.message);
      console.log('Cannot automatically apply fix. Manual intervention required.');
      return;
    }
    
    console.log('✅ Admin client connected successfully');
    
    console.log('\n2️⃣ Attempting to drop existing policies...');
    // We'll try to execute the fix commands one by one
    const fixCommands = [
      'DROP POLICY IF EXISTS "Users can view own profile" ON users',
      'DROP POLICY IF EXISTS "Users can view own reports" ON reports',
      'DROP POLICY IF EXISTS "Users can view own payments" ON payments',
      'DROP POLICY IF EXISTS "Admins can view all activity logs" ON activity_logs'
    ];
    
    for (const command of fixCommands) {
      try {
        // Try to execute as RPC call (this might not work)
        await supabaseAdmin.rpc('exec_sql', { sql: command });
        console.log(`✅ Executed: ${command}`);
      } catch {
        console.log(`Note: Could not execute "${command}" (this is expected)`);
      }
    }
    
    console.log('\n3️⃣ IMPORTANT: Manual fix still required');
    console.log('The RLS policy fix must be applied manually in the Supabase SQL Editor.');
    console.log('Please follow these steps:');
    console.log('\n   a. Visit: https://app.supabase.com/project/zledxboxmyhglicebfuq/sql');
    console.log('   b. Copy and paste the following SQL commands:');
    console.log('\n--- SQL COMMANDS TO FIX RLS POLICIES ---');
    console.log('-- Drop existing problematic policies');
    console.log('DROP POLICY IF EXISTS "Users can view own profile" ON users;');
    console.log('DROP POLICY IF EXISTS "Users can view own reports" ON reports;');
    console.log('DROP POLICY IF EXISTS "Users can view own payments" ON payments;');
    console.log('DROP POLICY IF EXISTS "Admins can view all activity logs" ON activity_logs;');
    console.log('');
    console.log('-- Create new policies without recursion');
    console.log('CREATE POLICY "Users can view own profile" ON users');
    console.log('  FOR SELECT USING (');
    console.log('    auth.uid() = id OR');
    console.log('    (EXISTS (');
    console.log('      SELECT 1 FROM users u2');
    console.log('      WHERE u2.id = auth.uid()');
    console.log('      AND u2.role IN (\'admin\', \'manager\')');
    console.log('    ))');
    console.log('  );');
    console.log('');
    console.log('CREATE POLICY "Users can view own reports" ON reports');
    console.log('  FOR SELECT USING (');
    console.log('    auth.uid() = user_id OR');
    console.log('    (EXISTS (');
    console.log('      SELECT 1 FROM users u2');
    console.log('      WHERE u2.id = auth.uid()');
    console.log('      AND u2.role IN (\'admin\', \'manager\')');
    console.log('    ))');
    console.log('  );');
    console.log('');
    console.log('CREATE POLICY "Users can view own payments" ON payments');
    console.log('  FOR SELECT USING (');
    console.log('    auth.uid() = user_id OR');
    console.log('    (EXISTS (');
    console.log('      SELECT 1 FROM users u2');
    console.log('      WHERE u2.id = auth.uid()');
    console.log('      AND u2.role IN (\'admin\', \'manager\')');
    console.log('    ))');
    console.log('  );');
    console.log('');
    console.log('CREATE POLICY "Admins can view all activity logs" ON activity_logs');
    console.log('  FOR SELECT USING (');
    console.log('    (EXISTS (');
    console.log('      SELECT 1 FROM users u2');
    console.log('      WHERE u2.id = auth.uid()');
    console.log('      AND u2.role = \'admin\'');
    console.log('    ))');
    console.log('  );');
    console.log('');
    console.log('-- Refresh the schema');
    console.log('NOTIFY pgrst, \'reload schema\';');
    console.log('--- END SQL COMMANDS ---');
    console.log('\n   c. Click "RUN" to execute the commands');
    console.log('   d. Restart your development server: npm run dev');
    
    console.log('\n4️⃣ Verification after applying fix:');
    console.log('   Run: node final-verification.mjs');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.log('\nPlease manually apply the RLS fix using the SQL commands provided above.');
  }
}

autoApplyRlsFix();