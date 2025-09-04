-- 0) Update prevent_role_escalation to allow privileged system roles to change roles
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Only allow role changes by admins or system roles
  IF OLD.role != NEW.role AND NOT (is_admin() OR current_user IN ('postgres', 'supabase_admin')) THEN
    RAISE EXCEPTION 'Only administrators can change user roles';
  END IF;
  
  -- Log role changes for security monitoring
  IF OLD.role != NEW.role THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      NEW.id,
      'Role Changed',
      'Your role has been changed from ' || OLD.role || ' to ' || NEW.role,
      'security_audit'
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 1) Add employer ownership to shifts (idempotent)
ALTER TABLE public.shifts
ADD COLUMN IF NOT EXISTS employer_id uuid;

CREATE INDEX IF NOT EXISTS idx_shifts_employer_id ON public.shifts (employer_id);

-- 2) Helper functions (idempotent)
CREATE OR REPLACE FUNCTION public.is_company()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'company'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_shift_owner(_shift_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.shifts 
    WHERE id = _shift_id AND employer_id = auth.uid()
  );
$$;

-- 3) RLS policies for company-managed shifts (idempotent)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'shifts' AND policyname = 'Companies can insert shifts'
  ) THEN
    DROP POLICY "Companies can insert shifts" ON public.shifts;
  END IF;
END $$;

CREATE POLICY "Companies can insert shifts"
ON public.shifts
FOR INSERT
TO authenticated
WITH CHECK (public.is_company() AND employer_id = auth.uid());

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'shifts' AND policyname = 'Companies can update own shifts'
  ) THEN
    DROP POLICY "Companies can update own shifts" ON public.shifts;
  END IF;
END $$;

CREATE POLICY "Companies can update own shifts"
ON public.shifts
FOR UPDATE
TO authenticated
USING (public.is_company() AND employer_id = auth.uid())
WITH CHECK (public.is_company() AND employer_id = auth.uid());

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'shifts' AND policyname = 'Companies can delete own shifts'
  ) THEN
    DROP POLICY "Companies can delete own shifts" ON public.shifts;
  END IF;
END $$;

CREATE POLICY "Companies can delete own shifts"
ON public.shifts
FOR DELETE
TO authenticated
USING (public.is_company() AND employer_id = auth.uid());

-- 4) Allow companies to manage shift assignments for their own shifts (idempotent)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'shift_assignments' AND policyname = 'Companies can manage assignments for own shifts'
  ) THEN
    DROP POLICY "Companies can manage assignments for own shifts" ON public.shift_assignments;
  END IF;
END $$;

CREATE POLICY "Companies can manage assignments for own shifts"
ON public.shift_assignments
FOR ALL
TO authenticated
USING (public.is_shift_owner(shift_id))
WITH CHECK (public.is_shift_owner(shift_id));

-- 5) Promote the specified email to admin (ensure profile exists then update role)
INSERT INTO public.profiles (
  id, full_name, nationality, age, phone_number, gender, height, weight, is_student, address, role, verification_status
)
SELECT u.id, COALESCE(u.raw_user_meta_data->>'full_name', 'New User'), '', 18, NULL, 'Male', 170, 70, false, '', 'admin', 'approved'
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE lower(u.email) = 'emohd123@gmail.com' AND p.id IS NULL;

UPDATE public.profiles p
SET role = 'admin', verification_status = 'approved'
FROM auth.users u
WHERE p.id = u.id AND lower(u.email) = 'emohd123@gmail.com';