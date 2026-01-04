-- Add missing fields to company_profiles table for enhanced company management
ALTER TABLE company_profiles
ADD COLUMN IF NOT EXISTS cr_document_url text,
ADD COLUMN IF NOT EXISTS business_certificate_url text,
ADD COLUMN IF NOT EXISTS industry text,
ADD COLUMN IF NOT EXISTS company_size text,
ADD COLUMN IF NOT EXISTS description text;

-- Add comment for context
COMMENT ON COLUMN company_profiles.cr_document_url IS 'URL to uploaded Commercial Registration document';
COMMENT ON COLUMN company_profiles.business_certificate_url IS 'URL to uploaded business certificate/license';
COMMENT ON COLUMN company_profiles.industry IS 'Industry or sector of the company';
COMMENT ON COLUMN company_profiles.company_size IS 'Size of the company (e.g., 1-10, 11-50, etc.)';
COMMENT ON COLUMN company_profiles.description IS 'Company description or bio';
