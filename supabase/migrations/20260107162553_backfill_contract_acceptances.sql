-- Backfill contract acceptance records for existing shift assignments
-- This migration creates contract acceptance records for shift assignments
-- that were created before the trigger was set up

-- Temporarily disable the notification trigger to avoid errors if notifications table doesn't exist
DROP TRIGGER IF EXISTS on_contract_acceptance_notify ON public.company_contract_acceptances;

DO $$
DECLARE
  v_assignment RECORD;
  v_template_id uuid;
BEGIN
  FOR v_assignment IN 
    SELECT 
      sa.id as assignment_id,
      sa.shift_id,
      sa.promoter_id,
      sa.created_at,
      s.company_id
    FROM public.shift_assignments sa
    JOIN public.shifts s ON s.id = sa.shift_id
    LEFT JOIN public.company_contract_acceptances cca ON cca.shift_assignment_id = sa.id
    WHERE 
      -- Only for assignments that don't have contract acceptances yet
      cca.id IS NULL
      -- Only if company has an active contract template
      AND s.company_id IS NOT NULL
  LOOP
    -- Get active contract template for the company
    SELECT id INTO v_template_id
    FROM public.company_contract_templates
    WHERE company_id = v_assignment.company_id
      AND is_active = true
    ORDER BY updated_at DESC
    LIMIT 1;

    -- Only create if template exists and doesn't already exist
    IF v_template_id IS NOT NULL AND NOT EXISTS (
      SELECT 1
      FROM public.company_contract_acceptances
      WHERE shift_assignment_id = v_assignment.assignment_id
    ) THEN
      INSERT INTO public.company_contract_acceptances (
        company_id,
        promoter_id,
        template_id,
        shift_id,
        shift_assignment_id,
        status,
        created_at
      )
      VALUES (
        v_assignment.company_id,
        v_assignment.promoter_id,
        v_template_id,
        v_assignment.shift_id,
        v_assignment.assignment_id,
        'pending',
        v_assignment.created_at
      );
    END IF;
  END LOOP;
END $$;

-- Re-enable the notification trigger
CREATE TRIGGER on_contract_acceptance_notify
  AFTER INSERT ON public.company_contract_acceptances
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION public.notify_contract_required();

