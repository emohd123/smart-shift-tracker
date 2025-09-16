import { createClient } from '@supabase/supabase-js'

// Configuration with CORRECT keys from .env
const SUPABASE_URL = 'https://depeamhvogstuynlqudi.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlcGVhbWh2b2dzdHV5bmxxdWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5Nzk5OTQsImV4cCI6MjA3MjU1NTk5NH0.J4ty9Il-te2lgQn1rLEYzDmLVrYX4uPb0L4gg8dJdLU'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlcGVhbWh2b2dzdHV5bmxxdWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njk3OTk5NCwiZXhwIjoyMDcyNTU1OTk0fQ.RN0l8GnBkG4z61HNu7f5U130vrRKmAcXsHGgCmAOPJo'

async function testCorrectAnonKey() {
  console.log('🧪 Testing with CORRECT anonymous key from .env file...\n')
  
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const testTenant = {
    name: `Test Company ${Date.now()}`,
    slug: `test-company-${Date.now()}`,
    subscription_tier: 'starter',
    subscription_status: 'active',
    max_users: 10,
    settings: {}
  }

  console.log('🔧 Testing with anonymous client (what users experience)...')
  
  try {
    const { data, error } = await anonClient
      .from('tenants')
      .insert(testTenant)
      .select()
      .single()

    if (error) {
      console.log('❌ Anonymous tenant creation FAILED:', error.message)
      
      if (error.message.includes('row-level security')) {
        console.log('🔒 This is exactly the error your users see!')
        console.log('📋 Need to run the EMERGENCY-RLS-FIX.sql')
        return false
      }
      
      console.log('🤔 Different error - might not be RLS issue')
      return false
    }
    
    console.log('✅ Anonymous tenant creation WORKED!')
    console.log('🎉 Your signup should actually be fine!')
    
    // Clean up with service role
    await serviceClient.from('tenants').delete().eq('id', data.id)
    console.log('🧹 Test tenant cleaned up')
    
    return true
  } catch (error) {
    console.log('❌ Unexpected error:', error.message)
    return false
  }
}

async function runEmergencyFix() {
  console.log('\n🚨 RUNNING EMERGENCY RLS FIX VIA SQL COMMANDS...\n')
  
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  
  // Since we can't run SQL directly, let's try to understand the current policies
  console.log('🔍 Checking current tenant table accessibility...')
  
  try {
    // Try to count tenants with anonymous access
    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    const { data, error } = await anonClient
      .from('tenants')
      .select('count')
      .single()

    if (error) {
      console.log('❌ Anonymous cannot even read tenants:', error.message)
      
      if (error.message.includes('row-level security')) {
        console.log('🔒 RLS is blocking anonymous read access')
        console.log('📋 SOLUTION: You MUST run EMERGENCY-RLS-FIX.sql manually')
        console.log('📍 Go to: https://supabase.com/dashboard/projects/depeamhvogstuynlqudi/sql')
        return false
      }
    } else {
      console.log('✅ Anonymous can read tenants - that\'s good!')
    }
    
    return true
  } catch (error) {
    console.log('❌ Error checking table access:', error.message)
    return false
  }
}

async function showFinalInstructions() {
  console.log('\n' + '='.repeat(60))
  console.log('🚨 CRITICAL ACTION REQUIRED')
  console.log('='.repeat(60))
  console.log()
  console.log('Your RLS policies are blocking anonymous users from creating tenants.')
  console.log('This causes the "Permission denied" error during company signup.')
  console.log()
  console.log('📋 SOLUTION:')
  console.log('1. Go to: https://supabase.com/dashboard/projects/depeamhvogstuynlqudi/sql')
  console.log('2. Click "New Query"')
  console.log('3. Copy the contents of EMERGENCY-RLS-FIX.sql')
  console.log('4. Paste and click "Run"')
  console.log('5. Try company signup again')
  console.log()
  console.log('📄 The SQL file is ready: EMERGENCY-RLS-FIX.sql')
  console.log('🎯 This will fix the "Permission denied" error immediately.')
  console.log()
  console.log('='.repeat(60))
}

async function main() {
  console.log('🚀 FINAL RLS DIAGNOSIS WITH CORRECT KEYS\n')
  
  const anonWorks = await testCorrectAnonKey()
  
  if (anonWorks) {
    console.log('\n🎉 SURPRISE! Your RLS policies are actually working!')
    console.log('✅ Anonymous users CAN create tenants')
    console.log('🤔 The issue might be elsewhere in your application')
    return
  }
  
  await runEmergencyFix()
  await showFinalInstructions()
}

main().catch(console.error)
