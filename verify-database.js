import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://znjtryqrqxjghvvdlvdg.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuanRyeXFycXhqZ2h2dmRsdmRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5Nzk4MjUsImV4cCI6MjA3MjU1NTgyNX0.cnozRMnDLTsdMRs5-Uql38x5uZTh7l4WZuSSs4-H-34';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyDatabase() {
  console.log('🔍 Verifying database setup...');
  console.log('📍 Project URL:', supabaseUrl);
  console.log('');

  let allGood = true;

  // Test 1: Check if tenants table exists and is accessible
  console.log('1️⃣  Testing tenants table...');
  try {
    const { data, error } = await supabase.from('tenants').select('id').limit(1);
    if (error) {
      console.log('   ❌ Cannot access tenants table:', error.message);
      allGood = false;
    } else {
      console.log('   ✅ Tenants table accessible');
    }
  } catch (error) {
    console.log('   ❌ Error accessing tenants table:', error.message);
    allGood = false;
  }

  // Test 2: Check if tenant_memberships table exists and is accessible
  console.log('2️⃣  Testing tenant_memberships table...');
  try {
    const { data, error } = await supabase.from('tenant_memberships').select('id').limit(1);
    if (error) {
      console.log('   ❌ Cannot access tenant_memberships table:', error.message);
      allGood = false;
    } else {
      console.log('   ✅ Tenant_memberships table accessible');
    }
  } catch (error) {
    console.log('   ❌ Error accessing tenant_memberships table:', error.message);
    allGood = false;
  }

  // Test 3: Try to create a test tenant (this will test INSERT policies)
  console.log('3️⃣  Testing tenant creation (INSERT policy)...');
  try {
    const testTenant = {
      name: 'Test Company Verification',
      slug: `test-verify-${Date.now()}`,
      settings: { test: true }
    };

    const { data, error } = await supabase
      .from('tenants')
      .insert([testTenant])
      .select()
      .single();

    if (error) {
      if (error.code === '42501' || error.message.includes('permission')) {
        console.log('   ⚠️  INSERT policy needs setup - run the complete SQL script');
        console.log('   📝 Error:', error.message);
      } else {
        console.log('   ❌ Error creating tenant:', error.message);
      }
      allGood = false;
    } else {
      console.log('   ✅ Tenant creation works');
      console.log('   📊 Created tenant:', data.name, `(${data.slug})`);
      
      // Clean up test tenant
      await supabase.from('tenants').delete().eq('id', data.id);
      console.log('   🧹 Cleaned up test tenant');
    }
  } catch (error) {
    console.log('   ❌ Error testing tenant creation:', error.message);
    allGood = false;
  }

  // Test 4: Check authentication status
  console.log('4️⃣  Testing authentication...');
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      console.log('   ✅ User is authenticated:', user.email);
    } else {
      console.log('   ℹ️  No authenticated user (this is normal for verification)');
    }
  } catch (error) {
    console.log('   ⚠️  Auth check failed:', error.message);
  }

  console.log('');
  console.log('📋 Verification Results:');
  
  if (allGood) {
    console.log('🎉 All tests passed! Your database is properly configured.');
    console.log('✅ Company signup should work correctly now.');
    console.log('');
    console.log('🚀 Next steps:');
    console.log('   1. Run: npm run dev');
    console.log('   2. Test company signup in your app');
  } else {
    console.log('❌ Some tests failed. Please run the complete database setup.');
    console.log('');
    console.log('📋 To fix:');
    console.log('   1. Go to: https://supabase.com/dashboard/project/znjtryqrqxjghvvdlvdg/sql/new');
    console.log('   2. Copy and paste the contents of complete-database-setup.sql');
    console.log('   3. Click Run');
    console.log('   4. Run this verification script again: node verify-database.js');
  }

  return allGood;
}

async function main() {
  console.log('🎯 Smart Shift Tracker - Database Verification');
  console.log('============================================');
  
  const success = await verifyDatabase();
  process.exit(success ? 0 : 1);
}

main().catch(console.error);