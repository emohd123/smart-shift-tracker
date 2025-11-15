-- Create certificate_payments table to track all transactions
CREATE TABLE IF NOT EXISTS public.certificate_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  certificate_id UUID NOT NULL REFERENCES public.certificates(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 4.99,
  currency TEXT NOT NULL DEFAULT 'usd',
  stripe_payment_intent_id TEXT,
  stripe_session_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(certificate_id)
);

-- Add paid status to certificates table
ALTER TABLE public.certificates 
ADD COLUMN IF NOT EXISTS paid BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES public.certificate_payments(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.certificate_payments ENABLE ROW LEVEL SECURITY;

-- Users can view their own payments
CREATE POLICY "Users can view their own payments"
ON public.certificate_payments
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all payments
CREATE POLICY "Admins can view all payments"
ON public.certificate_payments
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- System can create payments (for webhook)
CREATE POLICY "System can create payments"
ON public.certificate_payments
FOR INSERT
WITH CHECK (true);

-- System can update payments (for webhook)
CREATE POLICY "System can update payments"
ON public.certificate_payments
FOR UPDATE
USING (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_certificate_payments_user_id ON public.certificate_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_certificate_payments_certificate_id ON public.certificate_payments(certificate_id);
CREATE INDEX IF NOT EXISTS idx_certificate_payments_stripe_session_id ON public.certificate_payments(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_certificates_paid ON public.certificates(paid);