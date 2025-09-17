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

console.log('🚀 Opening Supabase Dashboard...');
console.log('Project URL:', dashboardUrl);

// Open URL in default browser (cross-platform)
if (process.platform === 'win32') {
  exec(`start ${dashboardUrl}`, (error) => {
    if (error) {
      console.error('❌ Failed to open browser on Windows:', error.message);
      console.log('Please manually visit:', dashboardUrl);
    } else {
      console.log('✅ Supabase Dashboard opened in your default browser');
    }
  });
} else if (process.platform === 'darwin') {
  exec(`open ${dashboardUrl}`, (error) => {
    if (error) {
      console.error('❌ Failed to open browser on macOS:', error.message);
      console.log('Please manually visit:', dashboardUrl);
    } else {
      console.log('✅ Supabase Dashboard opened in your default browser');
    }
  });
} else {
  exec(`xdg-open ${dashboardUrl}`, (error) => {
    if (error) {
      console.error('❌ Failed to open browser on Linux:', error.message);
      console.log('Please manually visit:', dashboardUrl);
    } else {
      console.log('✅ Supabase Dashboard opened in your default browser');
    }
  });
}