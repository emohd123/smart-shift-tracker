export interface CertificateRequest {
  id: string;
  tenant_id: string;
  part_timer_id: string;
  period_start: string;
  period_end: string;
  total_hours?: number;
  total_earnings?: number;
  status: 'draft' | 'pending_payment' | 'paid' | 'processing' | 'completed' | 'failed' | 'cancelled';
  stripe_session_id?: string;
  stripe_payment_intent_id?: string;
  payment_amount_cents: number;
  currency: string;
  metadata: Record<string, unknown>;
  paid_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  tenant_id: string;
  certificate_request_id: string;
  stripe_payment_intent_id: string;
  stripe_charge_id?: string;
  amount_cents: number;
  currency: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled' | 'refunded';
  stripe_customer_id?: string;
  payment_method_id?: string;
  failure_reason?: string;
  refund_amount_cents: number;
  metadata: Record<string, unknown>;
  processed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface WebhookEvent {
  id: string;
  stripe_event_id: string;
  event_type: string;
  processed: boolean;
  processing_attempts: number;
  last_attempt_at?: string;
  error_message?: string;
  event_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface StripeCheckoutSession {
  id: string;
  object: 'checkout.session';
  amount_total: number;
  currency: string;
  customer?: string;
  customer_email?: string;
  expires_at: number;
  metadata: Record<string, unknown>;
  mode: 'payment' | 'setup' | 'subscription';
  payment_intent?: string;
  payment_status: 'paid' | 'unpaid' | 'no_payment_required';
  status: 'open' | 'complete' | 'expired';
  success_url: string;
  cancel_url: string;
  url: string;
}

export interface StripePaymentIntent {
  id: string;
  object: 'payment_intent';
  amount: number;
  currency: string;
  customer?: string;
  description?: string;
  metadata: Record<string, unknown>;
  receipt_email?: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'requires_capture' | 'canceled' | 'succeeded';
  charges: {
    data: Array<{
      id: string;
      amount: number;
      currency: string;
      description?: string;
      paid: boolean;
      receipt_email?: string;
      receipt_url?: string;
      refunded: boolean;
      status: string;
    }>;
  };
}

export interface CertificateGenerationRequest {
  certificateRequestId: string;
  tenantId: string;
  partTimerId: string;
  periodStart: string;
  periodEnd: string;
  totalHours: number;
  totalEarnings: number;
  userProfile: {
    full_name: string;
    email?: string;
  };
  tenantInfo: {
    name: string;
  };
}

export interface CertificateGenerationResult {
  success: boolean;
  certificateId?: string;
  certificateUid?: string;
  pdfUrl?: string;
  error?: string;
}

// Utility types for form handling
export interface CertificateRequestForm {
  period_start: string;
  period_end: string;
}

export interface PaymentFlowState {
  step: 'form' | 'summary' | 'payment' | 'processing' | 'success' | 'error';
  certificateRequest?: CertificateRequest;
  checkoutSession?: StripeCheckoutSession;
  error?: string;
  isLoading: boolean;
}

// Constants
export const CERTIFICATE_PRICE_CENTS = 500; // $5.00
export const CERTIFICATE_PRICE_DISPLAY = '$5.00';

export const CERTIFICATE_REQUEST_STATUS_LABELS = {
  draft: 'Draft',
  pending_payment: 'Pending Payment',
  paid: 'Paid',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
} as const;

export const PAYMENT_STATUS_LABELS = {
  pending: 'Pending',
  processing: 'Processing',
  succeeded: 'Succeeded',
  failed: 'Failed',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
} as const;