-- Allow promoters to view company profiles they have shift assignments with
CREATE POLICY "Promoters can view companies they work with"
ON public.profiles FOR SELECT
USING (
  role = 'company' 
  AND EXISTS (
    SELECT 1 FROM shift_assignments sa
    INNER JOIN shifts s ON s.id = sa.shift_id
    WHERE sa.promoter_id = auth.uid()
      AND s.company_id = profiles.id
  )
);

-- Allow companies to view promoters assigned to their shifts
CREATE POLICY "Companies can view assigned promoters"
ON public.profiles FOR SELECT  
USING (
  role = 'promoter'
  AND EXISTS (
    SELECT 1 FROM shift_assignments sa
    INNER JOIN shifts s ON s.id = sa.shift_id  
    WHERE s.company_id = auth.uid()
      AND sa.promoter_id = profiles.id
  )
);
