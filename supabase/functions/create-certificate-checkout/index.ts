import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { certificateId } = await req.json();

    if (!certificateId) {
      throw new Error('Certificate ID is required');
    }

    // Check if certificate exists and belongs to user
    const { data: certificate, error: certError } = await supabaseClient
      .from('certificates')
      .select('id, reference_number, user_id, paid')
      .eq('id', certificateId)
      .single();

    if (certError || !certificate) {
      throw new Error('Certificate not found');
    }

    if (certificate.user_id !== user.id) {
      throw new Error('Unauthorized access to certificate');
    }

    if (certificate.paid) {
      throw new Error('Certificate already paid for');
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    // Create or get customer
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single();

    const customers = await stripe.customers.list({
      email: profile?.email || user.email,
      limit: 1,
    });

    let customer;
    if (customers.data.length > 0) {
      customer = customers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: profile?.email || user.email,
        name: profile?.full_name || '',
        metadata: {
          supabase_user_id: user.id,
        },
      });
    }

    // Create payment record in BHD
    // BHD is a 3-decimal currency: 3.000 BHD = 3000 fils
    const CERTIFICATE_PRICE_BHD = 3.000;
    const CERTIFICATE_AMOUNT_FILS = 3000; // 3.000 BHD × 1000 fils

    const { data: payment, error: paymentError } = await supabaseClient
      .from('certificate_payments')
      .insert({
        user_id: user.id,
        certificate_id: certificateId,
        amount: CERTIFICATE_PRICE_BHD,
        currency: 'bhd',
        status: 'pending',
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Payment creation error:', paymentError);
      throw new Error('Failed to create payment record');
    }

    // Create Stripe Checkout Session with BHD currency
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'bhd',
            product_data: {
              name: 'Professional Work Certificate',
              description: `Certificate ${certificate.reference_number}`,
            },
            unit_amount: CERTIFICATE_AMOUNT_FILS, // 3000 fils = 3.000 BHD
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/certificates?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/certificates?canceled=true`,
      metadata: {
        certificate_id: certificateId,
        payment_id: payment.id,
        user_id: user.id,
      },
    });

    // Update payment with session ID
    await supabaseClient
      .from('certificate_payments')
      .update({ stripe_session_id: session.id })
      .eq('id', payment.id);

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});