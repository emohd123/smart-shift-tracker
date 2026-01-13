-- Migration: Create payment receipts table
-- Date: 2026-01-10
-- Purpose: Store official payment receipts for salary payments to promoters

-- Create payment receipts table
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

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_receipts_assignment ON public.payment_receipts(assignment_id);
CREATE INDEX IF NOT EXISTS idx_receipts_company ON public.payment_receipts(company_id);
CREATE INDEX IF NOT EXISTS idx_receipts_promoter ON public.payment_receipts(promoter_id);
CREATE INDEX IF NOT EXISTS idx_receipts_receipt_number ON public.payment_receipts(receipt_number);
CREATE INDEX IF NOT EXISTS idx_receipts_status ON public.payment_receipts(status);
CREATE INDEX IF NOT EXISTS idx_receipts_shift ON public.payment_receipts(shift_id);
CREATE INDEX IF NOT EXISTS idx_receipts_date ON public.payment_receipts(receipt_date);

-- Enable RLS
ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Companies can view receipts for their shifts
CREATE POLICY "Companies can view own receipts"
  ON public.payment_receipts FOR SELECT
  USING (
    company_id = auth.uid() 
    OR public.is_admin_like(auth.uid())
  );

-- Promoters can view their own receipts
CREATE POLICY "Promoters can view own receipts"
  ON public.payment_receipts FOR SELECT
  USING (promoter_id = auth.uid());

-- Companies can create receipts for their shifts
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

-- Companies can update their own receipts
CREATE POLICY "Companies can update own receipts"
  ON public.payment_receipts FOR UPDATE
  USING (company_id = auth.uid() OR public.is_admin_like(auth.uid()))
  WITH CHECK (company_id = auth.uid() OR public.is_admin_like(auth.uid()));

-- Admins can do everything
CREATE POLICY "Admins can manage all receipts"
  ON public.payment_receipts FOR ALL
  USING (public.is_admin_like(auth.uid()))
  WITH CHECK (public.is_admin_like(auth.uid()));

-- Updated_at trigger
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

-- Comments
COMMENT ON TABLE public.payment_receipts IS 'Official payment receipts for salary payments to promoters. Each receipt represents a payment transaction from company to promoter for completed shift work.';
COMMENT ON COLUMN public.payment_receipts.receipt_number IS 'Unique receipt number in format REC-YYYYMMDD-XXXXXX';
COMMENT ON COLUMN public.payment_receipts.amount IS 'Payment amount in specified currency';
COMMENT ON COLUMN public.payment_receipts.payment_method IS 'Method used for payment: bank_transfer, manual, or other';
COMMENT ON COLUMN public.payment_receipts.transaction_reference IS 'Bank transaction reference number from the transfer';
COMMENT ON COLUMN public.payment_receipts.status IS 'Receipt status: draft (being created), issued (finalized), cancelled (voided)';
