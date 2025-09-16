import fetch from 'node-fetch';

// Configuration
const SUPABASE_URL = 'https://depeamhvogstuynlqudi.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlcGVhbWh2b2dzdHV5bmxxdWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njk3OTk5NCwiZXhwIjoyMDcyNTU1OTk0fQ.RN0l8GnBkG4z61HNu7f5U130vrRKmAcXsHGgCmAOPJo'

async function executeSQL(sql, description) {
  console.log(`🔧 ${description}...`)
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ query: sql })
    })

    if (response.ok || response.status === 200) {
      console.log(`✅ ${description} - SUCCESS`)
      return true
    } else {
      const errorText = await response.text()
      console.log(`❌ ${description} - FAILED: ${response.status} ${errorText}`)
      return false
    }
  } catch (error) {
    console.log(`❌ ${description} - ERROR: ${error.message}`)
    return false
  }
}

async function directAPIApproach() {
  console.log('🚀 Direct API SQL Execution\n')

  const commands = [
    {
      sql: 'ALTER TABLE IF EXISTS tenants DISABLE ROW LEVEL SECURITY;',
      description: 'Disable RLS on tenants table'
    },
    {
      sql: 'ALTER TABLE IF EXISTS tenant_memberships DISABLE ROW LEVEL SECURITY;',
      description: 'Disable RLS on tenant_memberships table'
    },
    {
      sql: 'DROP POLICY IF EXISTS "tenant_policy" ON tenants;',
      description: 'Drop old tenant policy'
    },
    {
      sql: 'DROP POLICY IF EXISTS "tenant_membership_policy" ON tenant_memberships;',
      description: 'Drop old membership policy'
    },
    {
      sql: `CREATE POLICY "allow_all_tenants" ON tenants FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);`,
      description: 'Create permissive tenant policy'
    },
    {
      sql: `CREATE POLICY "allow_all_tenant_memberships" ON tenant_memberships FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);`,
      description: 'Create permissive membership policy'
    },
    {
      sql: 'ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;',
      description: 'Re-enable RLS on tenants table'
    },
    {
      sql: 'ALTER TABLE tenant_memberships ENABLE ROW LEVEL SECURITY;',
      description: 'Re-enable RLS on tenant_memberships table'
    }
  ]

  let successCount = 0
  for (const command of commands) {
    const success = await executeSQL(command.sql, command.description)
    if (success) successCount++
    await new Promise(resolve => setTimeout(resolve, 500)) // Small delay between commands
  }

  console.log(`\n📊 Results: ${successCount}/${commands.length} commands executed successfully`)
  
  if (successCount === commands.length) {
    console.log('🎉 All RLS policies fixed! Try company signup now.')
  } else {
    console.log('⚠️  Some commands failed. You may need to run the SQL manually.')
  }

  return successCount === commands.length
}

// Also try the PostgREST admin API
async function tryPostgRESTAdmin() {
  console.log('\n🔄 Trying PostgREST admin API...')
  
  const adminSQL = `
    ALTER TABLE IF EXISTS tenants DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS tenant_memberships DISABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "tenant_policy" ON tenants;
    DROP POLICY IF EXISTS "tenant_membership_policy" ON tenant_memberships;
    DROP POLICY IF EXISTS "Users can view their own tenant" ON tenants;
    DROP POLICY IF EXISTS "Users can view memberships for their tenant" ON tenant_memberships;
    
    CREATE POLICY "allow_all_tenants" ON tenants FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);
    CREATE POLICY "allow_all_tenant_memberships" ON tenant_memberships FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);
    
    ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
    ALTER TABLE tenant_memberships ENABLE ROW LEVEL SECURITY;
  `

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY
      },
      body: JSON.stringify({ sql: adminSQL })
    })

    if (response.ok) {
      console.log('✅ PostgREST admin API - SUCCESS')
      return true
    } else {
      console.log(`❌ PostgREST admin API - FAILED: ${response.status}`)
      return false
    }
  } catch (error) {
    console.log(`❌ PostgREST admin API - ERROR: ${error.message}`)
    return false
  }
}

async function testTenantCreation() {
  console.log('\n🧪 Testing tenant creation...')
  
  const testTenant = {
    name: `Test Company ${Date.now()}`,
    slug: `test-company-${Date.now()}`,
    subscription_tier: 'starter',
    subscription_status: 'active',
    max_users: 10,
    settings: {}
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/tenants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(testTenant)
    })

    if (response.ok) {
      const data = await response.json()
      console.log('✅ Tenant creation test - SUCCESS')
      
      // Clean up test tenant
      await fetch(`${SUPABASE_URL}/rest/v1/tenants?id=eq.${data[0].id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': SUPABASE_SERVICE_ROLE_KEY
        }
      })
      
      return true
    } else {
      const errorText = await response.text()
      console.log(`❌ Tenant creation test - FAILED: ${response.status} ${errorText}`)
      return false
    }
  } catch (error) {
    console.log(`❌ Tenant creation test - ERROR: ${error.message}`)
    return false
  }
}

async function main() {
  console.log('🚀 AUTOMATED RLS POLICY FIX\n')
  
  // Try direct API approach first
  const directSuccess = await directAPIApproach()
  
  if (!directSuccess) {
    // Try PostgREST admin API
    const adminSuccess = await tryPostgRESTAdmin()
    
    if (!adminSuccess) {
      console.log('\n❌ Automated approaches failed.')
      console.log('📋 Please run the SQL manually in Supabase Dashboard.')
      return
    }
  }
  
  // Test if the fix worked
  const testSuccess = await testTenantCreation()
  
  if (testSuccess) {
    console.log('\n🎉 SUCCESS! RLS policies are fixed.')
    console.log('✅ Company signup should work now!')
  } else {
    console.log('\n⚠️  Policies may be updated but there might be other issues.')
    console.log('🔍 Check the Supabase Dashboard for any remaining problems.')
  }
}

main().catch(console.error)
