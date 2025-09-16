-- Fix Shift Creation - Multi-tenant RLS Policy & Schema Updates
-- This migration fixes the shift creation issues by aligning database policies with the new multi-tenant role system

-- 1. Update helper functions to work with new role system
CREATE OR REPLACE FUNCTION public.is_company()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Check if user is company admin/manager in any active tenant
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_memberships tm
    WHERE tm.user_id = auth.uid() 
    AND tm.role IN ('company_admin', 'company_manager')
    AND tm.status = 'active'
  ) OR EXISTS (
    -- Also check legacy profiles table for backward compatibility
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.role IN ('company', 'company_admin', 'company_manager', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  );
$$;

-- 2. Ensure shifts table has both employer_id and tenant_id columns for compatibility
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS employer_id UUID; -- Keep for backward compatibility

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_shifts_tenant_id ON public.shifts (tenant_id);
CREATE INDEX IF NOT EXISTS idx_shifts_employer_id ON public.shifts (employer_id);

-- 3. Drop existing shift policies that are causing conflicts
DROP POLICY IF EXISTS "Companies can insert shifts" ON public.shifts;
DROP POLICY IF EXISTS "Companies can update own shifts" ON public.shifts;
DROP POLICY IF EXISTS "Companies can delete own shifts" ON public.shifts;
DROP POLICY IF EXISTS "shifts_tenant_all" ON public.shifts;

-- 4. Create comprehensive RLS policies for shifts that work with both tenant and legacy systems
CREATE POLICY "shifts_insert_company_users"
ON public.shifts FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow if user is admin
  public.is_admin() OR 
  -- Allow if user is company admin/manager and setting employer_id to their own user_id
  (public.is_company() AND employer_id = auth.uid()) OR
  -- Allow if user has active tenant membership and setting tenant_id correctly
  (tenant_id IN (
    SELECT tm.tenant_id 
    FROM public.tenant_memberships tm
    WHERE tm.user_id = auth.uid() 
    AND tm.role IN ('company_admin', 'company_manager')
    AND tm.status = 'active'
  ))
);

CREATE POLICY "shifts_select_all"
ON public.shifts FOR SELECT
TO authenticated
USING (
  -- Admins can see all shifts
  public.is_admin() OR
  -- Company users can see their own shifts (by employer_id)
  employer_id = auth.uid() OR
  -- Users can see shifts in their tenant
  tenant_id IN (
    SELECT tm.tenant_id 
    FROM public.tenant_memberships tm
    WHERE tm.user_id = auth.uid() AND tm.status = 'active'
  ) OR
  -- Part-timers can see shifts they're assigned to
  id IN (
    SELECT sa.shift_id FROM public.shift_assignments sa
    WHERE sa.promoter_id = auth.uid()
  )
);

CREATE POLICY "shifts_update_owners"
ON public.shifts FOR UPDATE
TO authenticated
USING (
  public.is_admin() OR 
  employer_id = auth.uid() OR
  tenant_id IN (
    SELECT tm.tenant_id 
    FROM public.tenant_memberships tm
    WHERE tm.user_id = auth.uid() 
    AND tm.role IN ('company_admin', 'company_manager')
    AND tm.status = 'active'
  )
)
WITH CHECK (
  public.is_admin() OR 
  employer_id = auth.uid() OR
  tenant_id IN (
    SELECT tm.tenant_id 
    FROM public.tenant_memberships tm
    WHERE tm.user_id = auth.uid() 
    AND tm.role IN ('company_admin', 'company_manager')
    AND tm.status = 'active'
  )
);

CREATE POLICY "shifts_delete_owners"
ON public.shifts FOR DELETE
TO authenticated
USING (
  public.is_admin() OR 
  employer_id = auth.uid() OR
  tenant_id IN (
    SELECT tm.tenant_id 
    FROM public.tenant_memberships tm
    WHERE tm.user_id = auth.uid() 
    AND tm.role IN ('company_admin', 'company_manager')
    AND tm.status = 'active'
  )
);

-- 5. Update shift_assignments policies to work with new system
DROP POLICY IF EXISTS "Companies can manage assignments for own shifts" ON public.shift_assignments;
DROP POLICY IF EXISTS "shift_assignments_tenant_all" ON public.shift_assignments;

-- Enable RLS on shift_assignments if not already enabled
ALTER TABLE public.shift_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shift_assignments_all_access"
ON public.shift_assignments FOR ALL
TO authenticated
USING (
  -- Admins can manage all assignments
  public.is_admin() OR
  -- Company users can manage assignments for their shifts
  shift_id IN (
    SELECT s.id FROM public.shifts s
    WHERE s.employer_id = auth.uid() OR 
          s.tenant_id IN (
            SELECT tm.tenant_id 
            FROM public.tenant_memberships tm
            WHERE tm.user_id = auth.uid() 
            AND tm.role IN ('company_admin', 'company_manager')
            AND tm.status = 'active'
          )
  ) OR
  -- Part-timers can view their own assignments
  promoter_id = auth.uid()
)
WITH CHECK (
  -- Same logic for inserts/updates
  public.is_admin() OR
  shift_id IN (
    SELECT s.id FROM public.shifts s
    WHERE s.employer_id = auth.uid() OR 
          s.tenant_id IN (
            SELECT tm.tenant_id 
            FROM public.tenant_memberships tm
            WHERE tm.user_id = auth.uid() 
            AND tm.role IN ('company_admin', 'company_manager')
            AND tm.status = 'active'
          )
  )
);

-- 6. Create a function to auto-populate tenant_id when employer_id is set
CREATE OR REPLACE FUNCTION public.auto_populate_shift_tenant()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If tenant_id is not set but employer_id is, try to get tenant from user's membership
  IF NEW.tenant_id IS NULL AND NEW.employer_id IS NOT NULL THEN
    SELECT tm.tenant_id INTO NEW.tenant_id
    FROM public.tenant_memberships tm
    WHERE tm.user_id = NEW.employer_id 
    AND tm.status = 'active'
    LIMIT 1;
  END IF;
  
  -- If employer_id is not set but tenant_id is, set employer_id to current user
  IF NEW.employer_id IS NULL AND NEW.tenant_id IS NOT NULL THEN
    NEW.employer_id := auth.uid();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-populate fields
DROP TRIGGER IF EXISTS trigger_auto_populate_shift_tenant ON public.shifts;
CREATE TRIGGER trigger_auto_populate_shift_tenant
  BEFORE INSERT ON public.shifts
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_populate_shift_tenant();

-- 7. Ensure profiles table has proper indexes and policies for role checking
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(id);

-- 8. Comments for documentation
COMMENT ON FUNCTION public.is_company() IS 'Checks if current user has company admin/manager role in any active tenant';
COMMENT ON FUNCTION public.auto_populate_shift_tenant() IS 'Auto-populates tenant_id and employer_id fields on shift creation';
COMMENT ON TABLE public.shifts IS 'Shifts table with dual support for legacy employer_id and new tenant_id multi-tenant system';