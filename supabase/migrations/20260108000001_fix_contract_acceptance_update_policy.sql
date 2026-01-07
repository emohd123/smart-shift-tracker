-- Fix RLS policy to allow signature_image updates
-- Note: PostgreSQL RLS policies don't support OLD/NEW comparisons in WITH CHECK clauses
-- The policy allows promoters to update their own contract acceptances
-- Application logic should ensure immutable fields (company_id, promoter_id, template_id, shift_id, shift_assignment_id) are not changed
DROP POLICY IF EXISTS "Promoters can update own contract acceptance" ON public.company_contract_acceptances;

CREATE POLICY "Promoters can update own contract acceptance"
ON public.company_contract_acceptances
FOR UPDATE
TO authenticated
USING (promoter_id = auth.uid())
WITH CHECK (promoter_id = auth.uid());

COMMENT ON POLICY "Promoters can update own contract acceptance" ON public.company_contract_acceptances IS 
'Allows promoters to update their own contract acceptances, including status, signature_text, signature_image, accepted_at, accept_user_agent, and accept_ip. The application ensures immutable fields (company_id, promoter_id, template_id, shift_id, shift_assignment_id) are not changed.';

