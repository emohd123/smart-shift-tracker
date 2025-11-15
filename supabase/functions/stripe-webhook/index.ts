import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!signature || !webhookSecret) {
    return new Response('Webhook signature or secret missing', { status: 400 });
  }

  try {
    const body = await req.text();
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    );

    console.log('Webhook event type:', event.type);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log('Processing checkout session:', session.id);
      console.log('Metadata:', session.metadata);

      const certificateId = session.metadata?.certificate_id;
      const paymentId = session.metadata?.payment_id;
      const userId = session.metadata?.user_id;

      if (!certificateId || !paymentId || !userId) {
        console.error('Missing required metadata');
        return new Response('Missing metadata', { status: 400 });
      }

      // Update payment record
      const { error: paymentError } = await supabaseAdmin
        .from('certificate_payments')
        .update({
          status: 'completed',
          stripe_payment_intent_id: session.payment_intent as string,
          updated_at: new Date().toISOString(),
        })
        .eq('id', paymentId);

      if (paymentError) {
        console.error('Error updating payment:', paymentError);
        throw paymentError;
      }

      // Mark certificate as paid
      const { error: certError } = await supabaseAdmin
        .from('certificates')
        .update({
          paid: true,
          payment_id: paymentId,
        })
        .eq('id', certificateId);

      if (certError) {
        console.error('Error updating certificate:', certError);
        throw certError;
      }

      console.log('Successfully processed payment for certificate:', certificateId);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
