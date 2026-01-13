-- Migration: Enhance payment status table with payment processing fields
-- Date: 2026-01-10
-- Purpose: Add fields for tracking payment processing details

-- Add payment processing fields to shift_assignment_payment_status
ALTER TABLE public.shift_assignment_payment_status
  ADD COLUMN IF NOT EXISTS amount numeric,
  ADD COLUMN IF NOT EXISTS transaction_reference text,
  ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'bank_transfer',
  ADD COLUMN IF NOT EXISTS receipt_id uuid REFERENCES public.payment_receipts(id),
  ADD COLUMN IF NOT EXISTS payment_processed_at timestamptz;

-- Update amount constraint if needed
ALTER TABLE public.shift_assignment_payment_status
  DROP CONSTRAINT IF EXISTS shift_assignment_payment_status_amount_check;
  
ALTER TABLE public.shift_assignment_payment_status
  ADD CONSTRAINT shift_assignment_payment_status_amount_check 
  CHECK (amount IS NULL OR amount > 0);

-- Add index for receipt_id lookups
CREATE INDEX IF NOT EXISTS idx_payment_status_receipt ON public.shift_assignment_payment_status(receipt_id)
  WHERE receipt_id IS NOT NULL;

-- Add index for transaction reference lookups
CREATE INDEX IF NOT EXISTS idx_payment_status_transaction_ref ON public.shift_assignment_payment_status(transaction_reference)
  WHERE transaction_reference IS NOT NULL;

-- Update comments
COMMENT ON COLUMN public.shift_assignment_payment_status.amount IS 'Payment amount in BHD. Calculated from time logs based on shift pay_rate and pay_rate_type';
COMMENT ON COLUMN public.shift_assignment_payment_status.transaction_reference IS 'Bank transaction reference number from the transfer confirmation';
COMMENT ON COLUMN public.shift_assignment_payment_status.payment_method IS 'Method used for payment: bank_transfer (default), manual, or other';
COMMENT ON COLUMN public.shift_assignment_payment_status.receipt_id IS 'Reference to the payment receipt generated for this payment';
COMMENT ON COLUMN public.shift_assignment_payment_status.payment_processed_at IS 'Timestamp when payment was processed and receipt was generated';
