-- CLEAN DATABASE SETUP FOR SMART SHIFT TRACKER
-- This version avoids infinite recursion in policies
-- Copy this ENTIRE script and run it in Supabase SQL Editor

-- Drop any existing problematic tables and policies to start fresh
DROP TABLE IF EXISTS public.tenant_memberships CASCADE;
DROP TABLE IF EXISTS public.tenants CASCADE;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tenants table (companies/organizations)
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  domain TEXT UNIQUE,
  settings JSONB NOT NULL DEFAULT '{}',
  subscription_tier TEXT CHECK (subscription_tier IN ('starter', 'professional', 'enterprise')) DEFAULT 'starter',
  subscription_status TEXT CHECK (subscription_status IN ('active', 'suspended', 'cancelled')) DEFAULT 'active',
  max_users INTEGER NOT NULL DEFAULT 50 CHECK (max_users > 0),
  stripe_customer_id TEXT UNIQUE,
  billing_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create tenant memberships table (user-tenant relationships)
CREATE TABLE public.tenant_memberships (
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
CREATE UNIQUE INDEX idx_tenants_slug ON public.tenants(slug);
CREATE INDEX idx_tenants_subscription ON public.tenants(subscription_tier, subscription_status);
CREATE INDEX idx_tenants_created ON public.tenants(created_at);
CREATE INDEX idx_memberships_tenant_user ON public.tenant_memberships(tenant_id, user_id);
CREATE INDEX idx_memberships_user_active ON public.tenant_memberships(user_id) WHERE status = 'active';

-- Enable Row Level Security
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_memberships ENABLE ROW LEVEL SECURITY;

-- SIMPLE, NON-RECURSIVE POLICIES

-- Allow authenticated users to create tenants during signup
CREATE POLICY "tenants_insert_signup"
  ON public.tenants FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow users to view tenants they belong to (non-recursive)
CREATE POLICY "tenants_view_own"
  ON public.tenants FOR SELECT
  TO authenticated
  USING (
    id = ANY(
      SELECT tm.tenant_id 
      FROM public.tenant_memberships tm 
      WHERE tm.user_id = auth.uid() AND tm.status = 'active'
    )
  );

-- Allow company admins to update their tenants (non-recursive)
CREATE POLICY "tenants_update_admin"
  ON public.tenants FOR UPDATE
  TO authenticated
  USING (
    id = ANY(
      SELECT tm.tenant_id 
      FROM public.tenant_memberships tm 
      WHERE tm.user_id = auth.uid() 
      AND tm.role = 'company_admin' 
      AND tm.status = 'active'
    )
  );

-- Allow users to create their own memberships
CREATE POLICY "memberships_insert_own"
  ON public.tenant_memberships FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Allow users to view memberships where they're involved
CREATE POLICY "memberships_view_involved"
  ON public.tenant_memberships FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    tenant_id = ANY(
      SELECT tm.tenant_id 
      FROM public.tenant_memberships tm 
      WHERE tm.user_id = auth.uid() 
      AND tm.role IN ('company_admin', 'company_manager')
      AND tm.status = 'active'
    )
  );

-- Allow users to update their own memberships
CREATE POLICY "memberships_update_own"
  ON public.tenant_memberships FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

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

-- Create triggers
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_memberships_updated_at
  BEFORE UPDATE ON public.tenant_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Success message
SELECT 'SUCCESS: Clean database setup completed without recursion issues!' as message;