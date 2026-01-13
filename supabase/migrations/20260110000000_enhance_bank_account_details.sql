-- Migration: Enhance profiles table with structured bank account fields
-- Date: 2026-01-10
-- Purpose: Add IBAN and bank account details for direct bank transfers

-- Add structured bank account fields to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bank_account_holder_name text,
  ADD COLUMN IF NOT EXISTS iban_number text,
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS bank_country text DEFAULT 'BH',
  ADD COLUMN IF NOT EXISTS bank_account_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS bank_account_verified_at timestamptz;

-- Add validation constraint for IBAN format (basic check)
-- IBAN must be between 15 and 34 characters
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS iban_format_check;
  
ALTER TABLE public.profiles
  ADD CONSTRAINT iban_format_check 
  CHECK (iban_number IS NULL OR (length(iban_number) >= 15 AND length(iban_number) <= 34));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_iban ON public.profiles(iban_number) 
  WHERE iban_number IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.iban_number IS 'International Bank Account Number (IBAN) for direct bank transfers. Format: 2 letters (country code) + 2 digits (check digits) + up to 30 alphanumeric characters';
COMMENT ON COLUMN public.profiles.bank_account_holder_name IS 'Name of the bank account holder as it appears on the bank account';
COMMENT ON COLUMN public.profiles.bank_name IS 'Name of the bank where the account is held';
COMMENT ON COLUMN public.profiles.bank_country IS 'ISO 3166-1 alpha-2 country code of the bank (default: BH for Bahrain)';
COMMENT ON COLUMN public.profiles.bank_account_verified IS 'Whether bank account has been verified by admin';
COMMENT ON COLUMN public.profiles.bank_account_verified_at IS 'Timestamp when bank account was verified';

-- Migrate existing bank_details to structured fields if possible
-- This is a best-effort migration - existing bank_details text field is kept for backward compatibility
UPDATE public.profiles
SET bank_account_holder_name = full_name
WHERE bank_details IS NOT NULL 
  AND bank_account_holder_name IS NULL
  AND full_name IS NOT NULL;
