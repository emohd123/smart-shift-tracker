
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

    // Check if admin already exists
    const { data: existingUsers, error: checkError } = await supabaseAdminClient.auth.admin.listUsers({
      filter: {
        email: 'emohd123@gmail.com',
      },
    })

    if (checkError) {
      console.error('Error checking user:', checkError)
      return new Response(
        JSON.stringify({ error: 'Error checking user' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // If admin doesn't exist, create it
    if (!existingUsers || existingUsers.users.length === 0) {
      const { data, error: createError } = await supabaseAdminClient.auth.admin.createUser({
        email: 'emohd123@gmail.com',
        password: 'password123',
        email_confirm: true, // Auto-confirm email
        user_metadata: { name: 'Admin User' }
      })

      if (createError) {
        console.error('Error creating admin user:', createError)
        return new Response(
          JSON.stringify({ error: 'Error creating admin user' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }

      return new Response(
        JSON.stringify({ message: 'Admin user created successfully', user: data.user }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ message: 'Admin user already exists' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
