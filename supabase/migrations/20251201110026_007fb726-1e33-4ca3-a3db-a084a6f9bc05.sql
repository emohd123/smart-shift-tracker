-- Add RLS policy allowing promoters to view shifts via assignments
CREATE POLICY "Promoters can view shifts via assignments" 
ON shifts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM shift_assignments 
    WHERE shift_assignments.shift_id = shifts.id 
    AND shift_assignments.promoter_id = auth.uid()
  )
);