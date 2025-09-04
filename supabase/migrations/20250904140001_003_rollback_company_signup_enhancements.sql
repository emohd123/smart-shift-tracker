-- Rollback: Enhanced company signup support
-- Date: 2025-09-04 14:00:01
-- Description: Rollback company-specific fields and policies

-- Drop storage policies
DROP POLICY IF EXISTS "Company assets are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload company assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their company assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their company assets" ON storage.objects;

-- Remove storage bucket (be careful - this will delete all files!)
-- DELETE FROM storage.buckets WHERE id = 'company-assets';

-- Drop tenant management policy
DROP POLICY IF EXISTS "Companies can manage their own tenant data" ON public.tenants;

-- Drop indexes
DROP INDEX IF EXISTS idx_tenants_business_country;
DROP INDEX IF EXISTS idx_tenants_business_registration_id;

-- Drop constraints
ALTER TABLE public.tenants DROP CONSTRAINT IF EXISTS check_business_country;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS check_profile_role;
ALTER TABLE public.tenant_memberships DROP CONSTRAINT IF EXISTS check_membership_role;

-- Remove columns from tenants table
ALTER TABLE public.tenants DROP COLUMN IF EXISTS business_address;
ALTER TABLE public.tenants DROP COLUMN IF EXISTS business_country;
ALTER TABLE public.tenants DROP COLUMN IF EXISTS business_registration_id;
ALTER TABLE public.tenants DROP COLUMN IF EXISTS contact_person;
ALTER TABLE public.tenants DROP COLUMN IF EXISTS company_logo_url;
ALTER TABLE public.tenants DROP COLUMN IF EXISTS business_document_url;
ALTER TABLE public.tenants DROP COLUMN IF EXISTS phone_number;

-- Revert role column types to original
ALTER TABLE public.profiles ALTER COLUMN role TYPE user_role USING role::user_role;
ALTER TABLE public.tenant_memberships ALTER COLUMN role TYPE user_role USING role::user_role;