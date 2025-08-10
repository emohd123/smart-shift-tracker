-- Ensure pgcrypto is available for gen_random_bytes used by generate_unique_profile_code
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Create helper function to ensure a profile exists for the current user
CREATE OR REPLACE FUNCTION public.ensure_profile_for_current_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert a default profile if not exists
  INSERT INTO public.profiles (
    id,
    full_name,
    nationality,
    age,
    phone_number,
    gender,
    height,
    weight,
    is_student,
    address,
    role,
    verification_status
  )
  SELECT
    auth.uid(),
    'New User',
    '',
    18,
    NULL,
    'Male',
    170,
    70,
    false,
    '',
    'promoter',
    'pending'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid()
  );
END;
$$;

-- 1b) Backfill profiles for any existing users missing a profile
INSERT INTO public.profiles (
  id,
  full_name,
  nationality,
  age,
  phone_number,
  gender,
  height,
  weight,
  is_student,
  address,
  role,
  verification_status
)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', 'New User') AS full_name,
  '' AS nationality,
  18 AS age,
  NULL AS phone_number,
  'Male' AS gender,
  170 AS height,
  70 AS weight,
  false AS is_student,
  '' AS address,
  'promoter' AS role,
  'pending' AS verification_status
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- 2) Tighten RLS for subscribers table (fix overly-permissive UPDATE policy)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'subscribers' AND policyname = 'update_own_subscription'
  ) THEN
    DROP POLICY "update_own_subscription" ON public.subscribers;
  END IF;
END $$;

CREATE POLICY "update_own_subscription"
ON public.subscribers
FOR UPDATE
USING ((user_id = auth.uid()) OR (email = auth.email()))
WITH CHECK ((user_id = auth.uid()) OR (email = auth.email()));

-- 3) Add updated_at triggers for tables that have an updated_at column
DO $$
DECLARE
  t record;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'profiles',
    'shifts',
    'messages',
    'shift_applications',
    'payouts',
    'user_credits',
    'subscribers',
    'job_postings'
  ]) AS tbl LOOP
    BEGIN
      EXECUTE format('CREATE TRIGGER update_%I_updated_at
        BEFORE UPDATE ON public.%I
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();', t.tbl, t.tbl);
    EXCEPTION WHEN duplicate_object THEN
      -- Ignore if trigger already exists
      NULL;
    END;
  END LOOP;
END $$;

-- 4) Useful indexes for performance (idempotent)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON public.profiles (verification_status);
CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON public.certificates (user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON public.certificates (status);
CREATE INDEX IF NOT EXISTS idx_time_logs_user_id ON public.time_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_shift_assignments_promoter_id ON public.shift_assignments (promoter_id);
CREATE INDEX IF NOT EXISTS idx_shift_assignments_shift_id ON public.shift_assignments (shift_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON public.messages (sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_applicant ON public.job_applications (applicant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON public.user_credits (user_id);