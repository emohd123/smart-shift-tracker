-- ROLLBACK SCRIPT for Certificate Payment System Migration
-- This script safely reverts all changes made in 20250904130000_002_certificate_payments.sql

-- STEP 1: Drop RLS policies first
DROP POLICY IF EXISTS "webhook_events_system_only" ON public.webhook_events;
DROP POLICY IF EXISTS "webhook_events_select_admins_only" ON public.webhook_events;
DROP POLICY IF EXISTS "payments_insert_system_only" ON public.payments;
DROP POLICY IF EXISTS "payments_select_involved_users" ON public.payments;
DROP POLICY IF EXISTS "cert_requests_update_own_or_system" ON public.certificate_requests;
DROP POLICY IF EXISTS "cert_requests_insert_own" ON public.certificate_requests;
DROP POLICY IF EXISTS "cert_requests_select_own_and_admins" ON public.certificate_requests;

-- STEP 2: Disable RLS on tables
ALTER TABLE IF EXISTS public.webhook_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.certificate_requests DISABLE ROW LEVEL SECURITY;

-- STEP 3: Drop helper functions
DROP FUNCTION IF EXISTS public.validate_certificate_request(UUID);
DROP FUNCTION IF EXISTS public.calculate_user_earnings(UUID, UUID, DATE, DATE);
DROP FUNCTION IF EXISTS public.calculate_user_hours(UUID, UUID, DATE, DATE);

-- STEP 4: Drop triggers
DROP TRIGGER IF EXISTS update_webhook_events_updated_at ON public.webhook_events;
DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
DROP TRIGGER IF EXISTS update_certificate_requests_updated_at ON public.certificate_requests;

-- STEP 5: Revert changes to certificates table
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'certificates' AND table_schema = 'public') THEN
    -- Drop indexes
    DROP INDEX IF EXISTS idx_certificates_revoked;
    DROP INDEX IF EXISTS idx_certificates_payment;
    DROP INDEX IF EXISTS idx_certificates_request;
    
    -- Drop new columns
    ALTER TABLE public.certificates DROP COLUMN IF EXISTS revoked_by;
    ALTER TABLE public.certificates DROP COLUMN IF EXISTS revoked_at;
    ALTER TABLE public.certificates DROP COLUMN IF EXISTS is_revoked;
    ALTER TABLE public.certificates DROP COLUMN IF EXISTS generation_metadata;
    ALTER TABLE public.certificates DROP COLUMN IF EXISTS generated_by;
    ALTER TABLE public.certificates DROP COLUMN IF EXISTS payment_id;
    ALTER TABLE public.certificates DROP COLUMN IF EXISTS certificate_request_id;
  END IF;
END $$;

-- STEP 6: Drop new tables (in reverse dependency order)
DROP TABLE IF EXISTS public.webhook_events CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.certificate_requests CASCADE;

-- STEP 7: Clean up any remaining indexes
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop any remaining indexes related to payment tables
    FOR r IN SELECT schemaname, indexname FROM pg_indexes 
             WHERE (indexname LIKE '%cert_request%' OR 
                    indexname LIKE '%payment%' OR 
                    indexname LIKE '%webhook%') 
             AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP INDEX IF EXISTS ' || quote_ident(r.schemaname) || '.' || quote_ident(r.indexname);
    END LOOP;
END $$;

-- STEP 8: Revoke permissions
REVOKE ALL ON public.certificate_requests FROM authenticated;
REVOKE ALL ON public.payments FROM authenticated;
REVOKE ALL ON public.webhook_events FROM authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Certificate payment system rollback completed successfully:';
    RAISE NOTICE '- certificate_requests table dropped';
    RAISE NOTICE '- payments table dropped';  
    RAISE NOTICE '- webhook_events table dropped';
    RAISE NOTICE '- certificates table reverted to original state';
    RAISE NOTICE '- All helper functions and policies removed';
    RAISE NOTICE 'System reverted to pre-payment state';
END $$;