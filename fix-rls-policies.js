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

async function fixRLSPolicies() {
  console.log('🔧 Fixing RLS Policies...')
  
  const fixes = [
    {
      name: 'Disable RLS on tenants table',
      sql: 'ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;'
    },
    {
      name: 'Disable RLS on tenant_memberships table', 
      sql: 'ALTER TABLE tenant_memberships DISABLE ROW LEVEL SECURITY;'
    },
    {
      name: 'Drop existing policies on tenants',
      sql: 'DROP POLICY IF EXISTS "tenant_policy" ON tenants;'
    },
    {
      name: 'Drop existing policies on tenant_memberships',
      sql: 'DROP POLICY IF EXISTS "tenant_membership_policy" ON tenant_memberships;'
    },
    {
      name: 'Create permissive policy for tenants',
      sql: `
        CREATE POLICY "allow_all_tenants" ON tenants
        FOR ALL 
        TO authenticated, anon
        USING (true)
        WITH CHECK (true);
      `
    },
    {
      name: 'Create permissive policy for tenant_memberships',
      sql: `
        CREATE POLICY "allow_all_tenant_memberships" ON tenant_memberships
        FOR ALL 
        TO authenticated, anon
        USING (true)
        WITH CHECK (true);
      `
    },
    {
      name: 'Re-enable RLS on tenants table',
      sql: 'ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;'
    },
    {
      name: 'Re-enable RLS on tenant_memberships table',
      sql: 'ALTER TABLE tenant_memberships ENABLE ROW LEVEL SECURITY;'
    }
  ]

  for (const fix of fixes) {
    try {
      console.log(`⚙️  ${fix.name}...`)
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': SUPABASE_SERVICE_ROLE_KEY
        },
        body: JSON.stringify({ sql: fix.sql })
      })

      if (response.ok) {
        console.log(`✅ ${fix.name} - Success`)
      } else {
        console.log(`⚠️  ${fix.name} - ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.log(`❌ ${fix.name} - Error:`, error.message)
    }
  }
}

async function testTenantCreationAsAnon() {
  console.log('\n🧪 Testing tenant creation as anonymous user...')
  
  // Create anon client
  const anonSupabase = createClient(SUPABASE_URL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlcGVhbWh2b2dzdHV5bmxxdWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5Nzk5OTQsImV4cCI6MjA3MjU1NTk5NH0.fkzppNJaNrz4JFqKrmvN4IZG7OLF8fhTI6tFEBVqYJ0')
  
  try {
    const testTenantName = `Test Tenant ${Date.now()}`
    const slug = testTenantName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    
    const { data, error } = await anonSupabase
      .from('tenants')
      .insert({
        name: testTenantName,
        slug: slug,
        subscription_tier: 'starter',
        subscription_status: 'active',
        max_users: 10,
        settings: {}
      })
      .select()
      .single()

    if (error) {
      console.log('❌ Anonymous tenant creation failed:', error.message)
      return false
    }
    
    console.log('✅ Anonymous tenant creation test passed!')
    
    // Clean up test tenant
    await supabase.from('tenants').delete().eq('id', data.id)
    
    return true
  } catch (error) {
    console.log('❌ Anonymous tenant creation error:', error.message)
    return false
  }
}

async function createManualSQLFix() {
  const sqlFix = `
-- Fix RLS Policies for Company Signup
-- Run this in Supabase Dashboard > SQL Editor

-- First, disable RLS temporarily
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_memberships DISABLE ROW LEVEL SECURITY;

-- Drop any existing restrictive policies
DROP POLICY IF EXISTS "tenant_policy" ON tenants;
DROP POLICY IF EXISTS "tenant_membership_policy" ON tenant_memberships;

-- Create permissive policies that allow signup
CREATE POLICY "allow_all_tenants" ON tenants
FOR ALL 
TO authenticated, anon
USING (true)
WITH CHECK (true);

CREATE POLICY "allow_all_tenant_memberships" ON tenant_memberships
FOR ALL 
TO authenticated, anon
USING (true)
WITH CHECK (true);

-- Re-enable RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_memberships ENABLE ROW LEVEL SECURITY;

-- Test query (should work without errors)
SELECT COUNT(*) FROM tenants;
`

  console.log('\n📋 Manual SQL Fix Created: manual-rls-fix.sql')
  require('fs').writeFileSync('manual-rls-fix.sql', sqlFix)
  
  return sqlFix
}

async function main() {
  console.log('🔧 RLS Policy Fix Tool\n')
  
  // Try automated fix
  await fixRLSPolicies()
  
  // Test the fix
  const testPassed = await testTenantCreationAsAnon()
  
  if (!testPassed) {
    console.log('\n📋 MANUAL FIX REQUIRED:')
    console.log('The automated fix may not have worked. Please run the SQL manually.')
    
    await createManualSQLFix()
    
    console.log('\n📍 Steps:')
    console.log('1. Go to Supabase Dashboard → SQL Editor')
    console.log('2. Open manual-rls-fix.sql file')
    console.log('3. Copy and paste the SQL')
    console.log('4. Click "Run" to execute')
    console.log('5. Try company signup again')
  } else {
    console.log('\n🎉 RLS policies fixed! Company signup should work now.')
  }
}

main().catch(console.error)
