
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

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
    // Get certificate reference from URL
    const url = new URL(req.url)
    const referenceNumber = url.searchParams.get('reference')

    if (!referenceNumber) {
      return new Response(
        JSON.stringify({ error: 'Certificate reference number is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // First call the function to log this verification attempt
    await supabase.rpc(
      'log_certificate_verification',
      { 
        ref_number: referenceNumber,
        ip_address: req.headers.get('x-real-ip') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown'
      }
    );

    // Check if certificate is valid using our new function
    const { data: isValid, error: validityError } = await supabase.rpc(
      'is_certificate_valid',
      { ref_number: referenceNumber }
    );

    if (validityError) {
      console.error('Error checking certificate validity:', validityError);
      return new Response(
        JSON.stringify({ error: 'Error checking certificate validity', details: validityError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (!isValid) {
      return new Response(
        JSON.stringify({ 
          error: 'Certificate not found or invalid', 
          valid: false,
          details: 'The certificate may be expired, revoked, or does not exist' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Fetch certificate data
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('reference_number', referenceNumber)
      .single()

    if (error) {
      console.error('Error fetching certificate:', error)
      return new Response(
        JSON.stringify({ error: 'Certificate not found', details: error.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Fetch promoter name separately to avoid join issues
    const { data: promoterData, error: promoterError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', data.user_id)
      .single()

    // Format the response data
    const formattedData = {
      reference_number: data.reference_number,
      promoter_name: promoterError ? 'Promoter' : promoterData.full_name,
      issue_date: data.issue_date,
      issued_date: data.issued_date,
      time_period: data.time_period,
      total_hours: data.total_hours,
      verified: true,
      status: data.status || 'approved',
      position_title: data.position_title || 'Brand Promoter',
      skills_gained: data.skills_gained || ['Communication', 'Customer Service', 'Sales'],
      performance_rating: data.performance_rating || 5,
      expiration_date: data.expiration_date
    }

    return new Response(
      JSON.stringify({ 
        certificate: formattedData,
        valid: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
