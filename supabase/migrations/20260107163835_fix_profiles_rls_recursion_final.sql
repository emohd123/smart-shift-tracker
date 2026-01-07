-- Fix RLS Infinite Recursion in profiles table
-- The "Companies can view assigned promoters" policy was causing infinite recursion
-- by querying shift_assignments and shifts tables which trigger RLS policies that query profiles again

-- Create helper function that bypasses RLS to check if a promoter is assigned to a company's shift
CREATE OR REPLACE FUNCTION is_promoter_assigned_to_company_shift(
  p_promoter_id uuid,
  p_company_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM shift_assignments sa
    INNER JOIN shifts s ON s.id = sa.shift_id
    WHERE sa.promoter_id = p_promoter_id
      AND s.company_id = p_company_id
  );
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_promoter_assigned_to_company_shift(uuid, uuid) TO authenticated;

-- Drop the problematic policy that causes recursion
DROP POLICY IF EXISTS "Companies can view assigned promoters" ON public.profiles;

-- Recreate the policy using the helper function (no recursion)
CREATE POLICY "Companies can view assigned promoters"
ON public.profiles FOR SELECT
TO authenticated
USING (
  role = 'promoter'
  AND is_promoter_assigned_to_company_shift(id, auth.uid())
);

