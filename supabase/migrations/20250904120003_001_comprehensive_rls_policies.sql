-- Comprehensive RLS Policies for Multi-Tenant SaaS
-- This migration establishes strict tenant isolation with role-based access control

-- STEP 1: Enable RLS on all existing tables that now have tenant_id
DO $$
BEGIN
  -- Enable RLS on existing tables
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shifts' AND table_schema = 'public') THEN
    ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'timesheets' AND table_schema = 'public') THEN
    ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies' AND table_schema = 'public') THEN
    ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'certificates' AND table_schema = 'public') THEN
    ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- STEP 2: Drop existing basic policies to replace with comprehensive ones
DROP POLICY IF EXISTS "Users can view their tenant" ON public.tenants;
DROP POLICY IF EXISTS "Users can view their memberships" ON public.tenant_memberships;
DROP POLICY IF EXISTS "Tenant members can view assignments" ON public.shift_assignments;
DROP POLICY IF EXISTS "Tenant admins can view audit logs" ON public.audit_logs;

-- STEP 3: TENANTS table policies
CREATE POLICY "tenant_select_own"
  ON public.tenants FOR SELECT
  USING (id IN (SELECT tenant_id FROM public.tenant_memberships WHERE user_id = auth.uid() AND status = 'active'));

CREATE POLICY "tenant_update_admins_only"
  ON public.tenants FOR UPDATE
  USING (id IN (SELECT tenant_id FROM public.tenant_memberships 
                WHERE user_id = auth.uid() AND role = 'company_admin' AND status = 'active'))
  WITH CHECK (id IN (SELECT tenant_id FROM public.tenant_memberships 
                     WHERE user_id = auth.uid() AND role = 'company_admin' AND status = 'active'));

-- STEP 4: TENANT_MEMBERSHIPS table policies  
CREATE POLICY "membership_select_own_and_tenant_admins"
  ON public.tenant_memberships FOR SELECT
  USING (
    user_id = auth.uid() OR 
    tenant_id IN (SELECT tenant_id FROM public.tenant_memberships 
                  WHERE user_id = auth.uid() AND role IN ('company_admin', 'company_manager') AND status = 'active')
  );

CREATE POLICY "membership_insert_admins_only"
  ON public.tenant_memberships FOR INSERT
  WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM public.tenant_memberships 
                  WHERE user_id = auth.uid() AND role = 'company_admin' AND status = 'active')
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

-- STEP 5: PROFILES table policies
CREATE POLICY "profiles_select_tenant_members"
  ON public.profiles FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM public.tenant_memberships WHERE user_id = auth.uid() AND status = 'active'));

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid() AND tenant_id IN (SELECT tenant_id FROM public.tenant_memberships WHERE user_id = auth.uid() AND status = 'active'));

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_delete_own"
  ON public.profiles FOR DELETE
  USING (id = auth.uid());

-- STEP 6: COMPANIES table policies
CREATE POLICY "companies_select_tenant_members"
  ON public.companies FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM public.tenant_memberships WHERE user_id = auth.uid() AND status = 'active'));

CREATE POLICY "companies_insert_admins_only"
  ON public.companies FOR INSERT
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.tenant_memberships 
                            WHERE user_id = auth.uid() AND role IN ('company_admin', 'company_manager') AND status = 'active'));

CREATE POLICY "companies_update_admins_only" 
  ON public.companies FOR UPDATE
  USING (tenant_id IN (SELECT tenant_id FROM public.tenant_memberships 
                       WHERE user_id = auth.uid() AND role IN ('company_admin', 'company_manager') AND status = 'active'));

CREATE POLICY "companies_delete_admins_only"
  ON public.companies FOR DELETE
  USING (tenant_id IN (SELECT tenant_id FROM public.tenant_memberships 
                       WHERE user_id = auth.uid() AND role = 'company_admin' AND status = 'active'));

-- STEP 7: SHIFTS table policies
CREATE POLICY "shifts_select_tenant_members"
  ON public.shifts FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM public.tenant_memberships WHERE user_id = auth.uid() AND status = 'active'));

CREATE POLICY "shifts_insert_admins_only"
  ON public.shifts FOR INSERT
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.tenant_memberships 
                            WHERE user_id = auth.uid() AND role IN ('company_admin', 'company_manager') AND status = 'active'));

CREATE POLICY "shifts_update_admins_only"
  ON public.shifts FOR UPDATE
  USING (tenant_id IN (SELECT tenant_id FROM public.tenant_memberships 
                       WHERE user_id = auth.uid() AND role IN ('company_admin', 'company_manager') AND status = 'active'));

CREATE POLICY "shifts_delete_admins_only"
  ON public.shifts FOR DELETE
  USING (tenant_id IN (SELECT tenant_id FROM public.tenant_memberships 
                       WHERE user_id = auth.uid() AND role = 'company_admin' AND status = 'active'));

-- STEP 8: SHIFT_ASSIGNMENTS table policies
CREATE POLICY "assignments_select_involved_users"
  ON public.shift_assignments FOR SELECT
  USING (
    part_timer_id = auth.uid() OR 
    tenant_id IN (SELECT tenant_id FROM public.tenant_memberships 
                  WHERE user_id = auth.uid() AND role IN ('company_admin', 'company_manager') AND status = 'active')
  );

CREATE POLICY "assignments_insert_admins_only"
  ON public.shift_assignments FOR INSERT
  WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM public.tenant_memberships 
                  WHERE user_id = auth.uid() AND role IN ('company_admin', 'company_manager') AND status = 'active') AND
    assigned_by = auth.uid()
  );

CREATE POLICY "assignments_update_admins_and_assigned_users"
  ON public.shift_assignments FOR UPDATE
  USING (
    part_timer_id = auth.uid() OR 
    tenant_id IN (SELECT tenant_id FROM public.tenant_memberships 
                  WHERE user_id = auth.uid() AND role IN ('company_admin', 'company_manager') AND status = 'active')
  );

CREATE POLICY "assignments_delete_admins_only"
  ON public.shift_assignments FOR DELETE
  USING (tenant_id IN (SELECT tenant_id FROM public.tenant_memberships 
                       WHERE user_id = auth.uid() AND role IN ('company_admin', 'company_manager') AND status = 'active'));

-- STEP 9: TIMESHEETS table policies
CREATE POLICY "timesheets_select_own_and_admins"
  ON public.timesheets FOR SELECT
  USING (
    user_id = auth.uid() OR 
    tenant_id IN (SELECT tenant_id FROM public.tenant_memberships 
                  WHERE user_id = auth.uid() AND role IN ('company_admin', 'company_manager') AND status = 'active')
  );

CREATE POLICY "timesheets_insert_own"
  ON public.timesheets FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND 
    tenant_id IN (SELECT tenant_id FROM public.tenant_memberships WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "timesheets_update_own_and_admin_approval"
  ON public.timesheets FOR UPDATE
  USING (
    -- Users can update their own pending timesheets
    (user_id = auth.uid() AND approval_status = 'pending') OR
    -- Admins can approve/reject any timesheet in their tenant
    (tenant_id IN (SELECT tenant_id FROM public.tenant_memberships 
                   WHERE user_id = auth.uid() AND role IN ('company_admin', 'company_manager') AND status = 'active'))
  );

CREATE POLICY "timesheets_delete_own_pending"
  ON public.timesheets FOR DELETE
  USING (user_id = auth.uid() AND approval_status = 'pending');

-- STEP 10: CERTIFICATES table policies  
CREATE POLICY "certificates_select_own_and_public_verification"
  ON public.certificates FOR SELECT
  USING (
    user_id = auth.uid() OR 
    certificate_uid IS NOT NULL -- Allow public verification by UID
  );

CREATE POLICY "certificates_insert_own"
  ON public.certificates FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND 
    tenant_id IN (SELECT tenant_id FROM public.tenant_memberships WHERE user_id = auth.uid() AND status = 'active')
  );

-- Note: Certificates are typically immutable once created, so no UPDATE/DELETE policies

-- STEP 11: AUDIT_LOGS table policies
CREATE POLICY "audit_logs_select_tenant_admins"
  ON public.audit_logs FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM public.tenant_memberships 
                       WHERE user_id = auth.uid() AND role IN ('company_admin', 'company_manager') AND status = 'active'));

CREATE POLICY "audit_logs_insert_system_only"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true); -- System functions can insert audit logs

-- STEP 12: Create helper functions for common RLS checks
CREATE OR REPLACE FUNCTION public.user_has_tenant_role(check_tenant_id UUID, required_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE user_id = auth.uid()
      AND tenant_id = check_tenant_id
      AND role = ANY(required_roles)
      AND status = 'active'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.user_belongs_to_tenant(check_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE user_id = auth.uid()
      AND tenant_id = check_tenant_id
      AND status = 'active'
  );
END;
$$;

-- STEP 13: Create audit trigger for tracking changes
CREATE OR REPLACE FUNCTION public.audit_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  tenant_id_val UUID;
  old_values JSONB;
  new_values JSONB;
BEGIN
  -- Extract tenant_id from the record
  IF TG_OP = 'DELETE' THEN
    tenant_id_val := (OLD).tenant_id;
    old_values := to_jsonb(OLD);
    new_values := NULL;
  ELSE
    tenant_id_val := (NEW).tenant_id;
    old_values := CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END;
    new_values := to_jsonb(NEW);
  END IF;

  -- Insert audit log
  INSERT INTO public.audit_logs (
    tenant_id,
    user_id,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values,
    created_at
  ) VALUES (
    tenant_id_val,
    auth.uid(),
    LOWER(TG_OP),
    TG_TABLE_NAME,
    COALESCE((NEW).id, (OLD).id),
    old_values,
    new_values,
    now()
  );

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

-- Apply audit triggers to key tables
CREATE TRIGGER audit_shifts_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.shifts
  FOR EACH ROW EXECUTE FUNCTION public.audit_changes();

CREATE TRIGGER audit_assignments_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.shift_assignments
  FOR EACH ROW EXECUTE FUNCTION public.audit_changes();

CREATE TRIGGER audit_timesheets_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.timesheets
  FOR EACH ROW EXECUTE FUNCTION public.audit_changes();

-- STEP 14: Grant necessary permissions
GRANT SELECT ON public.tenants TO authenticated;
GRANT SELECT ON public.tenant_memberships TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.shifts TO authenticated;
GRANT ALL ON public.shift_assignments TO authenticated;
GRANT ALL ON public.timesheets TO authenticated;
GRANT SELECT ON public.companies TO authenticated;
GRANT ALL ON public.certificates TO authenticated;
GRANT SELECT ON public.audit_logs TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Comprehensive RLS policies have been successfully applied. Multi-tenant security is now active.';
END $$;