-- Fix Critical Security Issue #1: Restrict company access to promoter profiles
-- Drop overly permissive policy
DROP POLICY IF EXISTS "Companies can view promoter profiles" ON public.profiles;

-- Create restrictive policy: companies can only view promoters assigned to their shifts
CREATE POLICY "Companies can view assigned promoters only"
ON public.profiles
FOR SELECT
TO authenticated
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

-- Fix Critical Security Issue #2: Create secure certificate verification function
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

-- Fix Critical Security Issue #3: Restrict payment policies
-- Drop overly permissive payment policies
DROP POLICY IF EXISTS "System can create payments" ON public.certificate_payments;
DROP POLICY IF EXISTS "System can update payments" ON public.certificate_payments;

-- Create service-role only policy for payments
CREATE POLICY "Service role can manage payments"
ON public.certificate_payments
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow authenticated users to create their own payment records (needed for checkout)
CREATE POLICY "Users can create their own payments"
ON public.certificate_payments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Performance Optimization: Add database indexes
-- Indexes for shifts table
CREATE INDEX IF NOT EXISTS idx_shifts_company_id ON public.shifts(company_id);
CREATE INDEX IF NOT EXISTS idx_shifts_date ON public.shifts(date);
CREATE INDEX IF NOT EXISTS idx_shifts_status ON public.shifts(status);
CREATE INDEX IF NOT EXISTS idx_shifts_company_date ON public.shifts(company_id, date);
CREATE INDEX IF NOT EXISTS idx_shifts_promoter_id ON public.shifts(promoter_id);

-- Indexes for shift_assignments table
CREATE INDEX IF NOT EXISTS idx_shift_assignments_shift_id ON public.shift_assignments(shift_id);
CREATE INDEX IF NOT EXISTS idx_shift_assignments_promoter_id ON public.shift_assignments(promoter_id);
CREATE INDEX IF NOT EXISTS idx_shift_assignments_status ON public.shift_assignments(status);

-- Indexes for time_logs table
CREATE INDEX IF NOT EXISTS idx_time_logs_user_id ON public.time_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_shift_id ON public.time_logs(shift_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_check_in_time ON public.time_logs(check_in_time);

-- Indexes for profiles table
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON public.profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_profiles_unique_code ON public.profiles(unique_code);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Indexes for certificates table
CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON public.certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_reference_number ON public.certificates(reference_number);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON public.certificates(status);

-- Indexes for messages table
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_read ON public.messages(read);

-- Indexes for user_roles table
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);