import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.9.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-08-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  
  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 })
  }

  try {
    // Get the raw body for signature verification
    const body = await req.text()
    
    // Verify the webhook signature
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    
    // Initialize Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Log the webhook event
    await supabase
      .from('webhook_events')
      .insert({
        stripe_event_id: event.id,
        event_type: event.type,
        event_data: event.data,
        processed: false,
        processing_attempts: 0,
      })

    // Process the event based on type
    let processingResult = { success: false, error: null as string | null }
    
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          processingResult = await handleCheckoutCompleted(event, supabase)
          break
          
        case 'payment_intent.succeeded':
          processingResult = await handlePaymentSucceeded(event, supabase)
          break
          
        case 'payment_intent.payment_failed':
          processingResult = await handlePaymentFailed(event, supabase)
          break
          
        case 'invoice.payment_succeeded':
          processingResult = await handleInvoicePaymentSucceeded(event, supabase)
          break
          
        default:
          console.log(`Unhandled event type: ${event.type}`)
          processingResult = { success: true, error: null } // Mark as processed but no action needed
      }
    } catch (error) {
      console.error(`Error processing ${event.type}:`, error)
      processingResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown processing error'
      }
    }

    // Update webhook event processing status
    await supabase
      .from('webhook_events')
      .update({
        processed: processingResult.success,
        processing_attempts: 1,
        last_attempt_at: new Date().toISOString(),
        error_message: processingResult.error,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_event_id', event.id)

    if (processingResult.success) {
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    } else {
      // Return 200 to acknowledge receipt, but log the error
      console.error('Webhook processing failed:', processingResult.error)
      return new Response(JSON.stringify({ 
        received: true, 
        processing_failed: true, 
        error: processingResult.error 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return new Response(
      JSON.stringify({ error: 'Webhook signature verification failed' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

async function handleCheckoutCompleted(event: Stripe.Event, supabase: SupabaseClient) {
  const session = event.data.object as Stripe.Checkout.Session
  
  const certificateRequestId = session.metadata?.certificate_request_id
  if (!certificateRequestId) {
    return { success: false, error: 'Missing certificate_request_id in session metadata' }
  }

  try {
    // Update certificate request status to paid
    const { error: updateError } = await supabase
      .from('certificate_requests')
      .update({
        status: 'paid',
        stripe_payment_intent_id: session.payment_intent,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', certificateRequestId)

    if (updateError) {
      throw new Error(`Failed to update certificate request: ${updateError.message}`)
    }

    // Create payment record
    if (session.payment_intent) {
      await supabase
        .from('payments')
        .insert({
          tenant_id: session.metadata?.tenant_id,
          certificate_request_id: certificateRequestId,
          stripe_payment_intent_id: session.payment_intent,
          amount_cents: session.amount_total,
          currency: session.currency,
          status: 'succeeded',
          stripe_customer_id: session.customer,
          processed_at: new Date().toISOString(),
        })
    }

    // Trigger certificate generation
    await triggerCertificateGeneration(certificateRequestId, supabase)
    
    return { success: true, error: null }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error in checkout completion' 
    }
  }
}

async function handlePaymentSucceeded(event: Stripe.Event, supabase: SupabaseClient) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent
  
  const certificateRequestId = paymentIntent.metadata?.certificate_request_id
  if (!certificateRequestId) {
    return { success: false, error: 'Missing certificate_request_id in payment_intent metadata' }
  }

  try {
    // Update payment status
    await supabase
      .from('payments')
      .update({
        status: 'succeeded',
        stripe_charge_id: paymentIntent.charges.data[0]?.id,
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_payment_intent_id', paymentIntent.id)

    // Ensure certificate request is marked as paid
    await supabase
      .from('certificate_requests')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', certificateRequestId)
      .eq('status', 'pending_payment')

    return { success: true, error: null }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error in payment success handling' 
    }
  }
}

async function handlePaymentFailed(event: Stripe.Event, supabase: SupabaseClient) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent
  
  const certificateRequestId = paymentIntent.metadata?.certificate_request_id
  if (!certificateRequestId) {
    return { success: false, error: 'Missing certificate_request_id in payment_intent metadata' }
  }

  try {
    // Update payment status
    await supabase
      .from('payments')
      .update({
        status: 'failed',
        failure_reason: paymentIntent.last_payment_error?.message || 'Payment failed',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_payment_intent_id', paymentIntent.id)

    // Update certificate request status
    await supabase
      .from('certificate_requests')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', certificateRequestId)

    return { success: true, error: null }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error in payment failure handling' 
    }
  }
}

async function handleInvoicePaymentSucceeded(event: Stripe.Event, supabase: SupabaseClient) {
  // This would handle subscription-based payments in the future
  // For now, just acknowledge the event
  return { success: true, error: null }
}

async function triggerCertificateGeneration(certificateRequestId: string, supabase: SupabaseClient) {
  try {
    // Update status to processing
    await supabase
      .from('certificate_requests')
      .update({
        status: 'processing',
        updated_at: new Date().toISOString(),
      })
      .eq('id', certificateRequestId)

    // In a real implementation, you might:
    // 1. Queue a job for certificate generation
    // 2. Call another Edge Function to generate the PDF
    // 3. Use a background task runner
    
    // For now, we'll call the certificate generation function directly
    const { error } = await supabase.functions.invoke('generate-certificate', {
      body: { certificate_request_id: certificateRequestId }
    })

    if (error) {
      console.error('Failed to trigger certificate generation:', error)
      
      // Update status to failed
      await supabase
        .from('certificate_requests')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', certificateRequestId)
    }
  } catch (error) {
    console.error('Error triggering certificate generation:', error)
    
    // Update status to failed
    await supabase
      .from('certificate_requests')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', certificateRequestId)
  }
}