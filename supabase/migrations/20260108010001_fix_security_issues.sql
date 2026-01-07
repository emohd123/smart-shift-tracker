-- Migration: Fix security issues
-- 1. Remove SECURITY DEFINER from shifts_with_stats view
-- 2. Add SET search_path = '' to all functions with mutable search_path

-- =============================================
-- 1. FIX SHIFTS_WITH_STATS VIEW
-- =============================================
-- Drop and recreate the view without SECURITY DEFINER
-- Views don't have SECURITY DEFINER by default, but this view was somehow created with it

DROP VIEW IF EXISTS public.shifts_with_stats;

CREATE VIEW public.shifts_with_stats AS
SELECT 
  s.id,
  s.title,
  s.description,
  s.location,
  s.latitude,
  s.longitude,
  s.date,
  s.end_date,
  s.start_time,
  s.end_time,
  s.pay_rate,
  s.pay_rate_type,
  s.payment_date,
  s.custom_contract_terms,
  s.company_id,
  s.promoter_id,
  s.status,
  s.created_at,
  s.updated_at,
  s.requirements,
  s.max_promoters,
  s.application_deadline,
  s.is_urgent,
  s.contact_person,
  s.contact_phone,
  s.contact_email,
  COALESCE(app_stats.total_applications, 0::bigint) AS total_applications,
  COALESCE(app_stats.approved_applications, 0::bigint) AS approved_applications,
  COALESCE(app_stats.pending_applications, 0::bigint) AS pending_applications,
  CASE
    WHEN s.max_promoters > 0 AND COALESCE(app_stats.approved_applications, 0::bigint) >= s.max_promoters THEN true
    ELSE false
  END AS is_full
FROM shifts s
LEFT JOIN (
  SELECT 
    shift_applications.shift_id,
    count(*) AS total_applications,
    count(*) FILTER (WHERE shift_applications.status = 'approved') AS approved_applications,
    count(*) FILTER (WHERE shift_applications.status = 'pending') AS pending_applications
  FROM shift_applications
  GROUP BY shift_applications.shift_id
) app_stats ON s.id = app_stats.shift_id;

-- Grant access to the view (inherits from underlying tables' RLS)
GRANT SELECT ON public.shifts_with_stats TO authenticated;

COMMENT ON VIEW public.shifts_with_stats IS 'Shifts with application statistics - No SECURITY DEFINER, uses underlying table RLS';

-- =============================================
-- 2. FIX FUNCTIONS WITH MUTABLE SEARCH_PATH
-- =============================================

-- 2.1 Fix prevent_role_escalation
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  user_is_admin BOOLEAN;
BEGIN
  -- Check if the user making the change is an admin
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  ) INTO user_is_admin;

  -- If not admin and role is being changed, prevent it
  IF NOT user_is_admin AND OLD.role IS DISTINCT FROM NEW.role THEN
    RAISE EXCEPTION 'Only administrators can change user roles';
  END IF;

  RETURN NEW;
END;
$function$;

-- 2.2 Fix audit_role_changes
CREATE OR REPLACE FUNCTION public.audit_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Log role changes (you can add proper audit logging later)
  RAISE NOTICE 'Role changed for user %: % -> %', NEW.id, OLD.role, NEW.role;
  RETURN NEW;
END;
$function$;

-- 2.3 Fix notify_contract_required
CREATE OR REPLACE FUNCTION public.notify_contract_required()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_shift_title text;
  v_shift_date date;
  v_notification_message text;
BEGIN
  -- Only send notification for pending contracts
  IF NEW.status != 'pending' THEN
    RETURN NEW;
  END IF;

  -- Get shift details for the notification message
  SELECT s.title, s.date INTO v_shift_title, v_shift_date
  FROM public.shifts s
  WHERE s.id = NEW.shift_id;

  v_notification_message := COALESCE(
    'Please review and approve the contract before starting shift: ' || v_shift_title,
    'Contract approval required for assigned shift'
  );

  -- Only create notification if notifications table exists
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'notifications'
  ) THEN
    -- Check if notification already exists to avoid duplicates
    IF NOT EXISTS (
      SELECT 1
      FROM public.notifications
      WHERE user_id = NEW.promoter_id
        AND type = 'contract_required'
        AND related_id = NEW.id::text
        AND created_at > NOW() - INTERVAL '1 hour'
    ) THEN
      INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        related_id,
        read,
        created_at
      )
      VALUES (
        NEW.promoter_id,
        'Contract Approval Required',
        v_notification_message,
        'contract_required',
        NEW.id::text,
        false,
        NOW()
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- 2.4 Fix handle_contract_template_update
CREATE OR REPLACE FUNCTION public.handle_contract_template_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
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
$function$;

-- 2.5 Fix update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- 2.6 Fix handle_shift_contract_template_update
CREATE OR REPLACE FUNCTION public.handle_shift_contract_template_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_assignment RECORD;
BEGIN
  -- Only process if this is an update (not insert) and template content changed
  IF TG_OP != 'UPDATE' THEN
    RETURN NEW;
  END IF;

  -- Check if title or body changed
  IF OLD.title = NEW.title AND OLD.body_markdown = NEW.body_markdown THEN
    RETURN NEW;
  END IF;

  -- Mark all existing acceptances for this shift as superseded
  UPDATE public.company_contract_acceptances
  SET superseded_at = NOW()
  WHERE shift_id = NEW.shift_id
    AND status = 'accepted'
    AND superseded_at IS NULL;

  -- Create new pending acceptances for all active shift assignments
  FOR v_assignment IN
    SELECT DISTINCT
      sa.id as assignment_id,
      sa.shift_id,
      sa.promoter_id,
      sa.created_at
    FROM public.shift_assignments sa
    WHERE sa.shift_id = NEW.shift_id
      -- Only if there's no existing pending acceptance for this assignment
      AND NOT EXISTS (
        SELECT 1
        FROM public.company_contract_acceptances cca2
        WHERE cca2.shift_assignment_id = sa.id
          AND cca2.status = 'pending'
          AND cca2.superseded_at IS NULL
      )
  LOOP
    -- Create new pending acceptance with shift-specific template
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
      NULL, -- Shift-specific contracts don't use company template_id
      v_assignment.shift_id,
      v_assignment.assignment_id,
      'pending',
      NOW()
    )
    ON CONFLICT (shift_assignment_id) 
    WHERE shift_assignment_id IS NOT NULL
    DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$function$;

-- 2.7 Fix handle_shift_contract_template_create
CREATE OR REPLACE FUNCTION public.handle_shift_contract_template_create()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_assignment RECORD;
BEGIN
  -- Create pending acceptances for all existing shift assignments
  FOR v_assignment IN
    SELECT DISTINCT
      sa.id as assignment_id,
      sa.shift_id,
      sa.promoter_id,
      sa.created_at
    FROM public.shift_assignments sa
    WHERE sa.shift_id = NEW.shift_id
      -- Only if there's no existing pending acceptance for this assignment
      AND NOT EXISTS (
        SELECT 1
        FROM public.company_contract_acceptances cca2
        WHERE cca2.shift_assignment_id = sa.id
          AND cca2.status = 'pending'
          AND cca2.superseded_at IS NULL
      )
  LOOP
    -- Create new pending acceptance with shift-specific template
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
      NULL, -- Shift-specific contracts don't use company template_id
      v_assignment.shift_id,
      v_assignment.assignment_id,
      'pending',
      NOW()
    )
    ON CONFLICT (shift_assignment_id) 
    WHERE shift_assignment_id IS NOT NULL
    DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public.prevent_role_escalation IS 'Prevents non-admin users from changing roles - search_path secured';
COMMENT ON FUNCTION public.audit_role_changes IS 'Logs role changes - search_path secured';
COMMENT ON FUNCTION public.notify_contract_required IS 'Sends notification when contract approval is needed - search_path secured';
COMMENT ON FUNCTION public.handle_contract_template_update IS 'Handles contract template updates and triggers re-approval - search_path secured';
COMMENT ON FUNCTION public.update_updated_at_column IS 'Updates updated_at timestamp on row update - search_path secured';
COMMENT ON FUNCTION public.handle_shift_contract_template_update IS 'Handles shift contract template updates - search_path secured';
COMMENT ON FUNCTION public.handle_shift_contract_template_create IS 'Handles shift contract template creation - search_path secured';

