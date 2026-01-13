-- ============================================
-- Apply Payment System Migrations
-- ============================================
-- Run this in Supabase Dashboard → SQL Editor
-- This will create all tables, functions, and policies needed for the payment system
-- ============================================

-- Migration 1: Enhance bank account details
-- ============================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bank_account_holder_name text,
  ADD COLUMN IF NOT EXISTS iban_number text,
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS bank_country text DEFAULT 'BH',
  ADD COLUMN IF NOT EXISTS bank_account_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS bank_account_verified_at timestamptz;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS iban_format_check;
  
ALTER TABLE public.profiles
  ADD CONSTRAINT iban_format_check 
  CHECK (iban_number IS NULL OR (length(iban_number) >= 15 AND length(iban_number) <= 34));

CREATE INDEX IF NOT EXISTS idx_profiles_iban ON public.profiles(iban_number) 
  WHERE iban_number IS NOT NULL;

UPDATE public.profiles
SET bank_account_holder_name = full_name
WHERE bank_details IS NOT NULL 
  AND bank_account_holder_name IS NULL
  AND full_name IS NOT NULL;

-- Migration 2: Create payment receipts table
-- ============================================
CREATE TABLE IF NOT EXISTS public.payment_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.shift_assignments(id) ON DELETE CASCADE,
  payment_status_id uuid REFERENCES public.shift_assignment_payment_status(assignment_id),
  
  -- Receipt details
  receipt_number text NOT NULL UNIQUE,
  receipt_date timestamptz NOT NULL DEFAULT now(),
  
  -- Payment details
  amount numeric NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'BHD',
  payment_method text NOT NULL DEFAULT 'bank_transfer' CHECK (payment_method IN ('bank_transfer', 'manual', 'other')),
  
  -- Bank transfer details
  transaction_reference text,
  bank_transfer_date timestamptz,
  bank_name text,
  iban_number text,
  
  -- Parties involved
  company_id uuid NOT NULL REFERENCES public.profiles(id),
  promoter_id uuid NOT NULL REFERENCES public.profiles(id),
  shift_id uuid NOT NULL REFERENCES public.shifts(id),
  
  -- Receipt document
  pdf_url text,
  pdf_generated_at timestamptz,
  
  -- Status
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'cancelled')),
  
  -- Metadata
  notes text,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_receipts_assignment ON public.payment_receipts(assignment_id);
CREATE INDEX IF NOT EXISTS idx_receipts_company ON public.payment_receipts(company_id);
CREATE INDEX IF NOT EXISTS idx_receipts_promoter ON public.payment_receipts(promoter_id);
CREATE INDEX IF NOT EXISTS idx_receipts_receipt_number ON public.payment_receipts(receipt_number);
CREATE INDEX IF NOT EXISTS idx_receipts_status ON public.payment_receipts(status);
CREATE INDEX IF NOT EXISTS idx_receipts_shift ON public.payment_receipts(shift_id);
CREATE INDEX IF NOT EXISTS idx_receipts_date ON public.payment_receipts(receipt_date);

ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Companies can view own receipts"
  ON public.payment_receipts FOR SELECT
  USING (
    company_id = auth.uid() 
    OR public.is_admin_like(auth.uid())
  );

CREATE POLICY "Promoters can view own receipts"
  ON public.payment_receipts FOR SELECT
  USING (promoter_id = auth.uid());

CREATE POLICY "Companies can create receipts for own shifts"
  ON public.payment_receipts FOR INSERT
  WITH CHECK (
    company_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM public.shifts s 
      WHERE s.id = shift_id AND s.company_id = auth.uid()
    )
    OR public.is_admin_like(auth.uid())
  );

CREATE POLICY "Companies can update own receipts"
  ON public.payment_receipts FOR UPDATE
  USING (company_id = auth.uid() OR public.is_admin_like(auth.uid()))
  WITH CHECK (company_id = auth.uid() OR public.is_admin_like(auth.uid()));

CREATE POLICY "Admins can manage all receipts"
  ON public.payment_receipts FOR ALL
  USING (public.is_admin_like(auth.uid()))
  WITH CHECK (public.is_admin_like(auth.uid()));

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    DROP TRIGGER IF EXISTS update_payment_receipts_updated_at ON public.payment_receipts;
    CREATE TRIGGER update_payment_receipts_updated_at
    BEFORE UPDATE ON public.payment_receipts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Migration 3: Enhance payment status table
-- ============================================
ALTER TABLE public.shift_assignment_payment_status
  ADD COLUMN IF NOT EXISTS amount numeric,
  ADD COLUMN IF NOT EXISTS transaction_reference text,
  ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'bank_transfer',
  ADD COLUMN IF NOT EXISTS receipt_id uuid REFERENCES public.payment_receipts(id),
  ADD COLUMN IF NOT EXISTS payment_processed_at timestamptz;

ALTER TABLE public.shift_assignment_payment_status
  DROP CONSTRAINT IF EXISTS shift_assignment_payment_status_amount_check;
  
ALTER TABLE public.shift_assignment_payment_status
  ADD CONSTRAINT shift_assignment_payment_status_amount_check 
  CHECK (amount IS NULL OR amount > 0);

CREATE INDEX IF NOT EXISTS idx_payment_status_receipt ON public.shift_assignment_payment_status(receipt_id)
  WHERE receipt_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payment_status_transaction_ref ON public.shift_assignment_payment_status(transaction_reference)
  WHERE transaction_reference IS NOT NULL;

-- Migration 4: Create payment functions
-- ============================================
CREATE OR REPLACE FUNCTION public.generate_receipt_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  receipt_num text;
  exists_check boolean;
  retry_count integer := 0;
  max_retries integer := 10;
BEGIN
  LOOP
    receipt_num := 'REC-' || to_char(now(), 'YYYYMMDD') || '-' || 
                   lpad(floor(random() * 1000000)::text, 6, '0');
    
    SELECT EXISTS(SELECT 1 FROM public.payment_receipts WHERE receipt_number = receipt_num) INTO exists_check;
    
    EXIT WHEN NOT exists_check;
    
    retry_count := retry_count + 1;
    IF retry_count >= max_retries THEN
      RAISE EXCEPTION 'Failed to generate unique receipt number after % attempts', max_retries;
    END IF;
  END LOOP;
  
  RETURN receipt_num;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_iban(iban_text text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  cleaned_iban text;
BEGIN
  IF iban_text IS NULL THEN
    RETURN true;
  END IF;
  
  cleaned_iban := upper(replace(iban_text, ' ', ''));
  
  IF length(cleaned_iban) < 15 OR length(cleaned_iban) > 34 THEN
    RETURN false;
  END IF;
  
  IF NOT (cleaned_iban ~ '^[A-Z]{2}[0-9]{2}[A-Z0-9]+$') THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_payment_amount_for_assignment(p_assignment_id uuid)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_shift_id uuid;
  v_pay_rate numeric;
  v_pay_rate_type text;
  v_total_hours numeric := 0;
  v_amount numeric := 0;
BEGIN
  SELECT s.id, s.pay_rate, s.pay_rate_type
  INTO v_shift_id, v_pay_rate, v_pay_rate_type
  FROM public.shift_assignments sa
  JOIN public.shifts s ON s.id = sa.shift_id
  WHERE sa.id = p_assignment_id;
  
  IF v_shift_id IS NULL THEN
    RETURN 0;
  END IF;
  
  SELECT COALESCE(SUM(total_hours), 0)
  INTO v_total_hours
  FROM public.time_logs
  WHERE shift_id = v_shift_id
    AND user_id = (SELECT promoter_id FROM public.shift_assignments WHERE id = p_assignment_id)
    AND check_out_time IS NOT NULL;
  
  IF v_pay_rate IS NULL OR v_pay_rate <= 0 THEN
    RETURN 0;
  END IF;
  
  CASE v_pay_rate_type
    WHEN 'hourly' THEN
      v_amount := v_total_hours * v_pay_rate;
    WHEN 'daily' THEN
      v_amount := (v_total_hours / 8.0) * v_pay_rate;
    WHEN 'monthly' THEN
      v_amount := (v_total_hours / 160.0) * v_pay_rate;
    WHEN 'fixed' THEN
      v_amount := v_pay_rate;
    ELSE
      v_amount := v_total_hours * v_pay_rate;
  END CASE;
  
  RETURN GREATEST(0, v_amount);
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_receipt_number() TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_iban(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_payment_amount_for_assignment(uuid) TO authenticated;

-- Migration 5: Create receipts storage bucket
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('receipts', 'receipts', false, 10485760, ARRAY['application/pdf']::text[])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Promoters can read own receipts"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'receipts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Companies can read receipts for own shifts"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'receipts'
  AND EXISTS (
    SELECT 1 FROM public.payment_receipts pr
    WHERE pr.pdf_url = name
    AND pr.company_id = auth.uid()
  )
);

CREATE POLICY "Admins can read all receipts"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'receipts'
  AND public.is_admin_like(auth.uid())
);

CREATE POLICY "Service role can upload receipts"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'receipts'
  AND (auth.jwt() ->> 'role') = 'service_role'
);

CREATE POLICY "Service role can update receipts"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'receipts'
  AND (auth.jwt() ->> 'role') = 'service_role'
)
WITH CHECK (
  bucket_id = 'receipts'
  AND (auth.jwt() ->> 'role') = 'service_role'
);

-- ============================================
-- Migration Complete!
-- ============================================
-- You should now be able to:
-- 1. View payment receipts in the UI
-- 2. Process payments for promoters
-- 3. Generate receipts automatically
-- ============================================
