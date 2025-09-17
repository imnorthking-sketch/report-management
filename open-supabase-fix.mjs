import { config } from 'dotenv';
import { exec } from 'child_process';

// Load environment variables from .env.local
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL not found in .env.local');
  process.exit(1);
}

// Extract project ref from URL (format: https://project-ref.supabase.co)
const projectRef = supabaseUrl.replace('https://', '').split('.')[0];
const dashboardUrl = `https://app.supabase.com/project/${projectRef}/sql`;

console.log('🚨 EMERGENCY RLS POLICY FIX REQUIRED 🚨');
console.log('=====================================');
console.log('');
console.log('The login issue is caused by database security policies.');
console.log('You MUST apply the fix in your Supabase dashboard.');
console.log('');
console.log('✅ Opening Supabase SQL Editor...');
console.log('Project URL:', dashboardUrl);
console.log('');
console.log('📋 AFTER THE DASHBOARD OPENS:');
console.log('1. Copy the SQL commands from EMERGENCY_RLS_FIX.md');
console.log('2. Paste them into the SQL Editor');
console.log('3. Click "RUN" to execute');
console.log('4. Restart your development server');
console.log('5. Test login with provided credentials');
console.log('');
console.log('⏰ This fix must be applied immediately to resolve login issues.');

// Open URL in default browser (cross-platform)
if (process.platform === 'win32') {
  exec(`start "" "${dashboardUrl}"`, (error) => {
    if (error) {
      console.error('❌ Failed to open browser on Windows:', error.message);
      console.log('Please manually visit:', dashboardUrl);
    } else {
      console.log('✅ Supabase Dashboard opened in your default browser');
    }
  });
} else if (process.platform === 'darwin') {
  exec(`open "${dashboardUrl}"`, (error) => {
    if (error) {
      console.error('❌ Failed to open browser on macOS:', error.message);
      console.log('Please manually visit:', dashboardUrl);
    } else {
      console.log('✅ Supabase Dashboard opened in your default browser');
    }
  });
} else {
  exec(`xdg-open "${dashboardUrl}"`, (error) => {
    if (error) {
      console.error('❌ Failed to open browser on Linux:', error.message);
      console.log('Please manually visit:', dashboardUrl);
    } else {
      console.log('✅ Supabase Dashboard opened in your default browser');
    }
  });
}