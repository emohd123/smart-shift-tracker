-- Migration: Enhanced promoter assignment and contract/payment gating
-- Date: 2026-01-03
-- Purpose: Allow companies to browse promoters, enforce contract acceptance, and gate payments

-- 1. RPC function to list eligible promoters for companies
CREATE OR REPLACE FUNCTION public.list_eligible_promoters()
RETURNS TABLE (
  id uuid,
  full_name text,
  email text,
  phone_number text,
  nationality text,
  age integer,
  gender text,
  profile_photo_url text,
  verification_status text,
  unique_code text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.full_name,
    p.email,
    p.phone_number,
    p.nationality,
    p.age,
    p.gender,
    p.profile_photo_url,
    p.verification_status,
    p.unique_code
  FROM profiles p
  WHERE p.role = 'promoter'
    AND p.verification_status = 'approved'
  ORDER BY p.full_name;
$$;

-- Grant execute to authenticated users (companies will call this)
GRANT EXECUTE ON FUNCTION public.list_eligible_promoters() TO authenticated;

-- 2. Add payment amount and auditing fields to shift_assignment_payment_status
ALTER TABLE IF EXISTS shift_assignment_payment_status
  ADD COLUMN IF NOT EXISTS amount numeric,
  ADD COLUMN IF NOT EXISTS scheduled_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS paid_by uuid REFERENCES auth.users(id);

-- 3. Add helper function to check if contract is accepted for a shift assignment
CREATE OR REPLACE FUNCTION public.has_contract_acceptance(
  _promoter_id uuid,
  _company_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM company_contract_acceptances
    WHERE promoter_id = _promoter_id
      AND company_id = _company_id
      AND accepted_at IS NOT NULL
  );
$$;

GRANT EXECUTE ON FUNCTION public.has_contract_acceptance(uuid, uuid) TO authenticated;

-- 4. Add helper function to check if company has active contract template
CREATE OR REPLACE FUNCTION public.has_active_contract_template(_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM company_contract_templates
    WHERE company_id = _company_id
      AND is_active = true
  );
$$;

GRANT EXECUTE ON FUNCTION public.has_active_contract_template(uuid) TO authenticated;

-- 5. Update RLS for shift_assignments to allow promoters to see their assignments
DROP POLICY IF EXISTS "Promoters can view their own assignments" ON shift_assignments;

CREATE POLICY "Promoters can view their own assignments"
ON shift_assignments FOR SELECT
USING (
  auth.uid() = promoter_id
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'super_admin')
);

-- 6. Add policy to allow promoters to read shifts they're assigned to
DROP POLICY IF EXISTS "Promoters can view shifts they are assigned to" ON shifts;

CREATE POLICY "Promoters can view shifts they are assigned to"
ON shifts FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM shift_assignments sa
    WHERE sa.shift_id = shifts.id
      AND sa.promoter_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'super_admin')
  OR company_id = auth.uid()
);

-- 7. Add index for faster assignment lookups
CREATE INDEX IF NOT EXISTS idx_shift_assignments_promoter_shift 
ON shift_assignments(promoter_id, shift_id);

-- 8. Add comments for documentation
COMMENT ON FUNCTION public.list_eligible_promoters() IS 
'Returns list of approved promoters available for shift assignment. Used by companies to browse and select promoters.';

COMMENT ON FUNCTION public.has_contract_acceptance(uuid, uuid) IS 
'Checks if a promoter has accepted the contract for a given company. Used to enforce contract acceptance before work begins.';

COMMENT ON FUNCTION public.has_active_contract_template(uuid) IS 
'Checks if a company has an active contract template. Used to determine if contract acceptance is required.';
