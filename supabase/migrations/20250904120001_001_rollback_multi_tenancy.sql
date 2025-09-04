-- ROLLBACK SCRIPT for Multi-Tenant SaaS Foundation Migration
-- This script safely reverts all changes made in 20250904120000_001_add_multi_tenancy.sql

-- STEP 1: Drop RLS policies first
DROP POLICY IF EXISTS "Tenant admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Tenant members can view assignments" ON public.shift_assignments;
DROP POLICY IF EXISTS "Users can view their memberships" ON public.tenant_memberships;
DROP POLICY IF EXISTS "Users can view their tenant" ON public.tenants;

-- STEP 2: Disable RLS on tables we added it to
ALTER TABLE IF EXISTS public.audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.shift_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tenant_memberships DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tenants DISABLE ROW LEVEL SECURITY;

-- STEP 3: Drop helper functions
DROP FUNCTION IF EXISTS public.is_tenant_admin();
DROP FUNCTION IF EXISTS public.get_current_tenant_id();

-- STEP 4: Drop triggers
DROP TRIGGER IF EXISTS update_assignments_updated_at ON public.shift_assignments;
DROP TRIGGER IF EXISTS update_memberships_updated_at ON public.tenant_memberships;
DROP TRIGGER IF EXISTS update_tenants_updated_at ON public.tenants;

-- STEP 5: Drop new tables (in reverse dependency order)
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.shift_assignments CASCADE;
DROP TABLE IF EXISTS public.tenant_memberships CASCADE;
DROP TABLE IF EXISTS public.tenants CASCADE;

-- STEP 6: Revert changes to existing tables

-- Revert certificates table changes
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'certificates' AND table_schema = 'public') THEN
    -- Drop indexes
    DROP INDEX IF EXISTS idx_certificates_uid;
    DROP INDEX IF EXISTS idx_certificates_tenant;
    
    -- Drop new columns
    ALTER TABLE public.certificates DROP COLUMN IF EXISTS pdf_url;
    ALTER TABLE public.certificates DROP COLUMN IF EXISTS total_earnings;
    ALTER TABLE public.certificates DROP COLUMN IF EXISTS total_hours;
    ALTER TABLE public.certificates DROP COLUMN IF EXISTS period_end;
    ALTER TABLE public.certificates DROP COLUMN IF EXISTS period_start;
    ALTER TABLE public.certificates DROP COLUMN IF EXISTS certificate_uid;
    ALTER TABLE public.certificates DROP COLUMN IF EXISTS tenant_id;
  END IF;
END $$;

-- Revert companies table changes (rename back to company_profiles)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies' AND table_schema = 'public') THEN
    -- Drop indexes
    DROP INDEX IF EXISTS idx_companies_tenant;
    
    -- Drop new columns
    ALTER TABLE public.companies DROP COLUMN IF EXISTS billing_email;
    ALTER TABLE public.companies DROP COLUMN IF EXISTS stripe_customer_id;
    ALTER TABLE public.companies DROP COLUMN IF EXISTS tenant_id;
    
    -- Rename back to original name
    ALTER TABLE public.companies RENAME TO company_profiles;
  END IF;
END $$;

-- Revert timesheets table changes (rename back to time_logs)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'timesheets' AND table_schema = 'public') THEN
    -- Drop indexes
    DROP INDEX IF EXISTS idx_timesheets_approval;
    DROP INDEX IF EXISTS idx_timesheets_tenant_user;
    
    -- Drop new columns
    ALTER TABLE public.timesheets DROP COLUMN IF EXISTS hourly_rate;
    ALTER TABLE public.timesheets DROP COLUMN IF EXISTS approved_at;
    ALTER TABLE public.timesheets DROP COLUMN IF EXISTS approval_status;
    ALTER TABLE public.timesheets DROP COLUMN IF EXISTS approved_by;
    ALTER TABLE public.timesheets DROP COLUMN IF EXISTS tenant_id;
    
    -- Rename back to original name
    ALTER TABLE public.timesheets RENAME TO time_logs;
  END IF;
END $$;

-- Revert shifts table changes
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shifts' AND table_schema = 'public') THEN
    -- Drop indexes
    DROP INDEX IF EXISTS idx_shifts_tenant;
    
    -- Drop new columns
    ALTER TABLE public.shifts DROP COLUMN IF EXISTS hourly_rate;
    ALTER TABLE public.shifts DROP COLUMN IF EXISTS assigned_count;
    ALTER TABLE public.shifts DROP COLUMN IF EXISTS tenant_id;
  END IF;
END $$;

-- Revert profiles table changes
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
    -- Drop indexes
    DROP INDEX IF EXISTS idx_profiles_tenant;
    
    -- Drop new columns
    ALTER TABLE public.profiles DROP COLUMN IF EXISTS tenant_id;
  END IF;
END $$;

-- STEP 7: Clean up any orphaned indexes that might remain
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop any remaining indexes that contain 'tenant' in their name
    FOR r IN SELECT schemaname, indexname FROM pg_indexes 
             WHERE indexname LIKE '%tenant%' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP INDEX IF EXISTS ' || quote_ident(r.schemaname) || '.' || quote_ident(r.indexname);
    END LOOP;
END $$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Multi-tenancy rollback completed successfully. All changes have been reverted.';
END $$;