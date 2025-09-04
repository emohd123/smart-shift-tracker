-- Multi-Tenant SaaS Foundation Migration
-- Phase 1: Add core multi-tenancy tables and tenant_id columns
-- Safe migration with zero data loss

-- STEP 1: Create core multi-tenant tables

-- 1. TENANTS - Central tenant management
CREATE TABLE public.tenants (
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
CREATE UNIQUE INDEX idx_tenants_slug ON public.tenants(slug);
CREATE INDEX idx_tenants_subscription ON public.tenants(subscription_tier, subscription_status);
CREATE INDEX idx_tenants_created ON public.tenants(created_at);

-- 2. TENANT_MEMBERSHIPS - User-tenant relationships with roles
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

-- Indexes for tenant_memberships
CREATE INDEX idx_memberships_tenant_user ON public.tenant_memberships(tenant_id, user_id);
CREATE INDEX idx_memberships_tenant_role ON public.tenant_memberships(tenant_id, role);
CREATE INDEX idx_memberships_user_status ON public.tenant_memberships(user_id, status);

-- STEP 2: Add tenant_id to existing tables (nullable first for safe migration)

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

-- Rename time_logs to timesheets and add tenant_id
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_logs' AND table_schema = 'public') THEN
    -- Rename table
    ALTER TABLE public.time_logs RENAME TO timesheets;
    
    -- Add new columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'timesheets' AND column_name = 'tenant_id') THEN
      ALTER TABLE public.timesheets ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
      ALTER TABLE public.timesheets ADD COLUMN approved_by UUID REFERENCES auth.users(id);
      ALTER TABLE public.timesheets ADD COLUMN approval_status TEXT CHECK (approval_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending';
      ALTER TABLE public.timesheets ADD COLUMN approved_at TIMESTAMPTZ;
      ALTER TABLE public.timesheets ADD COLUMN hourly_rate NUMERIC(10,2);
      
      CREATE INDEX IF NOT EXISTS idx_timesheets_tenant_user ON public.timesheets(tenant_id, user_id);
      CREATE INDEX IF NOT EXISTS idx_timesheets_approval ON public.timesheets(approval_status, approved_at);
    END IF;
  END IF;
END $$;

-- Update company_profiles to companies and add tenant_id
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'company_profiles' AND table_schema = 'public') THEN
    -- Rename table
    ALTER TABLE public.company_profiles RENAME TO companies;
    
    -- Add new columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'tenant_id') THEN
      ALTER TABLE public.companies ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
      ALTER TABLE public.companies ADD COLUMN stripe_customer_id TEXT UNIQUE;
      ALTER TABLE public.companies ADD COLUMN billing_email TEXT CHECK (billing_email IS NULL OR billing_email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$');
      
      CREATE INDEX IF NOT EXISTS idx_companies_tenant ON public.companies(tenant_id);
    END IF;
  END IF;
END $$;

-- Add tenant_id to certificates table (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'certificates' AND table_schema = 'public') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certificates' AND column_name = 'tenant_id') THEN
      ALTER TABLE public.certificates ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
      ALTER TABLE public.certificates ADD COLUMN certificate_uid TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex');
      ALTER TABLE public.certificates ADD COLUMN period_start DATE;
      ALTER TABLE public.certificates ADD COLUMN period_end DATE;
      ALTER TABLE public.certificates ADD COLUMN total_hours NUMERIC(10,2);
      ALTER TABLE public.certificates ADD COLUMN total_earnings NUMERIC(10,2);
      ALTER TABLE public.certificates ADD COLUMN pdf_url TEXT;
      
      CREATE INDEX IF NOT EXISTS idx_certificates_tenant ON public.certificates(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_certificates_uid ON public.certificates(certificate_uid);
    END IF;
  END IF;
END $$;

-- STEP 3: Create new multi-tenant specific tables

-- SHIFT_ASSIGNMENTS - Track who's assigned to shifts
CREATE TABLE public.shift_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  shift_id UUID NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  part_timer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL CHECK (status IN ('assigned', 'accepted', 'declined', 'completed', 'no_show')) DEFAULT 'assigned',
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(shift_id, part_timer_id)
);

-- Indexes for shift_assignments
CREATE INDEX idx_assignments_tenant_shift ON public.shift_assignments(tenant_id, shift_id);
CREATE INDEX idx_assignments_part_timer ON public.shift_assignments(part_timer_id, status);
CREATE INDEX idx_assignments_status ON public.shift_assignments(status, assigned_at);

-- AUDIT_LOGS - System audit trail
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'login', 'logout', 'invite', 'approve', 'reject')),
  resource_type TEXT NOT NULL CHECK (resource_type IN ('shift', 'certificate', 'timesheet', 'assignment', 'user', 'tenant')),
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for audit_logs
CREATE INDEX idx_audit_tenant_action ON public.audit_logs(tenant_id, action);
CREATE INDEX idx_audit_resource ON public.audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_created ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_user ON public.audit_logs(user_id, created_at DESC);

-- STEP 4: Add updated_at triggers for new tables
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_memberships_updated_at
  BEFORE UPDATE ON public.tenant_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at
  BEFORE UPDATE ON public.shift_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- STEP 5: Create helper functions
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  tenant_id UUID;
BEGIN
  -- Get tenant_id from user's active membership
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
SET search_path TO 'public'
AS $$
DECLARE
  is_admin BOOLEAN := FALSE;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.tenant_memberships 
    WHERE user_id = auth.uid() 
      AND role IN ('company_admin', 'company_manager')
      AND status = 'active'
  ) INTO is_admin;
  
  RETURN is_admin;
END;
$$;

-- STEP 6: Enable RLS on new tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (more comprehensive policies in next migration)
CREATE POLICY "Users can view their tenant"
  ON public.tenants FOR SELECT 
  USING (id IN (SELECT tenant_id FROM public.tenant_memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their memberships"
  ON public.tenant_memberships FOR SELECT
  USING (user_id = auth.uid() OR 
         (tenant_id IN (SELECT tenant_id FROM public.tenant_memberships 
                        WHERE user_id = auth.uid() AND role IN ('company_admin', 'company_manager'))));

CREATE POLICY "Tenant members can view assignments"
  ON public.shift_assignments FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM public.tenant_memberships WHERE user_id = auth.uid()));

CREATE POLICY "Tenant admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM public.tenant_memberships 
                       WHERE user_id = auth.uid() AND role IN ('company_admin', 'company_manager')));

-- Insert comments for documentation
COMMENT ON TABLE public.tenants IS 'Multi-tenant organizations using the platform';
COMMENT ON TABLE public.tenant_memberships IS 'User relationships to tenants with roles';
COMMENT ON TABLE public.shift_assignments IS 'Track part-timer assignments to shifts';
COMMENT ON TABLE public.audit_logs IS 'System-wide audit trail for compliance';

COMMENT ON COLUMN public.tenants.slug IS 'URL-friendly tenant identifier (mycompany.smartshift.app)';
COMMENT ON COLUMN public.tenant_memberships.role IS 'company_admin: full access, company_manager: limited admin, part_timer: worker';
COMMENT ON COLUMN public.shift_assignments.status IS 'Lifecycle: assigned -> accepted/declined -> completed/no_show';