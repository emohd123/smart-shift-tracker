-- Add RLS policy for promoters to view company profiles for their approved assignments
CREATE POLICY "Promoters can view company profiles for their assignments" 
ON company_profiles FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM shift_assignments sa
    WHERE sa.promoter_id = auth.uid()
    AND get_shift_company_id(sa.shift_id) = company_profiles.user_id
  )
);