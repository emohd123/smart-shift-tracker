-- Migration: Enhanced company signup support
-- Date: 2025-09-04 14:00:00
-- Description: Add company-specific fields to support detailed company registration

-- First, add new columns to the tenants table for company-specific information
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS business_address TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS business_country VARCHAR(2);
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS business_registration_id VARCHAR(100);
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255);
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS company_logo_url TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS business_document_url TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);

-- Add check constraint for business_country (ISO 3166-1 alpha-2 codes)
ALTER TABLE public.tenants ADD CONSTRAINT check_business_country 
CHECK (business_country ~ '^[A-Z]{2}$' OR business_country IS NULL);

-- Create storage bucket for company assets if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-assets', 'company-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for company assets bucket
DROP POLICY IF EXISTS "Company assets are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload company assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their company assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their company assets" ON storage.objects;

CREATE POLICY "Company assets are publicly viewable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'company-assets');

CREATE POLICY "Users can upload company assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'company-assets' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their company assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'company-assets' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their company assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'company-assets' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Update the profiles table to ensure it supports company admin role
ALTER TABLE public.profiles 
ALTER COLUMN role TYPE VARCHAR(20);

-- Add constraint to ensure valid roles
DROP CONSTRAINT IF EXISTS check_profile_role;
ALTER TABLE public.profiles 
ADD CONSTRAINT check_profile_role 
CHECK (role IN ('part_timer', 'company_admin', 'company_manager', 'super_admin'));

-- Update tenant memberships role constraint
ALTER TABLE public.tenant_memberships 
ALTER COLUMN role TYPE VARCHAR(20);

DROP CONSTRAINT IF EXISTS check_membership_role;
ALTER TABLE public.tenant_memberships 
ADD CONSTRAINT check_membership_role 
CHECK (role IN ('part_timer', 'company_admin', 'company_manager', 'super_admin'));

-- Create index for better performance on business country lookups
CREATE INDEX IF NOT EXISTS idx_tenants_business_country 
ON public.tenants(business_country) 
WHERE business_country IS NOT NULL;

-- Create index for business registration ID lookups
CREATE INDEX IF NOT EXISTS idx_tenants_business_registration_id 
ON public.tenants(business_registration_id) 
WHERE business_registration_id IS NOT NULL;

-- Update RLS policies for tenants table to allow company self-management
DROP POLICY IF EXISTS "Companies can manage their own tenant data" ON public.tenants;
CREATE POLICY "Companies can manage their own tenant data"
ON public.tenants FOR ALL
TO authenticated
USING (
  id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM tenant_memberships tm 
    WHERE tm.tenant_id = tenants.id 
    AND tm.user_id = auth.uid() 
    AND tm.role IN ('company_admin', 'company_manager')
    AND tm.status = 'active'
  )
);

-- Add helpful comments
COMMENT ON COLUMN public.tenants.business_address IS 'Full business address including street, city, postal code';
COMMENT ON COLUMN public.tenants.business_country IS 'ISO 3166-1 alpha-2 country code';
COMMENT ON COLUMN public.tenants.business_registration_id IS 'Business registration number or license ID';
COMMENT ON COLUMN public.tenants.contact_person IS 'Primary contact person for the company';
COMMENT ON COLUMN public.tenants.company_logo_url IS 'URL to uploaded company logo';
COMMENT ON COLUMN public.tenants.business_document_url IS 'URL to uploaded business registration document';
COMMENT ON COLUMN public.tenants.phone_number IS 'Primary business phone number';