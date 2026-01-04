-- Fix promoter access to shift details for pending assignments
-- Issue: Promoters cannot see shift details (title, date, location, etc.) in their dashboard

-- Drop existing potentially conflicting policies on shifts for promoters
DROP POLICY IF EXISTS "Promoters can view their assigned shifts" ON shifts;
DROP POLICY IF EXISTS "Promoters can view shifts via assignments" ON shifts;
DROP POLICY IF EXISTS "Promoters can view shifts they are assigned to" ON shifts;

-- Create a single consolidated policy for promoters to view shifts
-- This allows promoters to see ANY shift they have an assignment for (any status)
CREATE POLICY "Promoters can view assigned shifts"
ON shifts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM shift_assignments sa
    WHERE sa.shift_id = shifts.id
      AND sa.promoter_id = auth.uid()
  )
);

-- Also ensure promoters can read company profiles for shifts they're assigned to
DROP POLICY IF EXISTS "Promoters can view companies they work with" ON profiles;
CREATE POLICY "Promoters can view companies they work with"
ON profiles FOR SELECT
USING (
  role = 'company'
  AND EXISTS (
    SELECT 1 FROM shift_assignments sa
    INNER JOIN shifts s ON s.id = sa.shift_id
    WHERE sa.promoter_id = auth.uid()
      AND s.company_id = profiles.id
  )
);

-- Add index to improve join performance
CREATE INDEX IF NOT EXISTS idx_shifts_company_id ON shifts(company_id);
