-- Final fix for promoter access to shift details
-- Problem: Promoters can see their assignments but not the shift details

-- First, ensure the helper function exists and is correct
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
  );
$$;

GRANT EXECUTE ON FUNCTION is_promoter_assigned_to_shift(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_promoter_assigned_to_shift(uuid, uuid) TO anon;

-- Drop ALL existing promoter-related shift policies to start fresh
DROP POLICY IF EXISTS "Promoters can view assigned shifts" ON shifts;
DROP POLICY IF EXISTS "Promoters can view their assigned shifts" ON shifts;
DROP POLICY IF EXISTS "Promoters can view shifts via assignments" ON shifts;
DROP POLICY IF EXISTS "Promoters can view shifts they are assigned to" ON shifts;

-- Create a single, simple policy for promoters to view shifts
-- Using SECURITY DEFINER function to avoid RLS recursion
CREATE POLICY "Promoters can view assigned shifts"
ON shifts FOR SELECT TO authenticated
USING (
  is_promoter_assigned_to_shift(id, auth.uid())
);

-- Also ensure companies and admins can still see their shifts
-- (These policies should already exist but let's make sure)
DROP POLICY IF EXISTS "Companies can view their own shifts" ON shifts;
CREATE POLICY "Companies can view their own shifts"
ON shifts FOR SELECT TO authenticated
USING (company_id = auth.uid());

-- Verify the function works by adding a test comment
COMMENT ON FUNCTION is_promoter_assigned_to_shift(uuid, uuid) IS
'Helper function to check if a promoter is assigned to a shift. Uses SECURITY DEFINER to bypass RLS and avoid recursion.';
