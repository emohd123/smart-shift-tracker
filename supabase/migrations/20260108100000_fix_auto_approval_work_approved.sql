-- Fix auto-approval trigger to also set work_approved for certificate generation
-- This ensures that when a shift is completed, work_approved is set so promoters can generate certificates

CREATE OR REPLACE FUNCTION public.auto_approve_completed_shift_assignments()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_completed BOOLEAN;
  assignment_record RECORD;
BEGIN
  -- Determine if shift is now completed (either by status or override)
  IF NEW.manual_status_override = true THEN
    is_completed := (NEW.override_status = 'completed');
  ELSE
    is_completed := (NEW.status = 'completed');
  END IF;

  -- If shift is completed, auto-approve all assignments
  IF is_completed THEN
    -- Update all shift_assignments for this shift
    -- Set work_approved (required for certificate generation)
    UPDATE public.shift_assignments
    SET 
      work_approved = true,
      work_approved_at = COALESCE(work_approved_at, now()),
      work_approved_by = COALESCE(work_approved_by, NEW.company_id)
    WHERE 
      shift_id = NEW.id 
      AND (work_approved = false OR work_approved IS NULL);

    -- Create notifications for each promoter
    FOR assignment_record IN 
      SELECT promoter_id 
      FROM public.shift_assignments 
      WHERE shift_id = NEW.id
    LOOP
      INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        read
      ) VALUES (
        assignment_record.promoter_id,
        'Shift Auto-Approved for Certificate',
        'Your completed shift "' || NEW.title || '" has been automatically approved for certificate generation.',
        'certificate_approval',
        false
      )
      ON CONFLICT DO NOTHING; -- Avoid duplicate notifications
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- The trigger already exists, so we don't need to recreate it
-- But we'll ensure it's properly set up
DROP TRIGGER IF EXISTS trigger_auto_approve_completed_shifts ON public.shifts;

CREATE TRIGGER trigger_auto_approve_completed_shifts
AFTER UPDATE OF status, override_status, manual_status_override ON public.shifts
FOR EACH ROW
EXECUTE FUNCTION public.auto_approve_completed_shift_assignments();

-- Backfill: Update existing completed shifts to have work_approved set
-- This fixes shifts that were completed before this migration
UPDATE public.shift_assignments sa
SET 
  work_approved = true,
  work_approved_at = COALESCE(work_approved_at, now()),
  work_approved_by = COALESCE(work_approved_by, s.company_id)
FROM public.shifts s
WHERE sa.shift_id = s.id
  AND (s.status = 'completed' OR (s.manual_status_override = true AND s.override_status = 'completed'))
  AND (sa.work_approved = false OR sa.work_approved IS NULL);

