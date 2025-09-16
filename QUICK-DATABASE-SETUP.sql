-- QUICK DATABASE SETUP FOR SMART SHIFT TRACKER
-- Copy and paste this ENTIRE script into Supabase SQL Editor and click RUN
-- This will fix the "Could not find table 'public.tenants'" error

-- ============================================================
-- STEP 1: CREATE CORE TABLES
-- ============================================================

-- Create tenants table (companies/organizations)
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

-- Create tenant memberships table (user-tenant relationships)
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

-- ============================================================
-- STEP 2: CREATE INDEXES FOR PERFORMANCE
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_subscription ON public.tenants(subscription_tier, subscription_status);
CREATE INDEX IF NOT EXISTS idx_tenants_created ON public.tenants(created_at);
CREATE INDEX IF NOT EXISTS idx_memberships_tenant_user ON public.tenant_memberships(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_tenant_role ON public.tenant_memberships(tenant_id, role);
CREATE INDEX IF NOT EXISTS idx_memberships_user_status ON public.tenant_memberships(user_id, status);

-- ============================================================
-- STEP 3: ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_memberships ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 4: CREATE SIGNUP-FRIENDLY POLICIES
-- ============================================================

-- Allow users to create tenants during signup
DROP POLICY IF EXISTS "Users can create tenants during signup" ON public.tenants;
CREATE POLICY "Users can create tenants during signup"
  ON public.tenants FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow users to view their own tenants
DROP POLICY IF EXISTS "tenant_select_own" ON public.tenants;
CREATE POLICY "tenant_select_own"
  ON public.tenants FOR SELECT
  USING (id IN (SELECT tenant_id FROM public.tenant_memberships WHERE user_id = auth.uid() AND status = 'active'));

-- Allow tenant admins to update their tenants
DROP POLICY IF EXISTS "tenant_update_admins_only" ON public.tenants;
CREATE POLICY "tenant_update_admins_only"
  ON public.tenants FOR UPDATE
  USING (id IN (SELECT tenant_id FROM public.tenant_memberships 
                WHERE user_id = auth.uid() AND role = 'company_admin' AND status = 'active'))
  WITH CHECK (id IN (SELECT tenant_id FROM public.tenant_memberships 
                     WHERE user_id = auth.uid() AND role = 'company_admin' AND status = 'active'));

-- Allow users to create memberships during signup
DROP POLICY IF EXISTS "Users can create memberships during signup" ON public.tenant_memberships;
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

-- Allow users to view relevant memberships
DROP POLICY IF EXISTS "membership_select_own_and_tenant_admins" ON public.tenant_memberships;
CREATE POLICY "membership_select_own_and_tenant_admins"
  ON public.tenant_memberships FOR SELECT
  USING (
    user_id = auth.uid() OR 
    tenant_id IN (SELECT tenant_id FROM public.tenant_memberships 
                  WHERE user_id = auth.uid() AND role IN ('company_admin', 'company_manager') AND status = 'active')
  );

-- Allow users to update their own memberships or admins to update their tenant memberships
DROP POLICY IF EXISTS "membership_update_admins_and_self" ON public.tenant_memberships;
CREATE POLICY "membership_update_admins_and_self"
  ON public.tenant_memberships FOR UPDATE
  USING (
    user_id = auth.uid() OR 
    tenant_id IN (SELECT tenant_id FROM public.tenant_memberships 
                  WHERE user_id = auth.uid() AND role = 'company_admin' AND status = 'active')
  );

-- ============================================================
-- STEP 5: ADD HELPER FUNCTIONS (OPTIONAL BUT RECOMMENDED)
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
-- STEP 6: UPDATE EXISTING TABLES (IF THEY EXIST)
-- ============================================================

-- Add tenant_id to profiles table if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'tenant_id') THEN
      ALTER TABLE public.profiles ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
      CREATE INDEX IF NOT EXISTS idx_profiles_tenant ON public.profiles(tenant_id);
    END IF;
    
    -- Enable RLS on profiles if not already enabled
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    
    -- Create profile policies
    DROP POLICY IF EXISTS "profiles_insert_with_tenant" ON public.profiles;
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

    DROP POLICY IF EXISTS "profiles_select_tenant_members" ON public.profiles;
    CREATE POLICY "profiles_select_tenant_members"
      ON public.profiles FOR SELECT
      USING (tenant_id IN (SELECT tenant_id FROM public.tenant_memberships WHERE user_id = auth.uid() AND status = 'active'));

    DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
    CREATE POLICY "profiles_update_own"
      ON public.profiles FOR UPDATE
      USING (id = auth.uid())
      WITH CHECK (id = auth.uid());
  END IF;
END $$;

-- Add tenant_id to shifts table if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shifts' AND table_schema = 'public') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shifts' AND column_name = 'tenant_id') THEN
      ALTER TABLE public.shifts ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
      ALTER TABLE public.shifts ADD COLUMN assigned_count INTEGER DEFAULT 0;
      ALTER TABLE public.shifts ADD COLUMN hourly_rate NUMERIC(10,2);
      CREATE INDEX IF NOT EXISTS idx_shifts_tenant ON public.shifts(tenant_id);
    END IF;
    
    -- Enable RLS on shifts
    ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
    
    -- Create shift policies
    DROP POLICY IF EXISTS "shifts_tenant_access" ON public.shifts;
    CREATE POLICY "shifts_tenant_access"
      ON public.shifts FOR ALL
      USING (tenant_id IN (SELECT tenant_id FROM public.tenant_memberships WHERE user_id = auth.uid() AND status = 'active'))
      WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.tenant_memberships WHERE user_id = auth.uid() AND status = 'active'));
  END IF;
END $$;

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Check that tables were created
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('tenants', 'tenant_memberships')
ORDER BY table_name;

-- Check that RLS is enabled
SELECT 
  schemaname, 
  tablename, 
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('tenants', 'tenant_memberships')
ORDER BY tablename;

-- Success message
SELECT 'SUCCESS: Database setup completed! You can now test company signup.' as message;