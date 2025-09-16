-- Manual Migration: Enable Tenant Signup Policies
-- Copy and paste this SQL into your Supabase SQL Editor

-- Step 1: Enable tenant creation during signup
DROP POLICY IF EXISTS "Users can create tenants during signup" ON public.tenants;
CREATE POLICY "Users can create tenants during signup"
  ON public.tenants FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Step 2: Enable tenant membership creation during signup
DROP POLICY IF EXISTS "Users can create memberships during signup" ON public.tenant_memberships;
CREATE POLICY "Users can create memberships during signup"
  ON public.tenant_memberships FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow if user is creating membership for themselves
    user_id = auth.uid() OR
    -- Allow if user is company admin of the tenant (for inviting others later)
    tenant_id IN (
      SELECT tenant_id 
      FROM public.tenant_memberships 
      WHERE user_id = auth.uid() 
      AND role = 'company_admin' 
      AND status = 'active'
    )
  );

-- Step 3: Enable profile creation with tenant association
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_with_tenant" ON public.profiles;

CREATE POLICY "profiles_insert_with_tenant"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    id = auth.uid() AND
    -- Either no tenant restriction (for migration) or user belongs to the tenant
    (tenant_id IS NULL OR 
     tenant_id IN (
       SELECT tenant_id 
       FROM public.tenant_memberships 
       WHERE user_id = auth.uid() 
       AND status = 'active'
     ))
  );

-- Step 4: Add comments for documentation
COMMENT ON POLICY "Users can create tenants during signup" ON public.tenants 
IS 'Allows authenticated users to create tenants during the signup process';

COMMENT ON POLICY "Users can create memberships during signup" ON public.tenant_memberships 
IS 'Allows users to create their own memberships or invite others if they are company admins';

COMMENT ON POLICY "profiles_insert_with_tenant" ON public.profiles 
IS 'Allows users to create profiles with proper tenant association during signup';

-- Verification queries (run these after applying the policies)
-- SELECT 1. Check if policies exist
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('tenants', 'tenant_memberships', 'profiles')
AND policyname LIKE '%signup%'
ORDER BY tablename, policyname;