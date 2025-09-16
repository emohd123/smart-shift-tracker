-- Fix infinite recursion in tenant policies
-- This resolves the circular policy reference issue

-- First, drop all existing problematic policies
DROP POLICY IF EXISTS "tenants_select_members" ON public.tenants;
DROP POLICY IF EXISTS "tenants_update_admins" ON public.tenants;
DROP POLICY IF EXISTS "memberships_insert_auth" ON public.tenant_memberships;
DROP POLICY IF EXISTS "memberships_select_relevant" ON public.tenant_memberships;
DROP POLICY IF EXISTS "memberships_update_auth" ON public.tenant_memberships;

-- Create simple, non-recursive policies for tenants
CREATE POLICY "tenants_select_simple"
  ON public.tenants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM public.tenant_memberships tm
      WHERE tm.tenant_id = id 
      AND tm.user_id = auth.uid() 
      AND tm.status = 'active'
    )
  );

CREATE POLICY "tenants_update_simple"
  ON public.tenants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.tenant_memberships tm
      WHERE tm.tenant_id = id
      AND tm.user_id = auth.uid()
      AND tm.role = 'company_admin'
      AND tm.status = 'active'
    )
  );

-- Create simple, non-recursive policies for tenant_memberships
CREATE POLICY "memberships_insert_simple"
  ON public.tenant_memberships FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "memberships_select_simple"
  ON public.tenant_memberships FOR SELECT
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 
      FROM public.tenant_memberships tm2
      WHERE tm2.tenant_id = tenant_id
      AND tm2.user_id = auth.uid()
      AND tm2.role IN ('company_admin', 'company_manager')
      AND tm2.status = 'active'
    )
  );

CREATE POLICY "memberships_update_simple"
  ON public.tenant_memberships FOR UPDATE
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1
      FROM public.tenant_memberships tm2
      WHERE tm2.tenant_id = tenant_id
      AND tm2.user_id = auth.uid()
      AND tm2.role = 'company_admin'
      AND tm2.status = 'active'
    )
  );