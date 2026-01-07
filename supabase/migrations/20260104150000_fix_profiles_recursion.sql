-- Fix infinite recursion in profiles table RLS policies

-- Drop the problematic policy that causes recursion
DROP POLICY IF EXISTS "Promoters can view companies they work with" ON profiles;

-- Create a simpler helper function that doesn't cause recursion
CREATE OR REPLACE FUNCTION get_company_ids_for_promoter(p_promoter_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT s.company_id
  FROM shift_assignments sa
  INNER JOIN shifts s ON s.id = sa.shift_id
  WHERE sa.promoter_id = p_promoter_id;
$$;

GRANT EXECUTE ON FUNCTION get_company_ids_for_promoter(uuid) TO authenticated;

-- Recreate the policy using the helper function
CREATE POLICY "Promoters can view companies they work with"
ON profiles FOR SELECT TO authenticated
USING (
  role = 'company'
  AND id IN (SELECT get_company_ids_for_promoter(auth.uid()))
);
