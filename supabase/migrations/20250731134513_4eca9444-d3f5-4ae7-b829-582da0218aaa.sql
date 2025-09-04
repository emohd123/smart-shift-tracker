-- Fix security issues from linter

-- Fix functions by adding search_path
DROP FUNCTION IF EXISTS public.auto_approve_shift_application() CASCADE;
DROP FUNCTION IF EXISTS public.notify_shift_application() CASCADE;

-- Recreate functions with proper search_path
CREATE OR REPLACE FUNCTION public.auto_approve_shift_application()
RETURNS TRIGGER 
SECURITY DEFINER 
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  -- Only auto-approve if shift has space and is not urgent
  IF EXISTS (
    SELECT 1 FROM public.shifts 
    WHERE id = NEW.shift_id 
    AND max_promoters > (
      SELECT COUNT(*) FROM public.shift_applications 
      WHERE shift_id = NEW.shift_id AND status = 'approved'
    )
  ) THEN
    -- Update the shift_assignments table
    INSERT INTO public.shift_assignments (shift_id, promoter_id)
    VALUES (NEW.shift_id, NEW.promoter_id)
    ON CONFLICT (shift_id, promoter_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_shift_application()
RETURNS TRIGGER 
SECURITY DEFINER 
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  -- Insert notification for admins when new application is created
  INSERT INTO public.notifications (user_id, title, message, type, related_id)
  SELECT 
    p.id,
    'New Shift Application',
    'A promoter has applied for shift: ' || s.title,
    'shift_application',
    NEW.id::text
  FROM public.profiles p, public.shifts s
  WHERE p.role = 'admin' AND s.id = NEW.shift_id;
  
  RETURN NEW;
END;
$$;

-- Recreate triggers
CREATE TRIGGER on_application_approved
AFTER UPDATE OF status ON public.shift_applications
FOR EACH ROW
WHEN (NEW.status = 'approved' AND OLD.status != 'approved')
EXECUTE FUNCTION public.auto_approve_shift_application();

CREATE TRIGGER on_new_shift_application
AFTER INSERT ON public.shift_applications
FOR EACH ROW
EXECUTE FUNCTION public.notify_shift_application();

-- Drop and recreate the view without SECURITY DEFINER (views can't have this)
DROP VIEW IF EXISTS public.shifts_with_stats;

CREATE VIEW public.shifts_with_stats AS
SELECT 
  s.*,
  COALESCE(app_stats.total_applications, 0) as total_applications,
  COALESCE(app_stats.approved_applications, 0) as approved_applications,
  COALESCE(app_stats.pending_applications, 0) as pending_applications,
  CASE 
    WHEN s.max_promoters > 0 AND COALESCE(app_stats.approved_applications, 0) >= s.max_promoters 
    THEN true 
    ELSE false 
  END as is_full
FROM public.shifts s
LEFT JOIN (
  SELECT 
    shift_id,
    COUNT(*) as total_applications,
    COUNT(*) FILTER (WHERE status = 'approved') as approved_applications,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_applications
  FROM public.shift_applications
  GROUP BY shift_id
) app_stats ON s.id = app_stats.shift_id;

-- Grant access to the view
GRANT SELECT ON public.shifts_with_stats TO authenticated;