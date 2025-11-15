-- Add RLS policies to allow companies to manage time logs for their shift promoters

-- Policy 1: Companies can create time logs for promoters assigned to their shifts
CREATE POLICY "Companies can create time logs for shift promoters"
ON time_logs FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM shift_assignments sa
    JOIN shifts s ON s.id = sa.shift_id
    WHERE sa.promoter_id = time_logs.user_id
    AND sa.shift_id = time_logs.shift_id
    AND s.company_id = auth.uid()
  )
);

-- Policy 2: Companies can view time logs for their shifts
CREATE POLICY "Companies can view time logs for their shifts"
ON time_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM shifts
    WHERE shifts.id = time_logs.shift_id
    AND shifts.company_id = auth.uid()
  )
);

-- Policy 3: Companies can update time logs for their shifts (for check-out)
CREATE POLICY "Companies can update time logs for their shifts"
ON time_logs FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM shifts
    WHERE shifts.id = time_logs.shift_id
    AND shifts.company_id = auth.uid()
  )
);