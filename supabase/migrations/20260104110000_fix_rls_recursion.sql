-- Fix RLS recursion by using SECURITY DEFINER functions
-- The previous migration caused infinite recursion between shifts and shift_assignments policies

-- Create helper function to check if promoter is assigned to a shift (bypasses RLS)
CREATE OR REPLACE FUNCTION is_promoter_assigned_to_shift(p_shift_id uuid, p_promoter_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM shift_assignments
    WHERE shift_id = p_shift_id
      AND promoter_id = p_promoter_id
  )
$$;

-- Create helper function to check if promoter works with company
CREATE OR REPLACE FUNCTION promoter_works_with_company(p_promoter_id uuid, p_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM shift_assignments sa
    INNER JOIN shifts s ON s.id = sa.shift_id
    WHERE sa.promoter_id = p_promoter_id
      AND s.company_id = p_company_id
  )
$$;

-- Drop the problematic policies
DROP POLICY IF EXISTS "Promoters can view assigned shifts" ON shifts;
DROP POLICY IF EXISTS "Promoters can view companies they work with" ON profiles;

-- Recreate shifts policy using helper function (no recursion)
CREATE POLICY "Promoters can view assigned shifts"
ON shifts FOR SELECT
USING (
  is_promoter_assigned_to_shift(id, auth.uid())
);

-- Recreate profiles policy using helper function (no recursion)
CREATE POLICY "Promoters can view companies they work with"
ON profiles FOR SELECT
USING (
  role = 'company'
  AND promoter_works_with_company(auth.uid(), id)
);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_promoter_assigned_to_shift(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION promoter_works_with_company(uuid, uuid) TO authenticated;
