-- ==========================================
-- CRITICAL SECURITY FIXES
-- ==========================================

-- 1. FIX PROMOTER PROFILE ACCESS (Companies should only see assigned promoters)
DROP POLICY IF EXISTS "Companies can view promoter profiles" ON public.profiles;
DROP POLICY IF EXISTS "Companies can view assigned promoters only" ON public.profiles;

CREATE POLICY "Companies can view assigned promoters only"
ON public.profiles
FOR SELECT
USING (
  role = 'promoter'::text 
  AND verification_status = 'approved'::text 
  AND has_role(auth.uid(), 'company'::app_role)
  AND EXISTS (
    SELECT 1 
    FROM shift_assignments sa
    JOIN shifts s ON s.id = sa.shift_id
    WHERE sa.promoter_id = profiles.id
    AND s.company_id = auth.uid()
  )
);

-- 2. SECURE CERTIFICATE VERIFICATION FUNCTION
CREATE OR REPLACE FUNCTION public.verify_certificate_by_reference(ref_number text)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  certificate_type text,
  issue_date date,
  total_hours numeric,
  reference_number text,
  status text,
  position_title text,
  time_period text,
  promotion_names text[],
  skills_gained text[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    user_id,
    certificate_type,
    issue_date,
    total_hours,
    reference_number,
    status,
    position_title,
    time_period,
    promotion_names,
    skills_gained
  FROM public.certificates
  WHERE reference_number = ref_number
  AND status = 'approved';
$$;

-- Drop overly permissive certificate policy
DROP POLICY IF EXISTS "Anyone can verify certificates by reference number" ON public.certificates;

-- 3. RESTRICT PAYMENT MANAGEMENT TO SERVICE ROLE
DROP POLICY IF EXISTS "System can create payments" ON public.certificate_payments;
DROP POLICY IF EXISTS "System can update payments" ON public.certificate_payments;
DROP POLICY IF EXISTS "Service role can manage payments" ON public.certificate_payments;

CREATE POLICY "Service role can manage payments"
ON public.certificate_payments
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Keep user policies for viewing/creating their own payments
-- (These already exist and are correct)

-- ==========================================
-- PERFORMANCE OPTIMIZATION INDEXES
-- ==========================================

-- Shifts indexes
CREATE INDEX IF NOT EXISTS idx_shifts_company_id ON public.shifts(company_id);
CREATE INDEX IF NOT EXISTS idx_shifts_date ON public.shifts(date);
CREATE INDEX IF NOT EXISTS idx_shifts_status ON public.shifts(status);
CREATE INDEX IF NOT EXISTS idx_shifts_company_date ON public.shifts(company_id, date);

-- Shift assignments indexes
CREATE INDEX IF NOT EXISTS idx_shift_assignments_shift_id ON public.shift_assignments(shift_id);
CREATE INDEX IF NOT EXISTS idx_shift_assignments_promoter_id ON public.shift_assignments(promoter_id);
CREATE INDEX IF NOT EXISTS idx_shift_assignments_status ON public.shift_assignments(status);

-- Time logs indexes
CREATE INDEX IF NOT EXISTS idx_time_logs_user_id ON public.time_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_shift_id ON public.time_logs(shift_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_check_in_time ON public.time_logs(check_in_time);

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON public.profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_profiles_unique_code ON public.profiles(unique_code);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Certificates indexes
CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON public.certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_reference_number ON public.certificates(reference_number);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON public.certificates(status);

-- Messages indexes (for performance)
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- User roles indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);