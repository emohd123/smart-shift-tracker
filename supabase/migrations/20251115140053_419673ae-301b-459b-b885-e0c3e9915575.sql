-- Allow companies to view promoter profiles
-- Companies need to see promoters to assign them to shifts
CREATE POLICY "Companies can view promoter profiles"
ON profiles
FOR SELECT
USING (
  role = 'promoter' 
  AND verification_status = 'approved'
  AND has_role(auth.uid(), 'company')
);

-- Allow admins to view all profiles (already exists but ensuring it's there)
-- The existing "Admins can view all profiles" policy should cover this