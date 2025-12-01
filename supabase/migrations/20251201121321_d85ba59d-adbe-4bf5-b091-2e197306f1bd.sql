-- Create function to auto-approve shift assignments when shift is completed
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
    UPDATE public.shift_assignments
    SET 
      certificate_approved = true,
      approved_at = now(),
      approved_by = NEW.company_id
    WHERE 
      shift_id = NEW.id 
      AND certificate_approved = false;

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
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on shifts table
DROP TRIGGER IF EXISTS trigger_auto_approve_completed_shifts ON public.shifts;

CREATE TRIGGER trigger_auto_approve_completed_shifts
AFTER UPDATE OF status, override_status, manual_status_override ON public.shifts
FOR EACH ROW
EXECUTE FUNCTION public.auto_approve_completed_shift_assignments();