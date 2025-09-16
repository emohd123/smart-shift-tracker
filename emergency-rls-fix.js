import { createClient } from '@supabase/supabase-js'

// Configuration
const SUPABASE_URL = 'https://depeamhvogstuynlqudi.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlcGVhbWh2b2dzdHV5bmxxdWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njk3OTk5NCwiZXhwIjoyMDcyNTU1OTk0fQ.RN0l8GnBkG4z61HNu7f5U130vrRKmAcXsHGgCmAOPJo'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function forceCreateTenant() {
  console.log('🚀 FORCING TENANT CREATION (bypassing RLS)\n')
  
  const testTenant = {
    name: `Test Company ${Date.now()}`,
    slug: `test-company-${Date.now()}`,
    subscription_tier: 'starter',
    subscription_status: 'active',
    max_users: 10,
    settings: {}
  }

  console.log('🔧 Attempting tenant creation with service role...')
  
  try {
    // Using service role key should bypass RLS
    const { data, error } = await supabase
      .from('tenants')
      .insert(testTenant)
      .select()
      .single()

    if (error) {
      console.log('❌ Service role tenant creation failed:', error.message)
      
      if (error.message.includes('row-level security')) {
        console.log('🔒 RLS is still blocking even service role!')
        console.log('📋 This means RLS policies are very restrictive.')
        return false
      }
      
      if (error.message.includes('does not exist')) {
        console.log('📋 Tables do not exist. Need to create them first.')
        return false
      }
      
      return false
    }
    
    console.log('✅ Tenant created successfully with service role!')
    console.log('🎉 This means your RLS policies are actually working correctly.')
    
    // Clean up
    await supabase.from('tenants').delete().eq('id', data.id)
    console.log('🧹 Test tenant cleaned up.')
    
    return true
  } catch (error) {
    console.log('❌ Unexpected error:', error.message)
    return false
  }
}

async function testWithAnonKey() {
  console.log('\n🧪 Testing with anonymous key (simulating signup)...')
  
  const anonClient = createClient(
    SUPABASE_URL,
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlcGVhbWh2b2dzdHV5bmxxdWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5Nzk5OTQsImV4cCI6MjA3MjU1NTk5NH0.fkzppNJaNrz4JFqKrmvN4IZG7OLF8fhTI6tFEBVqYJ0'
  )

  const testTenant = {
    name: `Anon Test Company ${Date.now()}`,
    slug: `anon-test-${Date.now()}`,
    subscription_tier: 'starter',
    subscription_status: 'active',
    max_users: 10,
    settings: {}
  }

  try {
    const { data, error } = await anonClient
      .from('tenants')
      .insert(testTenant)
      .select()
      .single()

    if (error) {
      console.log('❌ Anonymous tenant creation failed:', error.message)
      
      if (error.message.includes('row-level security')) {
        console.log('🔒 This is the exact error your users are seeing!')
        console.log('📋 RLS policies need to be made more permissive.')
      }
      
      return false
    }
    
    console.log('✅ Anonymous tenant creation worked!')
    console.log('🎉 Your signup should work fine.')
    
    // Clean up with service role
    await supabase.from('tenants').delete().eq('id', data.id)
    
    return true
  } catch (error) {
    console.log('❌ Unexpected anonymous error:', error.message)
    return false
  }
}

async function createSQLFile() {
  const sql = `-- EMERGENCY RLS FIX - Copy this and run in Supabase SQL Editor
-- This will make RLS policies very permissive to allow signup

-- Step 1: Temporarily disable RLS
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_memberships DISABLE ROW LEVEL SECURITY;

-- Step 2: Remove all existing policies
DROP POLICY IF EXISTS "tenant_policy" ON tenants;
DROP POLICY IF EXISTS "tenant_membership_policy" ON tenant_memberships;
DROP POLICY IF EXISTS "Users can view their own tenant" ON tenants;
DROP POLICY IF EXISTS "Users can view memberships for their tenant" ON tenant_memberships;
DROP POLICY IF EXISTS "allow_all_tenants" ON tenants;
DROP POLICY IF EXISTS "allow_all_tenant_memberships" ON tenant_memberships;

-- Step 3: Create ultra-permissive policies
CREATE POLICY "emergency_tenant_access" ON tenants
FOR ALL 
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "emergency_membership_access" ON tenant_memberships
FOR ALL 
TO public  
USING (true)
WITH CHECK (true);

-- Step 4: Re-enable RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_memberships ENABLE ROW LEVEL SECURITY;

-- Test query
SELECT 'Emergency RLS fix completed!' as status, COUNT(*) as tenant_count FROM tenants;`

  console.log('\n📄 Creating emergency SQL fix file...')
  
  // Write to file
  require('fs').writeFileSync('EMERGENCY-RLS-FIX.sql', sql)
  
  console.log('✅ Created: EMERGENCY-RLS-FIX.sql')
  console.log('\n🚨 URGENT: Copy this SQL and run it in Supabase Dashboard!')
  console.log('📍 https://supabase.com/dashboard/projects/depeamhvogstuynlqudi/sql')
}

async function main() {
  console.log('🚨 EMERGENCY RLS DIAGNOSTICS AND FIX\n')
  
  // Test with service role first
  const serviceRoleWorks = await forceCreateTenant()
  
  if (!serviceRoleWorks) {
    console.log('\n❌ Even service role cannot create tenants!')
    console.log('🔧 Creating emergency SQL fix...')
    await createSQLFile()
    return
  }
  
  // Test with anon key (what users experience)
  const anonWorks = await testWithAnonKey()
  
  if (!anonWorks) {
    console.log('\n❌ Anonymous users cannot create tenants (this is your issue)')
    console.log('🔧 Creating emergency SQL fix...')
    await createSQLFile()
    return
  }
  
  console.log('\n🎉 Both service role and anonymous work!')
  console.log('✅ Your RLS policies are actually fine.')
  console.log('🤔 The issue might be in your application code.')
}

main().catch(console.error)
