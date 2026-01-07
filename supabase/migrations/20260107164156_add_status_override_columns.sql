-- Add manual status override columns to shifts table if they don't exist
-- These columns allow companies to manually control shift status

ALTER TABLE public.shifts 
  ADD COLUMN IF NOT EXISTS manual_status_override BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS override_status TEXT;

-- Add constraint for override_status to ensure valid values
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'shifts_override_status_check'
  ) THEN
    ALTER TABLE public.shifts
    ADD CONSTRAINT shifts_override_status_check 
    CHECK (override_status IN ('upcoming', 'ongoing', 'completed', 'cancelled') OR override_status IS NULL);
  END IF;
END $$;

-- Update the RLS policy to include WITH CHECK clause for UPDATE operations
-- This ensures companies can update all fields including manual_status_override and override_status
DROP POLICY IF EXISTS "Companies can update own shifts" ON public.shifts;

CREATE POLICY "Companies can update own shifts"
ON public.shifts FOR UPDATE
TO authenticated
USING (company_id = auth.uid())
WITH CHECK (company_id = auth.uid());

