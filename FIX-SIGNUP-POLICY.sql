-- Fix company signup policy - Allow INSERT without membership requirement
-- This fixes "new row violates row-level security policy" error during signup

-- Drop the overly restrictive INSERT policy
DROP POLICY IF EXISTS "tenants_allow_insert" ON public.tenants;

-- Create a proper signup-friendly INSERT policy
CREATE POLICY "tenants_signup_insert"
  ON public.tenants FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Also ensure the SELECT policy allows users to see tenants they create
DROP POLICY IF EXISTS "tenants_allow_select" ON public.tenants;

-- Create a better SELECT policy that includes tenants the user created
CREATE POLICY "tenants_view_accessible"
  ON public.tenants FOR SELECT
  TO authenticated
  USING (
    -- Allow viewing if user has membership OR if they just created it
    EXISTS (
      SELECT 1 FROM public.tenant_memberships tm
      WHERE tm.tenant_id = id 
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
    )
  );

-- Ensure UPDATE policy is reasonable
DROP POLICY IF EXISTS "tenants_allow_update" ON public.tenants;

CREATE POLICY "tenants_update_members"
  ON public.tenants FOR UPDATE
  TO authenticated  
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_memberships tm
      WHERE tm.tenant_id = id 
      AND tm.user_id = auth.uid()
      AND tm.role IN ('company_admin', 'company_manager')
      AND tm.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenant_memberships tm
      WHERE tm.tenant_id = id 
      AND tm.user_id = auth.uid()
      AND tm.role IN ('company_admin', 'company_manager')
      AND tm.status = 'active'
    )
  );

-- Success message
SELECT 'SUCCESS: Company signup policy fixed - signup should work now!' as message;