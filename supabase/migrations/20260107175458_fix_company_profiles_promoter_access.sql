-- Fix RLS policy for promoters to view company profiles
-- This ensures promoters can see company names for companies they're assigned to

-- Step 1: Create helper function if it doesn't exist
CREATE OR REPLACE FUNCTION public.get_shift_company_id(shift_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM shifts WHERE id = shift_id
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_shift_company_id(uuid) TO authenticated;

-- Step 2: Drop existing policy if it exists (to recreate it)
DROP POLICY IF EXISTS "Promoters can view company profiles for their assignments" ON public.company_profiles;

-- Step 3: Create RLS policy for promoters to view company profiles
CREATE POLICY "Promoters can view company profiles for their assignments" 
ON public.company_profiles 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.shift_assignments sa
    WHERE sa.promoter_id = auth.uid()
      AND public.get_shift_company_id(sa.shift_id) = company_profiles.user_id
  )
);

