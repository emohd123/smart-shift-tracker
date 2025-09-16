-- COMPLETE SCHEMA SETUP for znjtry project
-- Creates all tables needed by the Smart Shift Tracker app
-- Run this in Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. TENANTS table (already exists but ensuring it's complete)
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  settings JSONB DEFAULT '{}',
  subscription_tier TEXT DEFAULT 'starter',
  subscription_status TEXT DEFAULT 'active',
  max_users INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. TENANT_MEMBERSHIPS table (already exists but ensuring it's complete)
CREATE TABLE IF NOT EXISTS public.tenant_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'part_timer',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

-- 3. PROFILES table (user profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  role TEXT DEFAULT 'part_timer',
  verification_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. SHIFTS table (the main table causing the error)
CREATE TABLE IF NOT EXISTS public.shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  end_date DATE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT,
  status TEXT DEFAULT 'open',
  pay_rate NUMERIC(10,2) DEFAULT 0,
  pay_rate_type TEXT DEFAULT 'hour',
  is_paid BOOLEAN DEFAULT false,
  is_assigned BOOLEAN DEFAULT false,
  assigned_promoters INTEGER DEFAULT 0,
  assigned_count INTEGER DEFAULT 0,
  hourly_rate NUMERIC(10,2),
  max_promoters INTEGER DEFAULT 1,
  employer_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. SHIFT_ASSIGNMENTS table (for tracking assignments)
CREATE TABLE IF NOT EXISTS public.shift_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  shift_id UUID NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  part_timer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'assigned',
  assigned_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(shift_id, part_timer_id)
);

-- 6. SHIFT_LOCATIONS table (for location data)
CREATE TABLE IF NOT EXISTS public.shift_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shift_id UUID NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  radius INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_memberships_tenant_user ON public.tenant_memberships(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant ON public.profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_shifts_tenant ON public.shifts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_shifts_date ON public.shifts(date);
CREATE INDEX IF NOT EXISTS idx_shifts_employer ON public.shifts(employer_id);
CREATE INDEX IF NOT EXISTS idx_assignments_shift ON public.shift_assignments(shift_id);
CREATE INDEX IF NOT EXISTS idx_assignments_part_timer ON public.shift_assignments(part_timer_id);
CREATE INDEX IF NOT EXISTS idx_locations_shift ON public.shift_locations(shift_id);

-- Enable RLS on all tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_locations ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for initial testing (can be tightened later)
-- Drop existing policies first, then create new ones
DO $$ BEGIN
  -- TENANTS policies
  DROP POLICY IF EXISTS "tenants_all" ON public.tenants;
  CREATE POLICY "tenants_all" ON public.tenants FOR ALL TO authenticated USING (true) WITH CHECK (true);

  -- TENANT_MEMBERSHIPS policies
  DROP POLICY IF EXISTS "memberships_all" ON public.tenant_memberships;
  CREATE POLICY "memberships_all" ON public.tenant_memberships FOR ALL TO authenticated USING (true) WITH CHECK (true);

  -- PROFILES policies
  DROP POLICY IF EXISTS "profiles_all" ON public.profiles;
  CREATE POLICY "profiles_all" ON public.profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

  -- SHIFTS policies (permissive for now)
  DROP POLICY IF EXISTS "shifts_all" ON public.shifts;
  CREATE POLICY "shifts_all" ON public.shifts FOR ALL TO authenticated USING (true) WITH CHECK (true);

  -- SHIFT_ASSIGNMENTS policies
  DROP POLICY IF EXISTS "assignments_all" ON public.shift_assignments;
  CREATE POLICY "assignments_all" ON public.shift_assignments FOR ALL TO authenticated USING (true) WITH CHECK (true);

  -- SHIFT_LOCATIONS policies
  DROP POLICY IF EXISTS "locations_all" ON public.shift_locations;
  CREATE POLICY "locations_all" ON public.shift_locations FOR ALL TO authenticated USING (true) WITH CHECK (true);
END $$;

-- Refresh PostgREST cache
SELECT pg_notify('pgrst', 'reload schema');
SELECT pg_notify('pgrst', 'reload config');

-- Verify tables were created
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('tenants', 'tenant_memberships', 'profiles', 'shifts', 'shift_assignments', 'shift_locations')
ORDER BY table_name;
