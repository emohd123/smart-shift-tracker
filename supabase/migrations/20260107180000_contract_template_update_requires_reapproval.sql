-- Contract Template Update Requires Re-approval
-- When a contract template is updated, all existing acceptances are marked as superseded
-- and new pending acceptances are created for all active shift assignments

-- Step 1: Add superseded_at column to track when acceptances are superseded
ALTER TABLE public.company_contract_acceptances
  ADD COLUMN IF NOT EXISTS superseded_at timestamptz;

-- Step 2: Create function to handle contract template updates
CREATE OR REPLACE FUNCTION public.handle_contract_template_update()
RETURNS TRIGGER AS $$
DECLARE
  v_assignment RECORD;
  v_old_template_id uuid;
BEGIN
  -- Only process if this is an update (not insert) and template content changed
  IF TG_OP != 'UPDATE' THEN
    RETURN NEW;
  END IF;

  -- Check if title or body changed (version increment alone doesn't require re-approval)
  IF OLD.title = NEW.title AND OLD.body_markdown = NEW.body_markdown THEN
    RETURN NEW;
  END IF;

  -- Only process if template is active
  IF NOT NEW.is_active THEN
    RETURN NEW;
  END IF;

  -- Mark all existing acceptances for this template as superseded
  UPDATE public.company_contract_acceptances
  SET superseded_at = NOW()
  WHERE template_id = NEW.id
    AND status = 'accepted'
    AND superseded_at IS NULL;

  -- Create new pending acceptances for all active shift assignments
  -- that have accepted contracts for this template
  FOR v_assignment IN
    SELECT DISTINCT
      sa.id as assignment_id,
      sa.shift_id,
      sa.promoter_id,
      sa.created_at
    FROM public.shift_assignments sa
    INNER JOIN public.shifts s ON s.id = sa.shift_id
    INNER JOIN public.company_contract_acceptances cca ON 
      cca.shift_assignment_id = sa.id
      AND cca.template_id = NEW.id
      AND cca.company_id = NEW.company_id
    WHERE s.company_id = NEW.company_id
      -- Only for shifts that haven't started or are ongoing
      AND (s.status IN ('upcoming', 'ongoing') OR s.date >= CURRENT_DATE)
      -- Only if there's no existing pending acceptance for this assignment
      AND NOT EXISTS (
        SELECT 1
        FROM public.company_contract_acceptances cca2
        WHERE cca2.shift_assignment_id = sa.id
          AND cca2.status = 'pending'
          AND cca2.superseded_at IS NULL
      )
  LOOP
    -- Create new pending acceptance
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
      NEW.company_id,
      v_assignment.promoter_id,
      NEW.id,
      v_assignment.shift_id,
      v_assignment.assignment_id,
      'pending',
      NOW()
    )
    ON CONFLICT (shift_assignment_id) 
    WHERE shift_assignment_id IS NOT NULL
    DO NOTHING; -- Avoid duplicates if trigger runs multiple times
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create trigger to handle contract template updates
DROP TRIGGER IF EXISTS on_contract_template_update_require_reapproval ON public.company_contract_templates;
CREATE TRIGGER on_contract_template_update_require_reapproval
  AFTER UPDATE ON public.company_contract_templates
  FOR EACH ROW
  WHEN (
    -- Only trigger if title or body changed
    (OLD.title IS DISTINCT FROM NEW.title OR OLD.body_markdown IS DISTINCT FROM NEW.body_markdown)
    AND NEW.is_active = true
  )
  EXECUTE FUNCTION public.handle_contract_template_update();

-- Step 4: Update the contract acceptance check to exclude superseded acceptances
-- This is handled in the application code, but we add a comment here for clarity
COMMENT ON COLUMN public.company_contract_acceptances.superseded_at IS 
  'Timestamp when this acceptance was superseded by a new contract version. Superseded acceptances should not be considered valid for check-in.';

