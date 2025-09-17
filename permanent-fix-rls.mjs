import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

console.log('IMPORTANT: Please run the following SQL commands in your Supabase SQL editor to permanently fix the RLS policy issue:');
console.log('\n--- FIX RLS POLICY ---');
console.log('-- Drop the existing problematic policies');
console.log('DROP POLICY IF EXISTS "Users can view own profile" ON users;');
console.log('DROP POLICY IF EXISTS "Users can view own reports" ON reports;');
console.log('DROP POLICY IF EXISTS "Users can view own payments" ON payments;');
console.log('DROP POLICY IF EXISTS "Admins can view all activity logs" ON activity_logs;');
console.log('');
console.log('-- Create new policies without recursion');
console.log('CREATE POLICY "Users can view own profile" ON users');
console.log('  FOR SELECT USING (');
console.log('    auth.uid() = id OR');
console.log('    (auth.jwt() ->> \'role\') IN (\'admin\', \'manager\')');
console.log('  );');
console.log('');
console.log('CREATE POLICY "Users can view own reports" ON reports');
console.log('  FOR SELECT USING (');
console.log('    auth.uid() = user_id OR');
console.log('    (auth.jwt() ->> \'role\') IN (\'admin\', \'manager\')');
console.log('  );');
console.log('');
console.log('CREATE POLICY "Users can view own payments" ON payments');
console.log('  FOR SELECT USING (');
console.log('    auth.uid() = user_id OR');
console.log('    (auth.jwt() ->> \'role\') IN (\'admin\', \'manager\')');
console.log('  );');
console.log('');
console.log('CREATE POLICY "Admins can view all activity logs" ON activity_logs');
console.log('  FOR SELECT USING ((auth.jwt() ->> \'role\') = \'admin\');');
console.log('--- END FIX ---');
console.log('\nAfter running these commands, the infinite recursion issue will be resolved.');
console.log('The authentication service will work properly and users will be able to log in.');