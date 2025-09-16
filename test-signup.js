import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://znjtryqrqxjghvvdlvdg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuanRyeXFycXhqZ2h2dmRsdmRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5Nzk4MjUsImV4cCI6MjA3MjU1NTgyNX0.cnozRMnDLTsdMRs5-Uql38x5uZTh7l4WZuSSs4-H-34'
const supabase = createClient(supabaseUrl, supabaseKey)

async function testSignup() {
  try {
    console.log('Testing signup with minimal data...')

    const testEmail = `test${Date.now()}@gmail.com`
    const testPassword = 'TestPass123!'
    const testName = 'Test User'

    console.log('Attempting signup with:', { email: testEmail, name: testName })

    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: testName
        }
      }
    })

    if (error) {
      console.error('❌ Signup failed:', error)
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        name: error.name
      })
      return false
    }

    if (data.user) {
      console.log('✅ Signup successful!')
      console.log('User created:', {
        id: data.user.id,
        email: data.user.email,
        created_at: data.user.created_at,
        email_confirmed_at: data.user.email_confirmed_at
      })

      // Test if we can sign in immediately
      console.log('Testing immediate sign-in...')
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      })

      if (signInError) {
        console.log('⚠️  Sign-in failed (might need email confirmation):', signInError.message)
      } else {
        console.log('✅ Sign-in successful!')
      }

      return true
    } else {
      console.error('❌ No user data returned')
      return false
    }

  } catch (error) {
    console.error('❌ Unexpected error during signup test:', error)
    return false
  }
}

testSignup()
