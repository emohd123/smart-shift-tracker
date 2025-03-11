
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.26.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // First, attempt to delete any existing admin user with this email
    // This helps if there was a previously created account with wrong credentials
    try {
      const { data: existingUsers, error: checkError } = await supabaseAdminClient.auth.admin.listUsers()

      if (!checkError && existingUsers) {
        const adminUser = existingUsers.users.find(user => user.email === 'emohd123@gmail.com')
        
        if (adminUser) {
          console.log('Found existing admin user, attempting to delete it first:', adminUser.id)
          const { error: deleteError } = await supabaseAdminClient.auth.admin.deleteUser(
            adminUser.id
          )

          if (deleteError) {
            console.error('Error deleting existing admin user:', deleteError)
          } else {
            console.log('Successfully deleted existing admin user')
          }
        }
      }
    } catch (deleteAttemptError) {
      console.error('Error during delete attempt:', deleteAttemptError)
      // Continue with the rest of the function, even if deletion failed
    }

    console.log('Creating new admin user with email: emohd123@gmail.com')

    // Create the admin user
    const { data, error: createError } = await supabaseAdminClient.auth.admin.createUser({
      email: 'emohd123@gmail.com',
      password: 'password123',
      email_confirm: true,
      user_metadata: { name: 'Admin User' }
    })

    if (createError) {
      console.error('Error creating admin user:', createError)
      return new Response(
        JSON.stringify({ error: 'Error creating admin user', details: createError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    console.log('Admin user created or updated successfully:', data)

    return new Response(
      JSON.stringify({ 
        message: 'Admin user created successfully', 
        user: data.user,
        instructions: 'You can now login with emohd123@gmail.com and password123'  
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
