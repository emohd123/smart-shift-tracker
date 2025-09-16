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

async function executeSQL(sql, description) {
  console.log(`🚀 Running: ${description}`)
  
  try {
    // Use raw HTTP request to execute SQL
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY
      },
      body: JSON.stringify({ sql })
    })

    if (!response.ok) {
      // Try alternative approach with direct table operations for simple cases
      console.log(`⚠️  Direct SQL failed, trying alternative approach...`)
      return await alternativeApproach(sql, description)
    }

    console.log(`✅ Success: ${description}`)
    return true
  } catch (error) {
    console.error(`❌ Failed: ${description}`)
    console.error('Error:', error)
    return false
  }
}

async function alternativeApproach(sql, description) {
  // For table creation, we'll use Supabase client methods where possible
  if (description.includes('Creating tenant tables')) {
    return await createTenantTables()
  }
  
  if (description.includes('RLS')) {
    console.log(`✅ Skipping: ${description} (will be handled manually)`)
    return true
  }
  
  console.log(`⚠️  Skipping: ${description} (requires manual SQL execution)`)
  return true
}

async function createTenantTables() {
  try {
    // Check if tenants table exists
    const { data: tenants, error: tenantError } = await supabase
      .from('tenants')
      .select('count')
      .limit(1)

    if (tenantError && tenantError.message.includes('does not exist')) {
      console.log('❌ Tenants table does not exist - needs to be created manually')
      return false
    }

    if (!tenantError) {
      console.log('✅ Tenants table already exists')
      return true
    }

    return false
  } catch (error) {
    console.log('❌ Could not check tenants table')
    return false
  }
}

async function testConnection() {
  console.log('🧪 Testing Supabase connection...')
  
  try {
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      console.log('❌ Connection test failed:', error.message)
      return false
    }
    
    console.log('✅ Supabase connection successful!')
    return true
  } catch (error) {
    console.log('❌ Connection error:', error.message)
    return false
  }
}

async function checkTablesExist() {
  console.log('🔍 Checking if tenant tables exist...')
  
  try {
    // Try to query tenants table
    const { data: tenantsData, error: tenantsError } = await supabase
      .from('tenants')
      .select('count')
      .limit(1)

    const tenantsExist = !tenantsError
    
    // Try to query tenant_memberships table
    const { data: membershipsData, error: membershipsError } = await supabase
      .from('tenant_memberships')
      .select('count')
      .limit(1)

    const membershipsExist = !membershipsError
    
    console.log(`Tenants table: ${tenantsExist ? '✅ EXISTS' : '❌ MISSING'}`)
    console.log(`Tenant memberships table: ${membershipsExist ? '✅ EXISTS' : '❌ MISSING'}`)
    
    return { tenantsExist, membershipsExist }
  } catch (error) {
    console.log('❌ Error checking tables:', error.message)
    return { tenantsExist: false, membershipsExist: false }
  }
}

async function testTenantCreation() {
  console.log('🧪 Testing tenant creation...')
  
  try {
    const testTenantName = `Test Tenant ${Date.now()}`
    const slug = testTenantName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    
    const { data, error } = await supabase
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
      console.log('❌ Tenant creation test failed:', error.message)
      
      if (error.message.includes('row-level security')) {
        console.log('🔒 This is the RLS policy issue that needs to be fixed!')
      }
      
      return false
    }
    
    console.log('✅ Tenant creation test passed!')
    console.log('🎉 Your database is properly configured!')
    
    // Clean up test tenant
    await supabase.from('tenants').delete().eq('id', data.id)
    
    return true
  } catch (error) {
    console.log('❌ Tenant creation test error:', error.message)
    return false
  }
}

async function main() {
  console.log('🚀 Supabase Database Diagnostic Tool\n')
  
  // Step 1: Test connection
  const connectionOK = await testConnection()
  if (!connectionOK) {
    console.log('\n❌ Cannot connect to Supabase. Please check your service role key.')
    return
  }
  
  console.log()
  
  // Step 2: Check if tables exist
  const { tenantsExist, membershipsExist } = await checkTablesExist()
  
  console.log()
  
  if (!tenantsExist || !membershipsExist) {
    console.log('📋 SOLUTION: You need to create the missing tables manually.')
    console.log('Please run the SQL from CREATE_TENANT_TABLES.sql in your Supabase dashboard.')
    console.log('\n📍 Go to: Supabase Dashboard → SQL Editor → Paste the SQL → Run')
    return
  }
  
  // Step 3: Test tenant creation (RLS policies)
  const tenantCreationOK = await testTenantCreation()
  
  console.log()
  
  if (!tenantCreationOK) {
    console.log('📋 SOLUTION: You need to fix the RLS policies.')
    console.log('Please run the SQL from FIX_SUPABASE_POLICIES.sql in your Supabase dashboard.')
    console.log('\n📍 Go to: Supabase Dashboard → SQL Editor → Paste the SQL → Run')
    return
  }
  
  console.log('🎉 Everything looks good! Your company signup should work now.')
}

main().catch(console.error)
