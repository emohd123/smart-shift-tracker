-- COMPLETE DATABASE SETUP FOR SMART SHIFT TRACKER
-- This script creates all missing tables and applies the necessary policies
-- Copy and paste this entire script into your Supabase SQL Editor

-- ============================================================
-- STEP 1: CREATE CORE MULTI-TENANT TABLES
-- ============================================================

-- 1. TENANTS - Central tenant management
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  domain TEXT UNIQUE CHECK (domain IS NULL OR domain ~ '^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$'),
  settings JSONB NOT NULL DEFAULT '{}',
  subscription_tier TEXT CHECK (subscription_tier IN ('starter', 'professional', 'enterprise')) DEFAULT 'starter',
  subscription_status TEXT CHECK (subscription_status IN ('active', 'suspended', 'cancelled')) DEFAULT 'active',
  max_users INTEGER NOT NULL DEFAULT 50 CHECK (max_users > 0),
  stripe_customer_id TEXT UNIQUE,
  billing_email TEXT CHECK (billing_email IS NULL OR billing_email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for tenants
DROP INDEX IF EXISTS idx_tenants_slug;
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_subscription ON public.tenants(subscription_tier, subscription_status);
CREATE INDEX IF NOT EXISTS idx_tenants_created ON public.tenants(created_at);

-- 2. TENANT_MEMBERSHIPS - User-tenant relationships with roles
CREATE TABLE IF NOT EXISTS public.tenant_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('company_admin', 'company_manager', 'part_timer')) DEFAULT 'part_timer',
  status TEXT NOT NULL CHECK (status IN ('active', 'invited', 'suspended')) DEFAULT 'active',
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

-- Indexes for tenant_memberships
CREATE INDEX IF NOT EXISTS idx_memberships_tenant_user ON public.tenant_memberships(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_tenant_role ON public.tenant_memberships(tenant_id, role);
CREATE INDEX IF NOT EXISTS idx_memberships_user_status ON public.tenant_memberships(user_id, status);

-- ============================================================
-- STEP 2: ADD TENANT_ID TO EXISTING TABLES
-- ============================================================

-- Add tenant_id to profiles table (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'tenant_id') THEN
      ALTER TABLE public.profiles ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
      CREATE INDEX IF NOT EXISTS idx_profiles_tenant ON public.profiles(tenant_id);
    END IF;
  END IF;
END $$;

-- Add tenant_id to shifts table (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shifts' AND table_schema = 'public') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shifts' AND column_name = 'tenant_id') THEN
      ALTER TABLE public.shifts ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
      ALTER TABLE public.shifts ADD COLUMN assigned_count INTEGER DEFAULT 0;
      ALTER TABLE public.shifts ADD COLUMN hourly_rate NUMERIC(10,2);
      CREATE INDEX IF NOT EXISTS idx_shifts_tenant ON public.shifts(tenant_id);
    END IF;
  END IF;
END $$;

-- Add tenant_id to certificates table (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'certificates' AND table_schema = 'public') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certificates' AND column_name = 'tenant_id') THEN
      ALTER TABLE public.certificates ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
      CREATE INDEX IF NOT EXISTS idx_certificates_tenant ON public.certificates(tenant_id);
    END IF;
  END IF;
END $$;

-- ============================================================
-- STEP 3: CREATE ADDITIONAL MULTI-TENANT TABLES
-- ============================================================

-- SHIFT_ASSIGNMENTS - Track who's assigned to shifts
CREATE TABLE IF NOT EXISTS public.shift_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  shift_id UUID NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  part_timer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('assigned', 'accepted', 'declined', 'completed', 'no_show')) DEFAULT 'assigned',
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(shift_id, part_timer_id)
);

CREATE INDEX IF NOT EXISTS idx_assignments_tenant_shift ON public.shift_assignments(tenant_id, shift_id);
CREATE INDEX IF NOT EXISTS idx_assignments_part_timer ON public.shift_assignments(part_timer_id, status);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON public.shift_assignments(status, assigned_at);

-- AUDIT_LOGS - System-wide audit trail
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'login', 'logout', 'invite', 'approve', 'reject')),
  resource_type TEXT NOT NULL CHECK (resource_type IN ('shift', 'certificate', 'timesheet', 'assignment', 'user', 'tenant')),
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_tenant_action ON public.audit_logs(tenant_id, action);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON public.audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user ON public.audit_logs(user_id, created_at DESC);

-- ============================================================
-- STEP 4: ENABLE ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Enable RLS on existing tables if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shifts' AND table_schema = 'public') THEN
    ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'certificates' AND table_schema = 'public') THEN
    ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- ============================================================
-- STEP 5: CREATE SIGNUP-FRIENDLY POLICIES
-- ============================================================

-- TENANTS policies
DROP POLICY IF EXISTS "Users can create tenants during signup" ON public.tenants;
DROP POLICY IF EXISTS "tenant_select_own" ON public.tenants;
DROP POLICY IF EXISTS "tenant_update_admins_only" ON public.tenants;

CREATE POLICY "Users can create tenants during signup"
  ON public.tenants FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "tenant_select_own"
  ON public.tenants FOR SELECT
  USING (id IN (SELECT tenant_id FROM public.tenant_memberships WHERE user_id = auth.uid() AND status = 'active'));

CREATE POLICY "tenant_update_admins_only"
  ON public.tenants FOR UPDATE
  USING (id IN (SELECT tenant_id FROM public.tenant_memberships 
                WHERE user_id = auth.uid() AND role = 'company_admin' AND status = 'active'))
  WITH CHECK (id IN (SELECT tenant_id FROM public.tenant_memberships 
                     WHERE user_id = auth.uid() AND role = 'company_admin' AND status = 'active'));

-- TENANT_MEMBERSHIPS policies
DROP POLICY IF EXISTS "Users can create memberships during signup" ON public.tenant_memberships;
DROP POLICY IF EXISTS "membership_select_own_and_tenant_admins" ON public.tenant_memberships;
DROP POLICY IF EXISTS "membership_insert_admins_only" ON public.tenant_memberships;
DROP POLICY IF EXISTS "membership_update_admins_and_self" ON public.tenant_memberships;
DROP POLICY IF EXISTS "membership_delete_admins_only" ON public.tenant_memberships;

CREATE POLICY "Users can create memberships during signup"
  ON public.tenant_memberships FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR
    tenant_id IN (
      SELECT tenant_id 
      FROM public.tenant_memberships 
      WHERE user_id = auth.uid() 
      AND role = 'company_admin' 
      AND status = 'active'
    )
  );

CREATE POLICY "membership_select_own_and_tenant_admins"
  ON public.tenant_memberships FOR SELECT
  USING (
    user_id = auth.uid() OR 
    tenant_id IN (SELECT tenant_id FROM public.tenant_memberships 
                  WHERE user_id = auth.uid() AND role IN ('company_admin', 'company_manager') AND status = 'active')
  );

CREATE POLICY "membership_update_admins_and_self"
  ON public.tenant_memberships FOR UPDATE
  USING (
    user_id = auth.uid() OR 
    tenant_id IN (SELECT tenant_id FROM public.tenant_memberships 
                  WHERE user_id = auth.uid() AND role = 'company_admin' AND status = 'active')
  );

CREATE POLICY "membership_delete_admins_only"  
  ON public.tenant_memberships FOR DELETE
  USING (
    tenant_id IN (SELECT tenant_id FROM public.tenant_memberships 
                  WHERE user_id = auth.uid() AND role = 'company_admin' AND status = 'active')
  );

-- PROFILES policies (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
    DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
    DROP POLICY IF EXISTS "profiles_insert_with_tenant" ON public.profiles;
    DROP POLICY IF EXISTS "profiles_select_tenant_members" ON public.profiles;
    DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
    DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;

    CREATE POLICY "profiles_insert_with_tenant"
      ON public.profiles FOR INSERT
      TO authenticated
      WITH CHECK (
        id = auth.uid() AND
        (tenant_id IS NULL OR 
         tenant_id IN (
           SELECT tenant_id 
           FROM public.tenant_memberships 
           WHERE user_id = auth.uid() 
           AND status = 'active'
         ))
      );

    CREATE POLICY "profiles_select_tenant_members"
      ON public.profiles FOR SELECT
      USING (tenant_id IN (SELECT tenant_id FROM public.tenant_memberships WHERE user_id = auth.uid() AND status = 'active'));

    CREATE POLICY "profiles_update_own"
      ON public.profiles FOR UPDATE
      USING (id = auth.uid())
      WITH CHECK (id = auth.uid());

    CREATE POLICY "profiles_delete_own"
      ON public.profiles FOR DELETE
      USING (id = auth.uid());
  END IF;
END $$;

-- ============================================================
-- STEP 6: CREATE HELPER FUNCTIONS
-- ============================================================

-- Function to get current user's tenant ID
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tenant_id UUID;
BEGIN
  -- Get the first active tenant for the current user
  SELECT tm.tenant_id INTO tenant_id
  FROM public.tenant_memberships tm
  WHERE tm.user_id = auth.uid() 
  AND tm.status = 'active'
  LIMIT 1;
  
  RETURN tenant_id;
END;
$$;

-- Function to check if user is tenant admin
CREATE OR REPLACE FUNCTION public.is_tenant_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.tenant_memberships tm
    WHERE tm.user_id = auth.uid() 
    AND tm.role = 'company_admin' 
    AND tm.status = 'active'
  );
END;
$$;

-- ============================================================
-- STEP 7: ADD COMMENTS FOR DOCUMENTATION
-- ============================================================

COMMENT ON TABLE public.tenants IS 'Multi-tenant organizations (companies or personal workspaces)';
COMMENT ON TABLE public.tenant_memberships IS 'User-tenant relationships with roles';
COMMENT ON TABLE public.shift_assignments IS 'Tracks which users are assigned to specific shifts';
COMMENT ON TABLE public.audit_logs IS 'System-wide audit trail for security and compliance';

COMMENT ON POLICY "Users can create tenants during signup" ON public.tenants 
IS 'Allows authenticated users to create tenants during the signup process';

COMMENT ON POLICY "Users can create memberships during signup" ON public.tenant_memberships 
IS 'Allows users to create their own memberships or invite others if they are company admins';

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Check created tables
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('tenants', 'tenant_memberships', 'shift_assignments', 'audit_logs')
ORDER BY table_name;

-- Check RLS is enabled
SELECT 
  schemaname, 
  tablename, 
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('tenants', 'tenant_memberships', 'profiles', 'shifts', 'certificates')
ORDER BY tablename;

-- Check policies exist
SELECT 
  schemaname, 
  tablename, 
  policyname
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('tenants', 'tenant_memberships', 'profiles')
ORDER BY tablename, policyname;

-- Success message
SELECT 'Database setup completed successfully! You can now test signup functionality.' as message;