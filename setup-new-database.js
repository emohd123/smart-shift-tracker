import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = 'https://depeamhvogstuynlqudi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlcGVhbWh2b2dzdHV5bmxxdWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5Nzk5OTQsImV4cCI6MjA3MjU1NTk5NH0.zAgiD9qZuY7IF_zk53cEvZgSvQhWATkXW9O0I-1u0dQ';
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🚀 Setting up NEW Supabase Database for Smart Shift Tracker');
console.log('===========================================================');
console.log('📍 NEW Project URL:', supabaseUrl);
console.log('🆕 Project ID: depeamhvogstuynlqudi');
console.log('');

async function testDatabaseAccess() {
  console.log('🔍 Testing database access...');
  
  try {
    // Test basic connection
    const { data, error } = await supabase.from('_info').select('*').limit(1);
    
    if (error && error.code === 'PGRST205') {
      console.log('✅ Database connection successful (fresh database detected)');
      return true;
    } else if (error) {
      console.log(`⚠️  Connection test: ${error.message}`);
      return true; // Still proceed with setup
    } else {
      console.log('✅ Database connection successful');
      return true;
    }
  } catch (error) {
    console.log(`❌ Database connection failed: ${error.message}`);
    return false;
  }
}

async function checkExistingTables() {
  console.log('\n📋 Checking existing tables...');
  
  try {
    // Check for tenants table
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id')
      .limit(1);
    
    const { data: memberships, error: membershipsError } = await supabase
      .from('tenant_memberships') 
      .select('id')
      .limit(1);
    
    if (tenantsError && membershipsError) {
      console.log('📝 Database is empty - ready for setup');
      return false; // Tables don't exist
    } else {
      console.log('✅ Tables already exist');
      return true; // Tables exist
    }
    
  } catch (error) {
    console.log('📝 Database appears empty - ready for setup');
    return false;
  }
}

async function createTestTenant() {
  console.log('\n🧪 Testing tenant creation...');
  
  try {
    const testTenant = {
      name: 'Test Company',
      slug: `test-company-${Date.now()}`,
      settings: { test: true }
    };
    
    const { data, error } = await supabase
      .from('tenants')
      .insert([testTenant])
      .select()
      .single();
    
    if (error) {
      console.log(`❌ Cannot create tenant: ${error.message}`);
      console.log('🔧 Database setup required');
      return false;
    } else {
      console.log(`✅ Test tenant created successfully: ${data.name}`);
      
      // Clean up test tenant
      await supabase.from('tenants').delete().eq('id', data.id);
      console.log('🧹 Test tenant cleaned up');
      return true;
    }
    
  } catch (error) {
    console.log(`❌ Tenant creation test failed: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🎯 Starting database verification and setup...');
  
  // Test connection
  const canConnect = await testDatabaseAccess();
  if (!canConnect) {
    console.log('❌ Cannot connect to database');
    return false;
  }
  
  // Check existing tables
  const tablesExist = await checkExistingTables();
  
  if (tablesExist) {
    console.log('\n✅ Tables already exist - testing functionality...');
    const canCreateTenant = await createTestTenant();
    
    if (canCreateTenant) {
      console.log('\n🎉 SUCCESS! Database is fully functional!');
      console.log('✅ Company signup should work immediately');
      return true;
    } else {
      console.log('\n⚠️  Tables exist but policies may need setup');
    }
  }
  
  console.log('\n📋 DATABASE SETUP REQUIRED');
  console.log('===========================');
  console.log('🔗 Go to: https://supabase.com/dashboard/project/depeamhvogstuynlqudi/sql/new');
  console.log('📄 Copy and paste the ENTIRE contents of QUICK-DATABASE-SETUP.sql');
  console.log('▶️  Click RUN button');
  console.log('');
  console.log('💡 After running the script:');
  console.log('   • Company signup will work');
  console.log('   • Multi-tenant functionality enabled');
  console.log('   • No more "table not found" errors');
  console.log('');
  console.log('🧪 Then run: node verify-database.js');
  
  return false;
}

main().then(success => {
  if (success) {
    console.log('\n🚀 Your Smart Shift Tracker is ready to use!');
  } else {
    console.log('\n🔧 Please complete the database setup as shown above');
  }
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Setup check failed:', error.message);
  process.exit(1);
});