-- Create helper function to get shift company_id without triggering RLS recursion
CREATE OR REPLACE FUNCTION get_shift_company_id(shift_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM shifts WHERE id = shift_id
$$;

-- Drop problematic shift_assignments policies that cause recursion
DROP POLICY IF EXISTS "Companies can manage assignments for their shifts" ON shift_assignments;
DROP POLICY IF EXISTS "Companies can view assignments for their shifts" ON shift_assignments;
DROP POLICY IF EXISTS "Companies can approve certificates for their shifts" ON shift_assignments;

-- Create new shift_assignments policies using helper function
CREATE POLICY "Companies can manage assignments for their shifts" 
ON shift_assignments FOR ALL TO authenticated
USING (auth.uid() = get_shift_company_id(shift_id))
WITH CHECK (auth.uid() = get_shift_company_id(shift_id));

CREATE POLICY "Companies can view assignments for their shifts" 
ON shift_assignments FOR SELECT TO authenticated
USING (auth.uid() = get_shift_company_id(shift_id));

CREATE POLICY "Companies can approve certificates for their shifts" 
ON shift_assignments FOR UPDATE TO authenticated
USING (auth.uid() = get_shift_company_id(shift_id));

-- Drop and recreate profiles policy to avoid recursion
DROP POLICY IF EXISTS "Companies can view assigned promoters only" ON profiles;

CREATE POLICY "Companies can view assigned promoters only" 
ON profiles FOR SELECT TO authenticated
USING (
  role = 'promoter' 
  AND verification_status = 'approved' 
  AND has_role(auth.uid(), 'company'::app_role) 
  AND EXISTS (
    SELECT 1 FROM shift_assignments sa
    WHERE sa.promoter_id = profiles.id 
    AND get_shift_company_id(sa.shift_id) = auth.uid()
  )
);