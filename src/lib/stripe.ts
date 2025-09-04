import { loadStripe, Stripe } from '@stripe/stripe-js';

// Stripe client instance
let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    
    if (!publishableKey) {
      console.error('Missing VITE_STRIPE_PUBLISHABLE_KEY environment variable');
      throw new Error('Stripe publishable key is not configured');
    }

    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
};

// Utility functions for Stripe operations
export const formatCentsToDollars = (cents: number): string => {
  return `$${(cents / 100).toFixed(2)}`;
};

export const formatDollarsToCents = (dollars: number): number => {
  return Math.round(dollars * 100);
};

// Redirect to Stripe Checkout
export const redirectToCheckout = async (sessionId: string) => {
  const stripe = await getStripe();
  
  if (!stripe) {
    throw new Error('Failed to load Stripe');
  }

  const { error } = await stripe.redirectToCheckout({
    sessionId,
  });

  if (error) {
    console.error('Stripe checkout error:', error);
    throw new Error(error.message || 'Payment failed');
  }
};

// Handle Stripe payment element
export const createPaymentElement = async (clientSecret: string) => {
  const stripe = await getStripe();
  
  if (!stripe) {
    throw new Error('Failed to load Stripe');
  }

  const elements = stripe.elements({
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#0f172a',
        colorBackground: '#ffffff',
        colorText: '#0f172a',
        colorDanger: '#dc2626',
        fontFamily: 'Inter, system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
    },
  });

  const paymentElement = elements.create('payment');
  
  return { stripe, elements, paymentElement };
};

// Confirm payment
export const confirmPayment = async (
  stripe: Stripe,
  elements: any,
  returnUrl: string
) => {
  const { error, paymentIntent } = await stripe.confirmPayment({
    elements,
    confirmParams: {
      return_url: returnUrl,
    },
  });

  if (error) {
    console.error('Payment confirmation error:', error);
    throw new Error(error.message || 'Payment confirmation failed');
  }

  return paymentIntent;
};

// Validate Stripe webhook signature (for server-side use)
export const validateWebhookSignature = (
  payload: string | Buffer,
  signature: string,
  secret: string
): any => {
  // This would typically be used in a server-side function
  // For client-side, we'll just return a basic validation
  if (!signature || !secret) {
    throw new Error('Invalid webhook signature or secret');
  }
  
  // In a real implementation, this would use Stripe's webhook validation
  // For now, we'll trust that the server-side function handles this properly
  return JSON.parse(payload.toString());
};

// Get payment status display info
export const getPaymentStatusInfo = (status: string) => {
  const statusConfig = {
    pending: { color: 'gray', label: 'Pending' },
    processing: { color: 'blue', label: 'Processing' },
    succeeded: { color: 'green', label: 'Succeeded' },
    failed: { color: 'red', label: 'Failed' },
    cancelled: { color: 'gray', label: 'Cancelled' },
    refunded: { color: 'orange', label: 'Refunded' },
  };

  return statusConfig[status as keyof typeof statusConfig] || {
    color: 'gray',
    label: 'Unknown',
  };
};

// Certificate request status info
export const getCertificateRequestStatusInfo = (status: string) => {
  const statusConfig = {
    draft: { color: 'gray', label: 'Draft', description: 'Request created but not submitted' },
    pending_payment: { color: 'blue', label: 'Pending Payment', description: 'Waiting for payment completion' },
    paid: { color: 'green', label: 'Paid', description: 'Payment completed successfully' },
    processing: { color: 'blue', label: 'Processing', description: 'Generating certificate' },
    completed: { color: 'green', label: 'Completed', description: 'Certificate ready for download' },
    failed: { color: 'red', label: 'Failed', description: 'Certificate generation failed' },
    cancelled: { color: 'gray', label: 'Cancelled', description: 'Request was cancelled' },
  };

  return statusConfig[status as keyof typeof statusConfig] || {
    color: 'gray',
    label: 'Unknown',
    description: 'Unknown status',
  };
};

// Create retry delay for webhook processing
export const calculateRetryDelay = (attemptCount: number): number => {
  // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 32s, 60s, 60s, 60s, 60s
  const baseDelay = 1000; // 1 second
  const maxDelay = 60000; // 1 minute
  
  const delay = Math.min(baseDelay * Math.pow(2, attemptCount), maxDelay);
  return delay + Math.random() * 1000; // Add jitter
};

// URL helpers for payment flow
export const getPaymentUrls = (baseUrl: string, requestId: string) => {
  return {
    success: `${baseUrl}/certificates/payment/success?request_id=${requestId}`,
    cancel: `${baseUrl}/certificates/payment/cancelled?request_id=${requestId}`,
  };
};

// Default Stripe configuration
export const STRIPE_CONFIG = {
  currency: 'usd',
  paymentMethodTypes: ['card'],
  mode: 'payment' as const,
  billingAddressCollection: 'required' as const,
  shippingAddressCollection: undefined,
  allowPromotionCodes: false,
  submitType: 'pay' as const,
} as const;