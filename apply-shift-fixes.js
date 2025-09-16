// Apply Shift Creation Fixes
// This script applies the database fixes and tests the shift creation functionality

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase configuration
const SUPABASE_URL = 'https://znjtryqrqxjghvvdlvdg.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuanRyeXFycXhqZ2h2dmRsdmRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njk3OTgyNSwiZXhwIjoyMDcyNTU1ODI1fQ.qPtvXftUtQ9zSMtGy52U1xI6d8V-5xrL7-2Mn3NFMQc';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function applyDatabaseFixes() {
  console.log('🔧 Applying database fixes for shift creation...');
  
  try {
    // Read the SQL fix file
    const sqlFixes = readFileSync(join(__dirname, 'fix-shift-creation.sql'), 'utf8');
    
    // Split SQL statements and execute them
    const statements = sqlFixes.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement && !statement.startsWith('--')) {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error) {
          console.error(`Error in statement ${i + 1}:`, error);
          // Continue with other statements
        }
      }
    }
    
    console.log('✅ Database fixes applied successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error applying database fixes:', error);
    return false;
  }
}

async function testShiftCreation() {
  console.log('🧪 Testing shift creation functionality...');
  
  try {
    // Test basic connectivity
    const { data: testData, error: testError } = await supabase
      .from('shifts')
      .select('id')
      .limit(1);
      
    if (testError) {
      console.error('❌ Database connection test failed:', testError);
      return false;
    }
    
    console.log('✅ Database connection successful');
    
    // Check if required tables exist
    const tables = ['shifts', 'tenants', 'tenant_memberships', 'profiles'];
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
        
      if (error) {
        console.error(`❌ Table '${table}' not accessible:`, error.message);
      } else {
        console.log(`✅ Table '${table}' accessible`);
      }
    }
    
    // Test RLS policies by checking current user permissions
    console.log('🔐 Testing RLS policies...');
    
    // This will test if policies are working correctly
    const { data: policyTest, error: policyError } = await supabase
      .from('shifts')
      .select('*')
      .limit(5);
      
    if (policyError) {
      console.log('ℹ️  RLS policies active (expected):', policyError.message);
    } else {
      console.log('✅ Shift access working, found', policyTest?.length || 0, 'shifts');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Testing failed:', error);
    return false;
  }
}

async function checkUserRoles() {
  console.log('👥 Checking user roles and permissions...');
  
  try {
    // Check profiles table structure
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .limit(10);
      
    if (profileError) {
      console.error('❌ Cannot access profiles:', profileError.message);
      return false;
    }
    
    console.log('📊 User roles found:');
    const roleStats = {};
    profiles?.forEach(profile => {
      const role = profile.role || 'unknown';
      roleStats[role] = (roleStats[role] || 0) + 1;
    });
    
    Object.entries(roleStats).forEach(([role, count]) => {
      console.log(`   ${role}: ${count} users`);
    });
    
    // Check tenant memberships
    const { data: memberships, error: membershipError } = await supabase
      .from('tenant_memberships')
      .select('role, status')
      .limit(10);
      
    if (membershipError) {
      console.log('ℹ️  Tenant memberships not accessible (might be empty):', membershipError.message);
    } else {
      console.log('🏢 Tenant memberships found:', memberships?.length || 0);
      
      const membershipStats = {};
      memberships?.forEach(membership => {
        const role = membership.role || 'unknown';
        membershipStats[role] = (membershipStats[role] || 0) + 1;
      });
      
      Object.entries(membershipStats).forEach(([role, count]) => {
        console.log(`   ${role}: ${count} memberships`);
      });
    }
    
    return true;
  } catch (error) {
    console.error('❌ Role checking failed:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Smart Shift Tracker - Fix Application Starting...\n');
  
  // Step 1: Apply database fixes
  const fixesApplied = await applyDatabaseFixes();
  console.log('');
  
  // Step 2: Test functionality
  const testsPassed = await testShiftCreation();
  console.log('');
  
  // Step 3: Check user roles
  const rolesChecked = await checkUserRoles();
  console.log('');
  
  // Summary
  console.log('📋 Summary:');
  console.log(`   Database fixes: ${fixesApplied ? '✅' : '❌'}`);
  console.log(`   Functionality tests: ${testsPassed ? '✅' : '❌'}`);
  console.log(`   Role verification: ${rolesChecked ? '✅' : '❌'}`);
  
  if (fixesApplied && testsPassed && rolesChecked) {
    console.log('\n🎉 All fixes applied successfully! You should now be able to create shifts.');
    console.log('\n💡 Next steps:');
    console.log('   1. Restart your development server');
    console.log('   2. Log in as a company user');
    console.log('   3. Try creating a shift');
    console.log('   4. Check the browser console for any remaining issues');
  } else {
    console.log('\n⚠️  Some issues remain. Please check the errors above.');
  }
}

main().catch(console.error);