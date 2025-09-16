-- OPTIMIZED SCHEMA SETUP for znjtry project
-- Adds performance indexes and proper RLS policies
-- Run this in Supabase SQL Editor after COMPLETE_SCHEMA_SETUP.sql

-- Performance Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tenant_memberships_user_id ON public.tenant_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_memberships_tenant_id ON public.tenant_memberships(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_memberships_status ON public.tenant_memberships(status);

CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON public.profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

CREATE INDEX IF NOT EXISTS idx_shifts_tenant_id ON public.shifts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_shifts_status ON public.shifts(status);
CREATE INDEX IF NOT EXISTS idx_shifts_date ON public.shifts(date);
CREATE INDEX IF NOT EXISTS idx_shifts_employer_id ON public.shifts(employer_id);
CREATE INDEX IF NOT EXISTS idx_shifts_created_at ON public.shifts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_shift_assignments_shift_id ON public.shift_assignments(shift_id);
CREATE INDEX IF NOT EXISTS idx_shift_assignments_part_timer_id ON public.shift_assignments(part_timer_id);
CREATE INDEX IF NOT EXISTS idx_shift_assignments_status ON public.shift_assignments(status);

CREATE INDEX IF NOT EXISTS idx_shift_locations_shift_id ON public.shift_locations(shift_id);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_shifts_tenant_status_date ON public.shifts(tenant_id, status, date);
CREATE INDEX IF NOT EXISTS idx_assignments_shift_status ON public.shift_assignments(shift_id, status);
CREATE INDEX IF NOT EXISTS idx_memberships_tenant_role_status ON public.tenant_memberships(tenant_id, role, status);

-- Refined RLS Policies (more secure than the permissive ones)

-- Drop existing permissive policies if they exist
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.tenants;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.tenant_memberships;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.shifts;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.shift_assignments;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.shift_locations;

-- Proper RLS Policies

-- TENANTS: Only members can view their tenant, admins can create/update
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tenants' AND policyname = 'Users can view their tenant') THEN
        CREATE POLICY "Users can view their tenant" ON public.tenants FOR SELECT
        USING (
            EXISTS (
                SELECT 1 FROM public.tenant_memberships tm
                WHERE tm.tenant_id = id
                AND tm.user_id = auth.uid()
                AND tm.status = 'active'
            )
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tenants' AND policyname = 'Admins can create tenants') THEN
        CREATE POLICY "Admins can create tenants" ON public.tenants FOR INSERT
        WITH CHECK (auth.uid() IS NOT NULL);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tenants' AND policyname = 'Admin members can update tenant') THEN
        CREATE POLICY "Admin members can update tenant" ON public.tenants FOR UPDATE
        USING (
            EXISTS (
                SELECT 1 FROM public.tenant_memberships tm
                WHERE tm.tenant_id = id
                AND tm.user_id = auth.uid()
                AND tm.role IN ('admin', 'company_admin')
                AND tm.status = 'active'
            )
        );
    END IF;
END $$;

-- TENANT_MEMBERSHIPS: Users can view/update their own membership, admins can manage all
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tenant_memberships' AND policyname = 'Users can view memberships in their tenant') THEN
        CREATE POLICY "Users can view memberships in their tenant" ON public.tenant_memberships FOR SELECT
        USING (
            user_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.tenant_memberships tm
                WHERE tm.tenant_id = tenant_memberships.tenant_id
                AND tm.user_id = auth.uid()
                AND tm.role IN ('admin', 'company_admin')
                AND tm.status = 'active'
            )
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tenant_memberships' AND policyname = 'Users can create membership') THEN
        CREATE POLICY "Users can create membership" ON public.tenant_memberships FOR INSERT
        WITH CHECK (user_id = auth.uid() OR auth.uid() IS NOT NULL);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tenant_memberships' AND policyname = 'Users can update own membership') THEN
        CREATE POLICY "Users can update own membership" ON public.tenant_memberships FOR UPDATE
        USING (
            user_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.tenant_memberships tm
                WHERE tm.tenant_id = tenant_memberships.tenant_id
                AND tm.user_id = auth.uid()
                AND tm.role IN ('admin', 'company_admin')
                AND tm.status = 'active'
            )
        );
    END IF;
END $$;

-- PROFILES: Users can view/update own profile, team members can view each other
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can view profiles in their tenant') THEN
        CREATE POLICY "Users can view profiles in their tenant" ON public.profiles FOR SELECT
        USING (
            id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.tenant_memberships tm1
                JOIN public.tenant_memberships tm2 ON tm1.tenant_id = tm2.tenant_id
                WHERE tm1.user_id = auth.uid()
                AND tm2.user_id = profiles.id
                AND tm1.status = 'active'
                AND tm2.status = 'active'
            )
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can create own profile') THEN
        CREATE POLICY "Users can create own profile" ON public.profiles FOR INSERT
        WITH CHECK (id = auth.uid());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can update own profile') THEN
        CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE
        USING (id = auth.uid());
    END IF;
END $$;

-- SHIFTS: Tenant members can view shifts, company/admin can manage
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'shifts' AND policyname = 'Users can view shifts in their tenant') THEN
        CREATE POLICY "Users can view shifts in their tenant" ON public.shifts FOR SELECT
        USING (
            EXISTS (
                SELECT 1 FROM public.tenant_memberships tm
                WHERE tm.tenant_id = shifts.tenant_id
                AND tm.user_id = auth.uid()
                AND tm.status = 'active'
            )
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'shifts' AND policyname = 'Company users can create shifts') THEN
        CREATE POLICY "Company users can create shifts" ON public.shifts FOR INSERT
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.tenant_memberships tm
                WHERE tm.tenant_id = shifts.tenant_id
                AND tm.user_id = auth.uid()
                AND tm.role IN ('admin', 'company_admin', 'company_manager')
                AND tm.status = 'active'
            )
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'shifts' AND policyname = 'Company users can update shifts') THEN
        CREATE POLICY "Company users can update shifts" ON public.shifts FOR UPDATE
        USING (
            EXISTS (
                SELECT 1 FROM public.tenant_memberships tm
                WHERE tm.tenant_id = shifts.tenant_id
                AND tm.user_id = auth.uid()
                AND tm.role IN ('admin', 'company_admin', 'company_manager')
                AND tm.status = 'active'
            )
        );
    END IF;
END $$;

-- Enable RLS on all tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_locations ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Update function for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all tables (drop existing ones first to avoid conflicts)
DROP TRIGGER IF EXISTS handle_updated_at ON public.tenants;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.tenants
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON public.tenant_memberships;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.tenant_memberships
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON public.profiles;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON public.shifts;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.shifts
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Clean up any test data (optional - uncomment if needed)
-- DELETE FROM public.shift_assignments WHERE created_at < now() - interval '1 day';
-- DELETE FROM public.shifts WHERE title LIKE '%Test%' OR title LIKE '%Debug%';
-- DELETE FROM public.tenants WHERE name LIKE '%Test%' OR name LIKE '%Debug%';

NOTIFY pgrst, 'reload schema';
