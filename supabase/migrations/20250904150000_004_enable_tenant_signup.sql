-- Enable tenant creation during signup
-- This migration adds policies to allow authenticated users to create tenants and memberships during signup

-- Add INSERT policy for tenants to allow new users to create their own tenants
CREATE POLICY "Users can create tenants during signup"
  ON public.tenants FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add INSERT policy for tenant_memberships to allow users to join tenants they create
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

-- Add INSERT policy for profiles to allow profile creation with tenant association
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

-- Drop the old restrictive profile insert policy if it exists
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;

-- Add comment for clarity
COMMENT ON POLICY "Users can create tenants during signup" ON public.tenants 
IS 'Allows authenticated users to create tenants during the signup process';

COMMENT ON POLICY "Users can create memberships during signup" ON public.tenant_memberships 
IS 'Allows users to create their own memberships or invite others if they are company admins';

COMMENT ON POLICY "profiles_insert_with_tenant" ON public.profiles 
IS 'Allows users to create profiles with proper tenant association during signup';