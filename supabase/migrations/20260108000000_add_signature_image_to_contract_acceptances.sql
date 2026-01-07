-- Add signature_image column to store base64 signature image
ALTER TABLE public.company_contract_acceptances
  ADD COLUMN IF NOT EXISTS signature_image text;

COMMENT ON COLUMN public.company_contract_acceptances.signature_image IS 'Base64 encoded signature image (PNG) captured via touch/fingerprint';

