import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

console.log('🚀 Quick Database Setup for Smart Shift Tracker');
console.log('================================================');

// Use the new project credentials
const supabaseUrl = 'https://depeamhvogstuynlqudi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlcGVhbWh2b2dzdHV5bmxxdWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5Nzk5OTQsImV4cCI6MjA3MjU1NTk5NH0.zAgiD9qZuY7IF_zk53cEvZgSvQhWATkXW9O0I-1u0dQ';

const supabase = createClient(supabaseUrl, supabaseKey);

// Check if QUICK-DATABASE-SETUP.sql exists
const sqlFilePath = './QUICK-DATABASE-SETUP.sql';

async function checkDatabaseStatus() {
  console.log('🔍 Checking current database status...');
  
  try {
    // Test tenants table
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id')
      .limit(1);
    
    // Test tenant_memberships table  
    const { data: memberships, error: membershipsError } = await supabase
      .from('tenant_memberships')
      .select('id')
      .limit(1);
    
    if (!tenantsError && !membershipsError) {
      console.log('✅ Database already set up correctly!');
      console.log('🎉 Company signup should work now');
      return true;
    } else {
      console.log('📝 Database needs setup');
      return false;
    }
  } catch (error) {
    console.log('📝 Database needs setup');
    return false;
  }
}

async function createBasicTables() {
  console.log('🛠️  Creating basic database tables...');
  
  const createTenantsSQL = `
    CREATE TABLE IF NOT EXISTS public.tenants (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      domain TEXT UNIQUE,
      settings JSONB NOT NULL DEFAULT '{}',
      subscription_tier TEXT DEFAULT 'starter',
      subscription_status TEXT DEFAULT 'active',
      max_users INTEGER NOT NULL DEFAULT 50,
      stripe_customer_id TEXT UNIQUE,
      billing_email TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;
  
  const createMembershipsSQL = `
    CREATE TABLE IF NOT EXISTS public.tenant_memberships (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL,
      user_id UUID NOT NULL,
      role TEXT NOT NULL DEFAULT 'part_timer',
      status TEXT NOT NULL DEFAULT 'active',
      invited_by UUID,
      invited_at TIMESTAMPTZ,
      joined_at TIMESTAMPTZ DEFAULT now(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE(tenant_id, user_id)
    );
  `;
  
  try {
    // Note: This is a simplified setup that may require manual completion
    console.log('⚠️  Automated table creation has limitations with Supabase RLS');
    console.log('📋 RECOMMENDED MANUAL SETUP:');
    console.log('');
    console.log('1. Open: https://supabase.com/dashboard/project/depeamhvogstuynlqudi/sql/new');
    console.log('2. Copy the following SQL and paste it:');
    console.log('');
    console.log('-- ESSENTIAL TABLES FOR SMART SHIFT TRACKER');
    console.log(createTenantsSQL);
    console.log(createMembershipsSQL);
    console.log('');
    console.log('-- ENABLE BASIC POLICIES');
    console.log('ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;');
    console.log('ALTER TABLE public.tenant_memberships ENABLE ROW LEVEL SECURITY;');
    console.log('');
    console.log('-- ALLOW SIGNUP');
    console.log('CREATE POLICY "signup_policy" ON public.tenants FOR INSERT TO authenticated WITH CHECK (true);');
    console.log('CREATE POLICY "membership_policy" ON public.tenant_memberships FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());');
    console.log('');
    console.log('3. Click RUN');
    console.log('');
    console.log('4. Then run: node test-signup.js');
    
    return false; // Require manual setup
  } catch (error) {
    console.log(`❌ Setup error: ${error.message}`);
    return false;
  }
}

async function createTestTenant() {
  console.log('🧪 Testing tenant creation capability...');
  
  try {
    const testTenant = {
      name: 'Test Company',
      slug: `test-${Date.now()}`,
      settings: { test: true }
    };
    
    const { data, error } = await supabase
      .from('tenants')
      .insert([testTenant])
      .select()
      .single();
    
    if (error) {
      console.log(`❌ Cannot create tenant: ${error.message}`);
      return false;
    } else {
      console.log(`✅ Test tenant created: ${data.name}`);
      
      // Clean up
      await supabase.from('tenants').delete().eq('id', data.id);
      console.log('🧹 Test tenant cleaned up');
      return true;
    }
  } catch (error) {
    console.log(`❌ Tenant creation failed: ${error.message}`);
    return false;
  }
}

async function main() {
  const isSetup = await checkDatabaseStatus();
  
  if (isSetup) {
    console.log('🎯 Testing tenant creation...');
    const canCreate = await createTestTenant();
    
    if (canCreate) {
      console.log('🚀 SUCCESS! Your database is fully functional!');
      console.log('✅ Company signup will work perfectly');
      console.log('');
      console.log('🎉 You can now test company registration in your app!');
    } else {
      console.log('⚠️  Tables exist but policies need adjustment');
      await createBasicTables();
    }
  } else {
    console.log('🔧 Database setup needed...');
    await createBasicTables();
  }
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  console.log('');
  console.log('📋 Please set up the database manually:');
  console.log('1. Go to: https://supabase.com/dashboard/project/depeamhvogstuynlqudi/sql/new');
  console.log('2. Copy contents of QUICK-DATABASE-SETUP.sql');
  console.log('3. Click RUN');
});