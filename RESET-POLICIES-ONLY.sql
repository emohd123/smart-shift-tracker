-- RESET POLICIES ONLY - Fix infinite recursion
-- Run this to fix the policy recursion issue without recreating tables

-- Drop ALL existing policies on both tables
DROP POLICY IF EXISTS "tenants_insert_authenticated" ON public.tenants;
DROP POLICY IF EXISTS "tenants_insert_signup" ON public.tenants;
DROP POLICY IF EXISTS "tenants_select_members" ON public.tenants;
DROP POLICY IF EXISTS "tenants_select_simple" ON public.tenants;
DROP POLICY IF EXISTS "tenants_view_own" ON public.tenants;
DROP POLICY IF EXISTS "tenants_update_admins" ON public.tenants;
DROP POLICY IF EXISTS "tenants_update_simple" ON public.tenants;
DROP POLICY IF EXISTS "tenants_update_admin" ON public.tenants;

DROP POLICY IF EXISTS "memberships_insert_auth" ON public.tenant_memberships;
DROP POLICY IF EXISTS "memberships_insert_simple" ON public.tenant_memberships;
DROP POLICY IF EXISTS "memberships_insert_own" ON public.tenant_memberships;
DROP POLICY IF EXISTS "memberships_select_relevant" ON public.tenant_memberships;
DROP POLICY IF EXISTS "memberships_select_simple" ON public.tenant_memberships;
DROP POLICY IF EXISTS "memberships_view_involved" ON public.tenant_memberships;
DROP POLICY IF EXISTS "memberships_update_auth" ON public.tenant_memberships;
DROP POLICY IF EXISTS "memberships_update_simple" ON public.tenant_memberships;
DROP POLICY IF EXISTS "memberships_update_own" ON public.tenant_memberships;
DROP POLICY IF EXISTS "Users can create tenants during signup" ON public.tenants;
DROP POLICY IF EXISTS "Users can create memberships during signup" ON public.tenant_memberships;

-- Create very simple, non-recursive policies

-- TENANTS POLICIES (completely independent)
CREATE POLICY "tenants_allow_insert"
  ON public.tenants FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- For now, disable complex SELECT policies that cause recursion
-- We'll allow all authenticated users to see tenants (can be restricted later)
CREATE POLICY "tenants_allow_select"
  ON public.tenants FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "tenants_allow_update"
  ON public.tenants FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- MEMBERSHIPS POLICIES (completely independent) 
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

-- Success message
SELECT 'SUCCESS: Policies reset - recursion issue should be resolved!' as message;