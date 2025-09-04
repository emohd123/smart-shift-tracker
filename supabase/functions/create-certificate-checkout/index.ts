import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.9.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-08-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface CheckoutRequest {
  certificate_request_id: string
  success_url: string
  cancel_url: string
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get user from JWT
    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader)
    if (authError || !user) {
      throw new Error('Invalid authorization token')
    }

    // Parse request body
    const body: CheckoutRequest = await req.json()
    const { certificate_request_id, success_url, cancel_url } = body

    if (!certificate_request_id || !success_url || !cancel_url) {
      throw new Error('Missing required fields: certificate_request_id, success_url, cancel_url')
    }

    // Fetch and validate certificate request
    const { data: certRequest, error: fetchError } = await supabase
      .from('certificate_requests')
      .select(`
        *,
        tenant:tenants(name),
        user:profiles!part_timer_id(full_name, email)
      `)
      .eq('id', certificate_request_id)
      .eq('part_timer_id', user.id) // Ensure user owns this request
      .single()

    if (fetchError || !certRequest) {
      throw new Error('Certificate request not found or access denied')
    }

    if (certRequest.status !== 'draft') {
      throw new Error('Certificate request is not in draft status')
    }

    // Validate the request has sufficient work hours
    const { data: isValid, error: validationError } = await supabase
      .rpc('validate_certificate_request', {
        p_request_id: certificate_request_id
      })

    if (validationError || !isValid) {
      throw new Error('Certificate request validation failed - insufficient approved work hours')
    }

    // Get or create Stripe customer
    let customerId = certRequest.tenant?.stripe_customer_id
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: certRequest.user?.full_name || 'Smart Shift User',
        metadata: {
          tenant_id: certRequest.tenant_id,
          user_id: user.id,
        },
      })
      customerId = customer.id
      
      // Update tenant with customer ID
      await supabase
        .from('tenants')
        .update({ stripe_customer_id: customerId })
        .eq('id', certRequest.tenant_id)
    }

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: certRequest.currency || 'usd',
            product_data: {
              name: 'Work Experience Certificate',
              description: `Certificate for ${certRequest.total_hours}h worked from ${certRequest.period_start} to ${certRequest.period_end}`,
              metadata: {
                tenant_name: certRequest.tenant?.name || 'Unknown Tenant',
              },
            },
            unit_amount: certRequest.payment_amount_cents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        certificate_request_id: certificate_request_id,
        tenant_id: certRequest.tenant_id,
        part_timer_id: certRequest.part_timer_id,
        total_hours: certRequest.total_hours?.toString() || '0',
        period_start: certRequest.period_start,
        period_end: certRequest.period_end,
      },
      success_url: success_url,
      cancel_url: cancel_url,
      billing_address_collection: 'required',
      payment_intent_data: {
        metadata: {
          certificate_request_id: certificate_request_id,
          tenant_id: certRequest.tenant_id,
          part_timer_id: certRequest.part_timer_id,
        },
        receipt_email: user.email,
      },
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
    })

    // Update certificate request with session details
    const { error: updateError } = await supabase
      .from('certificate_requests')
      .update({
        stripe_session_id: checkoutSession.id,
        status: 'pending_payment',
        updated_at: new Date().toISOString(),
      })
      .eq('id', certificate_request_id)

    if (updateError) {
      console.error('Failed to update certificate request:', updateError)
      // Continue anyway - the session was created successfully
    }

    // Log the checkout creation
    await supabase
      .from('audit_logs')
      .insert({
        tenant_id: certRequest.tenant_id,
        user_id: user.id,
        action: 'create',
        resource_type: 'payment',
        resource_id: certificate_request_id,
        new_values: {
          stripe_session_id: checkoutSession.id,
          amount_cents: certRequest.payment_amount_cents,
          currency: certRequest.currency,
        },
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        user_agent: req.headers.get('user-agent'),
      })

    // Return the checkout session details
    return new Response(
      JSON.stringify({
        session_id: checkoutSession.id,
        url: checkoutSession.url,
        expires_at: checkoutSession.expires_at,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error creating checkout session:', error)
    
    const message = error instanceof Error ? error.message : 'Internal server error'
    const statusCode = message.includes('not found') || message.includes('access denied') ? 404 :
                      message.includes('validation failed') || message.includes('not in draft status') ? 400 :
                      message.includes('authorization') ? 401 : 500

    return new Response(
      JSON.stringify({ 
        error: message,
        code: 'CHECKOUT_ERROR'
      }),
      {
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})