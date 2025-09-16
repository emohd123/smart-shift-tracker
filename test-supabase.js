import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://znjtryqrqxjghvvdlvdg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuanRyeXFycXhqZ2h2dmRsdmRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5Nzk4MjUsImV4cCI6MjA3MjU1NTgyNX0.cnozRMnDLTsdMRs5-Uql38x5uZTh7l4WZuSSs4-H-34'
const supabase = createClient(supabaseUrl, supabaseKey)

async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...')

    // Test basic connection by checking if we can access the auth service
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.error('Supabase connection error:', error)
      return false
    }

    console.log('✅ Supabase connection successful!')
    console.log('Session data:', data)

    // Test a simple query to the database
    const { data: testData, error: queryError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)

    if (queryError) {
      console.log('⚠️  Database query test failed (this might be expected if no profiles table exists):', queryError.message)
    } else {
      console.log('✅ Database query test successful!')
      console.log('Query result:', testData)
    }

    return true
  } catch (error) {
    console.error('❌ Unexpected error testing Supabase:', error)
    return false
  }
}

testSupabaseConnection()
