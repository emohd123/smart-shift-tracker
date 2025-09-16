import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://znjtryqrqxjghvvdlvdg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuanRyeXFycXhqZ2h2dmRsdmRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5Nzk4MjUsImV4cCI6MjA3MjU1NTgyNX0.cnozRMnDLTsdMRs5-Uql38x5uZTh7l4WZuSSs4-H-34'
const supabase = createClient(supabaseUrl, supabaseKey)

async function testCompanySignup() {
  try {
    console.log('Testing company signup flow...')

    const testEmail = `company${Date.now()}@gmail.com`
    const testPassword = 'CompanyPass123!'
    const testName = 'Test Company Admin'
    const companyName = `Test Company ${Date.now()}`

    console.log('Step 1: Creating auth user...')
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: testName,
          role: 'company_admin'
        }
      }
    })

    if (authError) {
      console.error('❌ Auth creation failed:', authError)
      return false
    }

    if (!authData.user) {
      console.error('❌ No user data returned')
      return false
    }

    console.log('✅ Auth user created:', authData.user.id)

    console.log('Step 2: Creating tenant...')
    const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    
    const { data: tenantData, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: companyName,
        slug: slug,
        subscription_tier: 'starter',
        subscription_status: 'active',
        max_users: 10,
        settings: {}
      })
      .select()
      .single()

    if (tenantError) {
      console.error('❌ Tenant creation failed:', tenantError)
      console.error('This is the RLS policy issue that needs to be fixed!')
      return false
    }

    console.log('✅ Tenant created:', tenantData.id)

    console.log('Step 3: Creating membership...')
    const { error: membershipError } = await supabase
      .from('tenant_memberships')
      .insert({
        tenant_id: tenantData.id,
        user_id: authData.user.id,
        role: 'company_admin',
        status: 'active',
        joined_at: new Date().toISOString()
      })

    if (membershipError) {
      console.error('❌ Membership creation failed:', membershipError)
      return false
    }

    console.log('✅ Membership created successfully!')
    console.log('🎉 Company signup flow test PASSED!')
    return true

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return false
  }
}

testCompanySignup()
