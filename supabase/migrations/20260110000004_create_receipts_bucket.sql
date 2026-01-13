-- Migration: Create receipts storage bucket
-- Date: 2026-01-10
-- Purpose: Storage bucket for payment receipt PDFs

-- Create receipts storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('receipts', 'receipts', false, 10485760, ARRAY['application/pdf']::text[])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies for receipts bucket

-- Promoters can read receipts in their folder
CREATE POLICY "Promoters can read own receipts"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'receipts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Companies can read receipts for their shifts
-- This requires checking the receipt record to verify company ownership
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

-- Admins can read all receipts
CREATE POLICY "Admins can read all receipts"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'receipts'
  AND public.is_admin_like(auth.uid())
);

-- Only service role (via Edge Functions) can upload receipts
-- Regular users cannot upload directly - PDFs are generated server-side
CREATE POLICY "Service role can upload receipts"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'receipts'
  AND (auth.jwt() ->> 'role') = 'service_role'
);

-- Service role can update receipts
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

-- Comments
COMMENT ON TABLE storage.buckets IS 'Storage buckets for file uploads. Receipts bucket stores PDF payment receipts.';
