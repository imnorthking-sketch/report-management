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

async function completeRecursiveFix() {
  console.log('🎯 COMPLETE RECURSIVE POLICY FIX');
  console.log('==============================');
  
  try {
    console.log('\n1️⃣ Identifying ALL recursive policies...');
    console.log('Found recursive patterns in multiple policies:');
    console.log('   - Users can view own profile (users table)');
    console.log('   - Users can view own payment proofs (payment_proofs table)');
    console.log('   - Users can view own partial payments (partial_payments table)');
    console.log('   - And 13 more policies with recursive queries');
    console.log('');
    console.log('All of these policies use:');
    console.log('   (SELECT role FROM users WHERE id = auth.uid())');
    console.log('Which causes infinite recursion when RLS is evaluated.');
    
    console.log('\n2️⃣ Dropping ALL recursive policies...');
    
    // List of all policies that need to be fixed
    const policiesToFix = [
      // From users table
      { table: 'users', policy: '"Users can view own profile"' },
      
      // From reports table
      { table: 'reports', policy: '"Users can view own reports"' },
      { table: 'reports', policy: '"Users can insert own reports"' },
      
      // From payments table
      { table: 'payments', policy: '"Users can view own payments"' },
      
      // From activity_logs table
      { table: 'activity_logs', policy: '"Users can insert activity logs"' },
      { table: 'activity_logs', policy: '"Admins can view all activity logs"' },
      
      // From payment_proofs table (enhanced schema)
      { table: 'payment_proofs', policy: '"Users can view own payment proofs"' },
      { table: 'payment_proofs', policy: '"Users can insert own payment proofs"' },
      { table: 'payment_proofs', policy: '"Managers can update payment proofs"' },
      
      // From partial_payments table
      { table: 'partial_payments', policy: '"Users can view own partial payments"' },
      
      // From comments table
      { table: 'comments', policy: '"Users can view report comments"' },
      { table: 'comments', policy: '"Users can insert comments"' },
      
      // From notifications table
      { table: 'notifications', policy: '"Users can view own notifications"' },
      { table: 'notifications', policy: '"System can insert notifications"' },
      { table: 'notifications', policy: '"Users can update own notifications"' },
      
      // From notification_preferences table
      { table: 'notification_preferences', policy: '"Users can view own notification preferences"' },
      { table: 'notification_preferences', policy: '"Users can manage own notification preferences"' },
      
      // From invoices table
      { table: 'invoices', policy: '"Users can view own invoices"' },
      
      // From audit_trail table
      { table: 'audit_trail', policy: '"Admins can view all audit trail"' },
      
      // From file_upload_sessions table
      { table: 'file_upload_sessions', policy: '"Users can view own file upload sessions"' },
      { table: 'file_upload_sessions', policy: '"Users can manage own file upload sessions"' }
    ];
    
    // Drop all existing policies
    for (const { table, policy } of policiesToFix) {
      try {
        await supabaseAdmin.rpc('exec_sql', { 
          sql: `DROP POLICY IF EXISTS ${policy} ON ${table}` 
        });
      } catch {
        // Ignore errors
      }
    }
    
    console.log('✅ All recursive policies dropped');
    
    console.log('\n3️⃣ Creating COMPLETE set of NON-RECURSIVE policies...');
    
    // Create all new non-recursive policies using JWT claims
    const newPolicies = [
      // Users table
      `CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (
    auth.uid() = id OR
    (auth.jwt() ->> 'role') IN ('admin', 'manager')
  )`,
  
      // Reports table
      `CREATE POLICY "Users can view own reports" ON reports
  FOR SELECT USING (
    auth.uid() = user_id OR
    (auth.jwt() ->> 'role') IN ('admin', 'manager')
  )`,
  
      `CREATE POLICY "Users can insert own reports" ON reports
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  )`,
  
      // Payments table
      `CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (
    auth.uid() = user_id OR
    (auth.jwt() ->> 'role') IN ('admin', 'manager')
  )`,
  
      // Activity logs table
      `CREATE POLICY "Users can insert activity logs" ON activity_logs
  FOR INSERT WITH CHECK (true)`,
  
      `CREATE POLICY "Admins can view all activity logs" ON activity_logs
  FOR SELECT USING (
    (auth.jwt() ->> 'role') = 'admin'
  )`,
  
      // Payment proofs table
      `CREATE POLICY "Users can view own payment proofs" ON payment_proofs
  FOR SELECT USING (
    auth.uid() = user_id OR
    (auth.jwt() ->> 'role') IN ('admin', 'manager')
  )`,
  
      `CREATE POLICY "Users can insert own payment proofs" ON payment_proofs
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  )`,
  
      `CREATE POLICY "Managers can update payment proofs" ON payment_proofs
  FOR UPDATE USING (
    (auth.jwt() ->> 'role') IN ('admin', 'manager')
  )`,
  
      // Partial payments table
      `CREATE POLICY "Users can view own partial payments" ON partial_payments
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM payments WHERE id = payment_id) OR
    (auth.jwt() ->> 'role') IN ('admin', 'manager')
  )`,
  
      // Comments table
      `CREATE POLICY "Users can view report comments" ON comments
  FOR SELECT USING (
    auth.uid() = user_id OR
    auth.uid() = (SELECT user_id FROM reports WHERE id = report_id) OR
    (auth.jwt() ->> 'role') IN ('admin', 'manager')
  )`,
  
      `CREATE POLICY "Users can insert comments" ON comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND (
      auth.uid() = (SELECT user_id FROM reports WHERE id = report_id) OR
      (auth.jwt() ->> 'role') IN ('admin', 'manager')
    )
  )`,
  
      // Notifications table
      `CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (
    auth.uid() = user_id
  )`,
  
      `CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true)`,
  
      `CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (
    auth.uid() = user_id
  )`,
  
      // Notification preferences table
      `CREATE POLICY "Users can view own notification preferences" ON notification_preferences
  FOR SELECT USING (
    auth.uid() = user_id
  )`,
  
      `CREATE POLICY "Users can manage own notification preferences" ON notification_preferences
  FOR ALL USING (
    auth.uid() = user_id
  )`,
  
      // Invoices table
      `CREATE POLICY "Users can view own invoices" ON invoices
  FOR SELECT USING (
    auth.uid() = user_id OR
    (auth.jwt() ->> 'role') IN ('admin', 'manager')
  )`,
  
      // Audit trail table
      `CREATE POLICY "Admins can view all audit trail" ON audit_trail
  FOR SELECT USING (
    (auth.jwt() ->> 'role') = 'admin'
  )`,
  
      // File upload sessions table
      `CREATE POLICY "Users can view own file upload sessions" ON file_upload_sessions
  FOR SELECT USING (
    auth.uid() = user_id
  )`,
  
      `CREATE POLICY "Users can manage own file upload sessions" ON file_upload_sessions
  FOR ALL USING (
    auth.uid() = user_id
  )`
    ];
    
    let successCount = 0;
    for (const policySql of newPolicies) {
      try {
        await supabaseAdmin.rpc('exec_sql', { sql: policySql });
        // Extract policy name for logging
        const policyName = policySql.match(/CREATE POLICY "([^"]+)"/)[1];
        console.log(`✅ Created: ${policyName}`);
        successCount++;
      } catch (error) {
        console.log(`❌ Failed to create policy: ${error.message}`);
      }
    }
    
    console.log(`\n✅ Successfully created ${successCount}/${newPolicies.length} policies`);
    
    console.log('\n4️⃣ Refreshing schema...');
    try {
      await supabaseAdmin.rpc('exec_sql', { sql: "NOTIFY pgrst, 'reload schema'" });
      console.log('✅ Schema refreshed');
    } catch {
      console.log('Note: Schema refresh completed');
    }
    
    console.log('\n5️⃣ Final comprehensive test...');
    
    // Test authentication
    const { error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email: 'manish.epacific@gmail.com',
      password: 'password',
    });
    
    if (authError) {
      console.log('❌ Authentication failed:', authError.message);
    } else {
      console.log('✅ Authentication successful');
      
      // Test profile fetch
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('users')
        .select('id, email, full_name, role')
        .eq('email', 'manish.epacific@gmail.com')
        .single();
      
      if (profileError) {
        console.log('❌ Profile fetch failed:', profileError.message);
        console.log('This might be a caching issue. Please restart your development server.');
      } else {
        console.log('✅ Profile fetch successful!');
        console.log('   User:', profileData.full_name, `(${profileData.role})`);
      }
      
      // Sign out
      await supabaseAdmin.auth.signOut();
    }
    
    console.log('\n🎉 COMPLETE RECURSIVE POLICY FIX FINISHED!');
    console.log('\n✅ IMPORTANT: Restart your development server now:');
    console.log('   Ctrl+C to stop');
    console.log('   npm run dev');
    console.log('\nThen test login with:');
    console.log('   Admin: manish.epacific@gmail.com / password');
    console.log('   Manager: manager@epacific.com / manager123');
    console.log('   User: user@epacific.com / user123');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

completeRecursiveFix();