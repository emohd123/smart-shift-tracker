-- Database setup for multi-tenant system
-- Run this in your Supabase SQL Editor

-- Create tenants table
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  domain TEXT,
  settings JSONB DEFAULT '{}',
  subscription_tier TEXT NOT NULL DEFAULT 'starter' CHECK (subscription_tier IN ('starter', 'professional', 'enterprise')),
  subscription_status TEXT NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('active', 'suspended', 'cancelled')),
  max_users INTEGER NOT NULL DEFAULT 10,
  stripe_customer_id TEXT,
  billing_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create tenant memberships table
CREATE TABLE IF NOT EXISTS public.tenant_memberships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'part_timer' CHECK (role IN ('company_admin', 'company_manager', 'part_timer')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(tenant_id, user_id)
);

-- Update profiles table to include tenant_id reference
DO $$
BEGIN
  -- Check if tenant_id column exists, if not add it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenant_memberships_tenant_id ON public.tenant_memberships(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_memberships_user_id ON public.tenant_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON public.profiles(tenant_id);

-- Enable RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_memberships ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies for tenants
CREATE POLICY "tenants_allow_insert"
  ON public.tenants FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "tenants_allow_select"
  ON public.tenants FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "tenants_allow_update"
  ON public.tenants FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for tenant memberships
CREATE POLICY "memberships_allow_insert"
  ON public.tenant_memberships FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "memberships_allow_select"
  ON public.tenant_memberships FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "memberships_allow_update"
  ON public.tenant_memberships FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create trigger function for updating updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER set_timestamp_tenants
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_tenant_memberships
  BEFORE UPDATE ON public.tenant_memberships
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

-- Success message
SELECT 'SUCCESS: Multi-tenant tables and policies created!' as message;
