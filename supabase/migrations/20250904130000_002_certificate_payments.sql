-- Certificate Payment System Migration
-- Phase 2: Add Stripe payment integration for $5 certificate purchases
-- Creates payment tables and certificate request workflow

-- STEP 1: Create CERTIFICATE_REQUESTS table
CREATE TABLE public.certificate_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  part_timer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_hours NUMERIC(10,2),
  total_earnings NUMERIC(10,2),
  status TEXT NOT NULL CHECK (status IN ('draft', 'pending_payment', 'paid', 'processing', 'completed', 'failed', 'cancelled')) DEFAULT 'draft',
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  payment_amount_cents INTEGER NOT NULL DEFAULT 500, -- $5.00
  currency TEXT NOT NULL DEFAULT 'usd',
  metadata JSONB DEFAULT '{}',
  paid_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT period_valid CHECK (period_start <= period_end),
  CONSTRAINT hours_non_negative CHECK (total_hours IS NULL OR total_hours >= 0),
  CONSTRAINT earnings_non_negative CHECK (total_earnings IS NULL OR total_earnings >= 0),
  CONSTRAINT amount_positive CHECK (payment_amount_cents > 0)
);

-- Indexes for certificate_requests
CREATE INDEX idx_cert_requests_tenant_user ON public.certificate_requests(tenant_id, part_timer_id);
CREATE INDEX idx_cert_requests_status ON public.certificate_requests(status, created_at);
CREATE INDEX idx_cert_requests_period ON public.certificate_requests(period_start, period_end);
CREATE UNIQUE INDEX idx_cert_requests_stripe_session ON public.certificate_requests(stripe_session_id) WHERE stripe_session_id IS NOT NULL;
CREATE INDEX idx_cert_requests_payment_intent ON public.certificate_requests(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;

-- STEP 2: Create PAYMENTS table for tracking
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  certificate_request_id UUID NOT NULL REFERENCES public.certificate_requests(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT NOT NULL UNIQUE,
  stripe_charge_id TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded')) DEFAULT 'pending',
  stripe_customer_id TEXT,
  payment_method_id TEXT,
  failure_reason TEXT,
  refund_amount_cents INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT amount_positive CHECK (amount_cents > 0),
  CONSTRAINT refund_valid CHECK (refund_amount_cents >= 0 AND refund_amount_cents <= amount_cents)
);

-- Indexes for payments
CREATE INDEX idx_payments_tenant ON public.payments(tenant_id, created_at DESC);
CREATE INDEX idx_payments_cert_request ON public.payments(certificate_request_id);
CREATE UNIQUE INDEX idx_payments_stripe_intent ON public.payments(stripe_payment_intent_id);
CREATE INDEX idx_payments_stripe_customer ON public.payments(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX idx_payments_status ON public.payments(status, created_at DESC);

-- STEP 3: Update CERTIFICATES table with payment integration
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'certificates' AND table_schema = 'public') THEN
    -- Add new columns for payment integration
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certificates' AND column_name = 'certificate_request_id') THEN
      ALTER TABLE public.certificates ADD COLUMN certificate_request_id UUID REFERENCES public.certificate_requests(id) ON DELETE CASCADE;
      ALTER TABLE public.certificates ADD COLUMN payment_id UUID REFERENCES public.payments(id);
      ALTER TABLE public.certificates ADD COLUMN generated_by UUID REFERENCES auth.users(id);
      ALTER TABLE public.certificates ADD COLUMN generation_metadata JSONB DEFAULT '{}';
      ALTER TABLE public.certificates ADD COLUMN is_revoked BOOLEAN DEFAULT FALSE;
      ALTER TABLE public.certificates ADD COLUMN revoked_at TIMESTAMPTZ;
      ALTER TABLE public.certificates ADD COLUMN revoked_by UUID REFERENCES auth.users(id);
      
      -- Add indexes
      CREATE INDEX IF NOT EXISTS idx_certificates_request ON public.certificates(certificate_request_id);
      CREATE INDEX IF NOT EXISTS idx_certificates_payment ON public.certificates(payment_id);
      CREATE INDEX IF NOT EXISTS idx_certificates_revoked ON public.certificates(is_revoked, revoked_at) WHERE is_revoked = true;
    END IF;
  END IF;
END $$;

-- STEP 4: Create webhook events tracking table
CREATE TABLE public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  processing_attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  error_message TEXT,
  event_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT attempts_non_negative CHECK (processing_attempts >= 0),
  CONSTRAINT max_attempts CHECK (processing_attempts <= 10)
);

-- Indexes for webhook_events
CREATE UNIQUE INDEX idx_webhook_events_stripe_id ON public.webhook_events(stripe_event_id);
CREATE INDEX idx_webhook_events_type_processed ON public.webhook_events(event_type, processed);
CREATE INDEX idx_webhook_events_unprocessed ON public.webhook_events(created_at) WHERE processed = false;
CREATE INDEX idx_webhook_events_failed ON public.webhook_events(processing_attempts DESC, last_attempt_at DESC) WHERE processing_attempts > 0 AND processed = false;

-- STEP 5: Add updated_at triggers
CREATE TRIGGER update_certificate_requests_updated_at
  BEFORE UPDATE ON public.certificate_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_webhook_events_updated_at
  BEFORE UPDATE ON public.webhook_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- STEP 6: Create helper functions for payment processing

-- Function to calculate total hours for a user in a period
CREATE OR REPLACE FUNCTION public.calculate_user_hours(
  p_tenant_id UUID,
  p_user_id UUID,
  p_period_start DATE,
  p_period_end DATE
) RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  total_hours NUMERIC := 0;
BEGIN
  -- Calculate total approved hours from timesheets
  SELECT COALESCE(SUM(
    EXTRACT(EPOCH FROM (end_time - start_time)) / 3600
  ), 0) INTO total_hours
  FROM public.timesheets
  WHERE tenant_id = p_tenant_id
    AND user_id = p_user_id
    AND approval_status = 'approved'
    AND DATE(start_time) >= p_period_start
    AND DATE(start_time) <= p_period_end
    AND end_time IS NOT NULL;
    
  RETURN ROUND(total_hours, 2);
END;
$$;

-- Function to calculate total earnings for a user in a period
CREATE OR REPLACE FUNCTION public.calculate_user_earnings(
  p_tenant_id UUID,
  p_user_id UUID,
  p_period_start DATE,
  p_period_end DATE
) RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  total_earnings NUMERIC := 0;
BEGIN
  -- Calculate total earnings from approved timesheets
  SELECT COALESCE(SUM(total_earnings), 0) INTO total_earnings
  FROM public.timesheets
  WHERE tenant_id = p_tenant_id
    AND user_id = p_user_id
    AND approval_status = 'approved'
    AND DATE(start_time) >= p_period_start
    AND DATE(start_time) <= p_period_end
    AND total_earnings IS NOT NULL;
    
  RETURN ROUND(total_earnings, 2);
END;
$$;

-- Function to validate certificate request before payment
CREATE OR REPLACE FUNCTION public.validate_certificate_request(
  p_request_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  request_record RECORD;
  hours_count NUMERIC;
BEGIN
  -- Get request details
  SELECT * INTO request_record
  FROM public.certificate_requests
  WHERE id = p_request_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user has approved hours in the period
  SELECT public.calculate_user_hours(
    request_record.tenant_id,
    request_record.part_timer_id,
    request_record.period_start,
    request_record.period_end
  ) INTO hours_count;
  
  -- Must have at least 1 hour of approved work
  RETURN hours_count >= 1;
END;
$$;

-- STEP 7: Enable RLS on new tables
ALTER TABLE public.certificate_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- STEP 8: Create RLS policies for certificate_requests
CREATE POLICY "cert_requests_select_own_and_admins"
  ON public.certificate_requests FOR SELECT
  USING (
    part_timer_id = auth.uid() OR 
    tenant_id IN (SELECT tenant_id FROM public.tenant_memberships 
                  WHERE user_id = auth.uid() AND role IN ('company_admin', 'company_manager') AND status = 'active')
  );

CREATE POLICY "cert_requests_insert_own"
  ON public.certificate_requests FOR INSERT
  WITH CHECK (
    part_timer_id = auth.uid() AND 
    tenant_id IN (SELECT tenant_id FROM public.tenant_memberships WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "cert_requests_update_own_or_system"
  ON public.certificate_requests FOR UPDATE
  USING (
    part_timer_id = auth.uid() OR
    -- System functions can update for payment processing
    auth.uid() IS NULL
  );

-- STEP 9: Create RLS policies for payments
CREATE POLICY "payments_select_involved_users"
  ON public.payments FOR SELECT
  USING (
    certificate_request_id IN (SELECT id FROM public.certificate_requests WHERE part_timer_id = auth.uid()) OR
    tenant_id IN (SELECT tenant_id FROM public.tenant_memberships 
                  WHERE user_id = auth.uid() AND role IN ('company_admin', 'company_manager') AND status = 'active')
  );

CREATE POLICY "payments_insert_system_only"
  ON public.payments FOR INSERT
  WITH CHECK (true); -- Only system functions should create payments

-- STEP 10: Create RLS policies for webhook_events (admin only)
CREATE POLICY "webhook_events_select_admins_only"
  ON public.webhook_events FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.tenant_memberships 
            WHERE user_id = auth.uid() AND role = 'company_admin' AND status = 'active')
  );

CREATE POLICY "webhook_events_system_only"
  ON public.webhook_events FOR INSERT
  WITH CHECK (true); -- Only system functions should create webhook events

-- STEP 11: Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.certificate_requests TO authenticated;
GRANT SELECT ON public.payments TO authenticated;
GRANT SELECT ON public.webhook_events TO authenticated;

-- STEP 12: Add table comments for documentation
COMMENT ON TABLE public.certificate_requests IS 'Certificate purchase requests with Stripe payment integration';
COMMENT ON TABLE public.payments IS 'Payment tracking for certificate purchases';
COMMENT ON TABLE public.webhook_events IS 'Stripe webhook event processing log';

COMMENT ON COLUMN public.certificate_requests.status IS 'Lifecycle: draft → pending_payment → paid → processing → completed';
COMMENT ON COLUMN public.certificate_requests.payment_amount_cents IS 'Amount in cents (500 = $5.00)';
COMMENT ON COLUMN public.payments.status IS 'Stripe payment status: pending → processing → succeeded/failed';
COMMENT ON COLUMN public.webhook_events.processing_attempts IS 'Number of webhook processing attempts (max 10)';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Certificate payment system tables created successfully:';
    RAISE NOTICE '- certificate_requests: Payment workflow management';
    RAISE NOTICE '- payments: Stripe payment tracking';
    RAISE NOTICE '- webhook_events: Webhook processing log';
    RAISE NOTICE '- Helper functions for hours/earnings calculation';
    RAISE NOTICE '- RLS policies for multi-tenant security';
    RAISE NOTICE 'Ready for Stripe integration implementation';
END $$;