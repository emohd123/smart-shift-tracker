-- ZNJTRY INITIAL SETUP: Multi-tenant core (tenants + tenant_memberships) with RLS
-- Run this in Supabase SQL Editor for project znjtryqrqxjghvvdlvdg
-- Safe to run multiple times (idempotent where possible)

-- 0) Required extensions for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Core tables
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

-- Helpful indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_subscription ON public.tenants(subscription_tier, subscription_status);
CREATE INDEX IF NOT EXISTS idx_tenants_created ON public.tenants(created_at);
CREATE INDEX IF NOT EXISTS idx_tenants_stripe ON public.tenants(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_memberships_tenant_user ON public.tenant_memberships(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_tenant_role ON public.tenant_memberships(tenant_id, role);
CREATE INDEX IF NOT EXISTS idx_memberships_user_status ON public.tenant_memberships(user_id, status);

-- 2) RLS enablement
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_memberships ENABLE ROW LEVEL SECURITY;

-- 3) Clean existing conflicting policies (safe if they don't exist)
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE schemaname='public' AND tablename='tenants' AND policyname='tenants_insert_authenticated';
  IF FOUND THEN EXECUTE 'DROP POLICY "tenants_insert_authenticated" ON public.tenants;'; END IF;

  PERFORM 1 FROM pg_policies WHERE schemaname='public' AND tablename='tenants' AND policyname='tenants_select_members';
  IF FOUND THEN EXECUTE 'DROP POLICY "tenants_select_members" ON public.tenants;'; END IF;

  PERFORM 1 FROM pg_policies WHERE schemaname='public' AND tablename='tenants' AND policyname='tenants_update_admins';
  IF FOUND THEN EXECUTE 'DROP POLICY "tenants_update_admins" ON public.tenants;'; END IF;

  PERFORM 1 FROM pg_policies WHERE schemaname='public' AND tablename='tenant_memberships' AND policyname='memberships_insert_auth';
  IF FOUND THEN EXECUTE 'DROP POLICY "memberships_insert_auth" ON public.tenant_memberships;'; END IF;

  PERFORM 1 FROM pg_policies WHERE schemaname='public' AND tablename='tenant_memberships' AND policyname='memberships_select_relevant';
  IF FOUND THEN EXECUTE 'DROP POLICY "memberships_select_relevant" ON public.tenant_memberships;'; END IF;

  PERFORM 1 FROM pg_policies WHERE schemaname='public' AND tablename='tenant_memberships' AND policyname='memberships_update_auth';
  IF FOUND THEN EXECUTE 'DROP POLICY "memberships_update_auth" ON public.tenant_memberships;'; END IF;
END $$;

-- 4) Minimal, non-recursive policies
-- Tenants
CREATE POLICY IF NOT EXISTS "tenants_select_simple"
  ON public.tenants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_memberships tm
      WHERE tm.tenant_id = id AND tm.user_id = auth.uid() AND tm.status = 'active'
    )
  );

CREATE POLICY IF NOT EXISTS "tenants_insert_simple"
  ON public.tenants FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "tenants_update_simple"
  ON public.tenants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_memberships tm
      WHERE tm.tenant_id = id AND tm.user_id = auth.uid() AND tm.role = 'company_admin' AND tm.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenant_memberships tm
      WHERE tm.tenant_id = id AND tm.user_id = auth.uid() AND tm.role = 'company_admin' AND tm.status = 'active'
    )
  );

-- Tenant memberships
CREATE POLICY IF NOT EXISTS "memberships_insert_simple"
  ON public.tenant_memberships FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "memberships_select_simple"
  ON public.tenant_memberships FOR SELECT
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.tenant_memberships tm2
      WHERE tm2.tenant_id = tenant_id AND tm2.user_id = auth.uid() AND tm2.role IN ('company_admin','company_manager') AND tm2.status='active'
    )
  );

CREATE POLICY IF NOT EXISTS "memberships_update_simple"
  ON public.tenant_memberships FOR UPDATE
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.tenant_memberships tm2
      WHERE tm2.tenant_id = tenant_id AND tm2.user_id = auth.uid() AND tm2.role = 'company_admin' AND tm2.status='active'
    )
  );

-- 5) Helper functions and triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;$$;

DO $$ BEGIN
  CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON public.tenants
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER update_memberships_updated_at
    BEFORE UPDATE ON public.tenant_memberships
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public AS $$
DECLARE tenant_id UUID; BEGIN
  SELECT tm.tenant_id INTO tenant_id
  FROM public.tenant_memberships tm
  WHERE tm.user_id = auth.uid() AND tm.status = 'active'
  LIMIT 1;
  RETURN tenant_id;
END;$$;

CREATE OR REPLACE FUNCTION public.is_tenant_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.tenant_memberships tm
    WHERE tm.user_id = auth.uid() AND tm.role = 'company_admin' AND tm.status = 'active'
  );
END;$$;

-- 6) Profiles/shifts tenant_id wiring if those tables exist
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='profiles'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='tenant_id'
    ) THEN
      ALTER TABLE public.profiles ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
      CREATE INDEX IF NOT EXISTS idx_profiles_tenant ON public.profiles(tenant_id);
    END IF;

    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

    -- Basic profiles policies
    DO $$ BEGIN
      PERFORM 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='profiles_insert_with_tenant';
      IF FOUND THEN EXECUTE 'DROP POLICY "profiles_insert_with_tenant" ON public.profiles;'; END IF;
    END $$;

    CREATE POLICY IF NOT EXISTS "profiles_insert_with_tenant"
      ON public.profiles FOR INSERT TO authenticated
      WITH CHECK (
        id = auth.uid() AND (
          tenant_id IS NULL OR tenant_id IN (
            SELECT tenant_id FROM public.tenant_memberships WHERE user_id = auth.uid() AND status = 'active'
          )
        )
      );

    DO $$ BEGIN
      PERFORM 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='profiles_select_tenant_members';
      IF FOUND THEN EXECUTE 'DROP POLICY "profiles_select_tenant_members" ON public.profiles;'; END IF;
    END $$;

    CREATE POLICY IF NOT EXISTS "profiles_select_tenant_members"
      ON public.profiles FOR SELECT
      USING (
        id = auth.uid() OR tenant_id IN (
          SELECT tenant_id FROM public.tenant_memberships WHERE user_id = auth.uid() AND status = 'active'
        )
      );

    DO $$ BEGIN
      PERFORM 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='profiles_update_own';
      IF FOUND THEN EXECUTE 'DROP POLICY "profiles_update_own" ON public.profiles;'; END IF;
    END $$;

    CREATE POLICY IF NOT EXISTS "profiles_update_own"
      ON public.profiles FOR UPDATE
      USING (id = auth.uid())
      WITH CHECK (id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='shifts'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='shifts' AND column_name='tenant_id'
    ) THEN
      ALTER TABLE public.shifts ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
      CREATE INDEX IF NOT EXISTS idx_shifts_tenant ON public.shifts(tenant_id);
    END IF;
    ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "shifts_tenant_all" ON public.shifts;
    CREATE POLICY "shifts_tenant_all"
      ON public.shifts FOR ALL
      USING (tenant_id IN (SELECT tenant_id FROM public.tenant_memberships WHERE user_id = auth.uid() AND status = 'active'))
      WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.tenant_memberships WHERE user_id = auth.uid() AND status = 'active'));
  END IF;
END $$;

-- 7) Verification
-- SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('tenants','tenant_memberships','profiles');
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename IN ('tenants','tenant_memberships','profiles') ORDER BY tablename, policyname;
