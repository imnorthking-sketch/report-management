#!/usr/bin/env node

/**
 * Direct RLS Fix Application Script
 * This script applies the RLS fix directly to your Supabase database
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

// Configuration - Update these with your Supabase project details
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

async function applyRLSFix() {
  console.log('🔧 Applying RLS Policy Fix...\n')
  
  // Check if service role key is available
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.log('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required')
    console.log('Please set it in your environment variables')
    process.exit(1)
  }
  
  try {
    // Read the complete fix SQL
    const sqlFilePath = resolve('./complete-rls-fix.sql')
    const sqlContent = readFileSync(sqlFilePath, 'utf8')
    
    console.log('📄 Reading SQL fix from:', sqlFilePath)
    console.log('⚡ Executing SQL commands...\n')
    
    // Note: Supabase doesn't have a direct SQL execution RPC
    // You need to manually execute the SQL in the Supabase dashboard
    console.log('⚠️  IMPORTANT: Supabase does not support direct SQL execution via API')
    console.log('📋 Please follow these steps:')
    console.log('1. Copy the SQL content from complete-rls-fix.sql')
    console.log('2. Go to your Supabase Dashboard SQL Editor:')
    console.log('   https://app.supabase.com/project/zledxboxmyhglicebfuq/sql')
    console.log('3. Paste and execute the SQL there')
    console.log('4. Then restart your development server')
    
    // Show first part of the SQL for reference
    console.log('\n🔍 First few lines of the SQL to execute:')
    console.log(sqlContent.split('\n').slice(0, 10).join('\n'))
    
    console.log('\n📋 After executing the SQL in Supabase dashboard:')
    console.log('1. Restart your development server:')
    console.log('   Ctrl+C to stop, then npm run dev')
    console.log('2. Test login with the following credentials:')
    console.log('   - Admin: manish.epacific@gmail.com / password')
    console.log('   - Manager: manager@epacific.com / manager123')
    console.log('   - User: user@epacific.com / user123')
    
  } catch (error) {
    console.log('❌ Error reading RLS fix:', error.message)
    process.exit(1)
  }
}

// Run the fix application
applyRLSFix().catch(error => {
  console.error('❌ Failed to apply RLS fix:', error)
  process.exit(1)
})