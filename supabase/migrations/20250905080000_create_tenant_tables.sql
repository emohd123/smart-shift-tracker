-- Create tenant tables for multi-tenant architecture
-- This fixes the "Could not find table 'public.tenants'" error

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- Create performance indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_subscription ON public.tenants(subscription_tier, subscription_status);
CREATE INDEX IF NOT EXISTS idx_tenants_created ON public.tenants(created_at);
CREATE INDEX IF NOT EXISTS idx_tenants_stripe ON public.tenants(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_memberships_tenant_user ON public.tenant_memberships(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_tenant_role ON public.tenant_memberships(tenant_id, role);
CREATE INDEX IF NOT EXISTS idx_memberships_user_status ON public.tenant_memberships(user_id, status);
CREATE INDEX IF NOT EXISTS idx_memberships_user_active ON public.tenant_memberships(user_id) WHERE status = 'active';

-- Enable Row Level Security
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_memberships ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies for tenants
CREATE POLICY "tenants_insert_authenticated"
  ON public.tenants FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "tenants_select_members"
  ON public.tenants FOR SELECT
  USING (
    id IN (
      SELECT tenant_id 
      FROM public.tenant_memberships 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "tenants_update_admins"
  ON public.tenants FOR UPDATE
  USING (
    id IN (
      SELECT tenant_id 
      FROM public.tenant_memberships 
      WHERE user_id = auth.uid() 
      AND role = 'company_admin' 
      AND status = 'active'
    )
  )
  WITH CHECK (
    id IN (
      SELECT tenant_id 
      FROM public.tenant_memberships 
      WHERE user_id = auth.uid() 
      AND role = 'company_admin' 
      AND status = 'active'
    )
  );

-- Create comprehensive policies for tenant_memberships
CREATE POLICY "memberships_insert_auth"
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

CREATE POLICY "memberships_select_relevant"
  ON public.tenant_memberships FOR SELECT
  USING (
    user_id = auth.uid() OR 
    tenant_id IN (
      SELECT tenant_id 
      FROM public.tenant_memberships 
      WHERE user_id = auth.uid() 
      AND role IN ('company_admin', 'company_manager') 
      AND status = 'active'
    )
  );

CREATE POLICY "memberships_update_auth"
  ON public.tenant_memberships FOR UPDATE
  USING (
    user_id = auth.uid() OR 
    tenant_id IN (
      SELECT tenant_id 
      FROM public.tenant_memberships 
      WHERE user_id = auth.uid() 
      AND role = 'company_admin' 
      AND status = 'active'
    )
  )
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

-- Create utility functions
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tenant_id UUID;
BEGIN
  SELECT tm.tenant_id INTO tenant_id
  FROM public.tenant_memberships tm
  WHERE tm.user_id = auth.uid() 
  AND tm.status = 'active'
  LIMIT 1;
  
  RETURN tenant_id;
END;
$$;

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

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_memberships_updated_at
  BEFORE UPDATE ON public.tenant_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add tenant_id to existing tables if they exist
-- Add tenant_id to profiles table if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'tenant_id') THEN
      ALTER TABLE public.profiles ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
      CREATE INDEX IF NOT EXISTS idx_profiles_tenant ON public.profiles(tenant_id);
    END IF;
    
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    
    -- Create policies for profiles
    DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
    CREATE POLICY "profiles_insert_own"
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

    DROP POLICY IF EXISTS "profiles_select_tenant" ON public.profiles;
    CREATE POLICY "profiles_select_tenant"
      ON public.profiles FOR SELECT
      USING (
        id = auth.uid() OR
        tenant_id IN (
          SELECT tenant_id 
          FROM public.tenant_memberships 
          WHERE user_id = auth.uid() 
          AND status = 'active'
        )
      );

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
      CREATE INDEX IF NOT EXISTS idx_shifts_tenant ON public.shifts(tenant_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shifts' AND column_name = 'assigned_count') THEN
      ALTER TABLE public.shifts ADD COLUMN assigned_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shifts' AND column_name = 'hourly_rate') THEN
      ALTER TABLE public.shifts ADD COLUMN hourly_rate NUMERIC(10,2);
    END IF;
    
    ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "shifts_tenant_all" ON public.shifts;
    CREATE POLICY "shifts_tenant_all"
      ON public.shifts FOR ALL
      USING (
        tenant_id IN (
          SELECT tenant_id 
          FROM public.tenant_memberships 
          WHERE user_id = auth.uid() 
          AND status = 'active'
        )
      )
      WITH CHECK (
        tenant_id IN (
          SELECT tenant_id 
          FROM public.tenant_memberships 
          WHERE user_id = auth.uid() 
          AND status = 'active'
        )
      );
  END IF;
END $$;