-- Comprehensive fix for shifts table RLS policies
-- This migration ensures all user roles can access shifts appropriately

-- First, disable RLS temporarily to clean up
ALTER TABLE shifts DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on shifts to start fresh
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'shifts' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON shifts', pol.policyname);
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

-- Ensure helper function exists
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

-- 1. Companies can view their own shifts
CREATE POLICY "Companies can view own shifts"
ON shifts FOR SELECT TO authenticated
USING (company_id = auth.uid());

-- 2. Companies can create shifts
CREATE POLICY "Companies can create shifts"
ON shifts FOR INSERT TO authenticated
WITH CHECK (company_id = auth.uid());

-- 3. Companies can update their own shifts
CREATE POLICY "Companies can update own shifts"
ON shifts FOR UPDATE TO authenticated
USING (company_id = auth.uid());

-- 4. Companies can delete their own shifts
CREATE POLICY "Companies can delete own shifts"
ON shifts FOR DELETE TO authenticated
USING (company_id = auth.uid());

-- 5. Promoters can view shifts they are assigned to
CREATE POLICY "Promoters can view assigned shifts"
ON shifts FOR SELECT TO authenticated
USING (is_promoter_assigned_to_shift(id, auth.uid()));

-- Note: Admin policies will use existing has_role function if it exists
-- For now, admins can access via company_id match or direct table access
