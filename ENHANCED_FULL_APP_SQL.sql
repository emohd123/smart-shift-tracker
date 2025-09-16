-- ================================================================
-- ENHANCED FULL APP SQL - COMPREHENSIVE DATABASE IMPROVEMENTS
-- ================================================================
-- This SQL enhances the entire Smart Shift Tracker application
-- Run this in Supabase Dashboard → SQL Editor

-- ================================================================
-- 1. PROFILES TABLE ENHANCEMENTS
-- ================================================================

-- Add missing columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS unique_code TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS age INTEGER DEFAULT 25;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nationality TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS skills TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS availability_hours JSONB DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_locations TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS documents_verified BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS contract_signed BOOLEAN DEFAULT false;

-- Create unique index on unique_code
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_unique_code
ON public.profiles(unique_code) WHERE unique_code IS NOT NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON public.profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON public.profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- ================================================================
-- 2. SHIFTS TABLE ENHANCEMENTS
-- ================================================================

-- Ensure shifts table has all necessary columns
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS shift_code TEXT;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS client_contact TEXT;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS special_requirements TEXT[];
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS dress_code TEXT;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS equipment_provided TEXT[];
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS break_duration INTEGER DEFAULT 30;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS overtime_rate DECIMAL(10,2);
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS transportation_provided BOOLEAN DEFAULT false;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS meal_provided BOOLEAN DEFAULT false;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS weather_dependent BOOLEAN DEFAULT false;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS minimum_age INTEGER;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS maximum_participants INTEGER;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS current_participants INTEGER DEFAULT 0;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS priority_level TEXT DEFAULT 'normal';
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS auto_approval BOOLEAN DEFAULT false;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS feedback_collected BOOLEAN DEFAULT false;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS shift_rating DECIMAL(3,2);

-- Create indexes for shifts
CREATE INDEX IF NOT EXISTS idx_shifts_tenant_id ON public.shifts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_shifts_status ON public.shifts(status);
CREATE INDEX IF NOT EXISTS idx_shifts_date ON public.shifts(date);
CREATE INDEX IF NOT EXISTS idx_shifts_location ON public.shifts(location);
CREATE INDEX IF NOT EXISTS idx_shifts_priority ON public.shifts(priority_level);
CREATE INDEX IF NOT EXISTS idx_shifts_code ON public.shifts(shift_code);

-- ================================================================
-- 3. SHIFT ASSIGNMENTS TABLE ENHANCEMENTS
-- ================================================================

-- Create enhanced shift_assignments table if not exists
CREATE TABLE IF NOT EXISTS public.shift_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  shift_id UUID REFERENCES public.shifts(id) ON DELETE CASCADE,
  promoter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES public.profiles(id),
  status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'accepted', 'rejected', 'completed', 'cancelled')),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  actual_hours_worked DECIMAL(5,2),
  promoter_notes TEXT,
  supervisor_notes TEXT,
  performance_rating INTEGER CHECK (performance_rating >= 1 AND performance_rating <= 5),
  bonus_earned DECIMAL(10,2) DEFAULT 0,
  penalties_applied DECIMAL(10,2) DEFAULT 0,
  final_payment DECIMAL(10,2),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'approved', 'paid', 'disputed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for shift_assignments
CREATE INDEX IF NOT EXISTS idx_shift_assignments_tenant_id ON public.shift_assignments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_shift_assignments_shift_id ON public.shift_assignments(shift_id);
CREATE INDEX IF NOT EXISTS idx_shift_assignments_promoter_id ON public.shift_assignments(promoter_id);
CREATE INDEX IF NOT EXISTS idx_shift_assignments_status ON public.shift_assignments(status);
CREATE INDEX IF NOT EXISTS idx_shift_assignments_payment_status ON public.shift_assignments(payment_status);

-- ================================================================
-- 4. TIME TRACKING TABLE ENHANCEMENTS
-- ================================================================

-- Create enhanced time_logs table
CREATE TABLE IF NOT EXISTS public.time_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  shift_assignment_id UUID REFERENCES public.shift_assignments(id) ON DELETE CASCADE,
  promoter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  shift_id UUID REFERENCES public.shifts(id) ON DELETE CASCADE,
  log_type TEXT NOT NULL CHECK (log_type IN ('check_in', 'check_out', 'break_start', 'break_end')),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  location_address TEXT,
  gps_accuracy DECIMAL(8, 2),
  device_info JSONB,
  photo_url TEXT,
  notes TEXT,
  supervisor_approved BOOLEAN DEFAULT false,
  anomaly_detected BOOLEAN DEFAULT false,
  anomaly_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for time_logs
CREATE INDEX IF NOT EXISTS idx_time_logs_tenant_id ON public.time_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_promoter_id ON public.time_logs(promoter_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_shift_id ON public.time_logs(shift_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_timestamp ON public.time_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_time_logs_type ON public.time_logs(log_type);

-- ================================================================
-- 5. CERTIFICATES TABLE ENHANCEMENTS
-- ================================================================

-- Create enhanced certificates table
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  promoter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  certificate_number TEXT UNIQUE NOT NULL,
  certificate_type TEXT DEFAULT 'work_experience' CHECK (certificate_type IN ('work_experience', 'skill_validation', 'achievement', 'completion')),
  title TEXT NOT NULL,
  description TEXT,
  issued_date DATE DEFAULT CURRENT_DATE,
  valid_until DATE,
  issuer_name TEXT,
  issuer_signature TEXT,
  verification_code TEXT UNIQUE,
  qr_code_url TEXT,
  pdf_url TEXT,
  blockchain_hash TEXT,
  skills_verified TEXT[],
  hours_completed INTEGER DEFAULT 0,
  shifts_completed INTEGER DEFAULT 0,
  performance_score DECIMAL(3,2),
  metadata JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for certificates
CREATE INDEX IF NOT EXISTS idx_certificates_tenant_id ON public.certificates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_certificates_promoter_id ON public.certificates(promoter_id);
CREATE INDEX IF NOT EXISTS idx_certificates_number ON public.certificates(certificate_number);
CREATE INDEX IF NOT EXISTS idx_certificates_verification_code ON public.certificates(verification_code);
CREATE INDEX IF NOT EXISTS idx_certificates_type ON public.certificates(certificate_type);
CREATE INDEX IF NOT EXISTS idx_certificates_issued_date ON public.certificates(issued_date);

-- ================================================================
-- 6. PAYMENT TRACKING TABLE
-- ================================================================

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  promoter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  shift_assignment_id UUID REFERENCES public.shift_assignments(id),
  certificate_id UUID REFERENCES public.certificates(id),
  payment_type TEXT NOT NULL CHECK (payment_type IN ('shift_payment', 'certificate_fee', 'bonus', 'penalty', 'refund')),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')),
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  payment_method TEXT,
  processed_at TIMESTAMPTZ,
  failure_reason TEXT,
  refund_amount DECIMAL(10,2) DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for payments
CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON public.payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_promoter_id ON public.payments(promoter_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_type ON public.payments(payment_type);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_intent ON public.payments(stripe_payment_intent_id);

-- ================================================================
-- 7. NOTIFICATIONS TABLE
-- ================================================================

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'reminder')),
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'shift', 'payment', 'certificate', 'system')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  read_at TIMESTAMPTZ,
  action_url TEXT,
  action_label TEXT,
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id ON public.notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON public.notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- ================================================================
-- 8. AUDIT LOGS TABLE
-- ================================================================

-- Create audit_logs table for compliance and tracking
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON public.audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- ================================================================
-- 9. FUNCTIONS FOR UNIQUE CODE GENERATION
-- ================================================================

-- Enhanced function to generate unique codes
CREATE OR REPLACE FUNCTION public.generate_unique_code(prefix TEXT DEFAULT 'USR')
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
  attempt_count INTEGER := 0;
  max_attempts INTEGER := 100;
BEGIN
  LOOP
    -- Generate random alphanumeric code
    new_code := prefix || upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 5));
    
    -- Check if code already exists in any relevant table
    SELECT EXISTS(
      SELECT 1 FROM public.profiles WHERE unique_code = new_code
      UNION
      SELECT 1 FROM public.shifts WHERE shift_code = new_code
      UNION  
      SELECT 1 FROM public.certificates WHERE certificate_number = new_code
    ) INTO code_exists;
    
    -- Increment attempt counter
    attempt_count := attempt_count + 1;
    
    -- Exit loop if code is unique or max attempts reached
    IF NOT code_exists OR attempt_count >= max_attempts THEN
      EXIT;
    END IF;
  END LOOP;
  
  -- If we couldn't generate a unique code, add timestamp
  IF code_exists THEN
    new_code := new_code || to_char(NOW(), 'YYYYMMDDHH24MISS');
  END IF;
  
  RETURN new_code;
END;
$$;

-- Function to generate certificate numbers
CREATE OR REPLACE FUNCTION public.generate_certificate_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN 'CERT-' || to_char(NOW(), 'YYYY') || '-' || generate_unique_code('');
END;
$$;

-- Function to generate verification codes
CREATE OR REPLACE FUNCTION public.generate_verification_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
END;
$$;

-- ================================================================
-- 10. TRIGGERS FOR AUTO-GENERATION
-- ================================================================

-- Enhanced trigger function for profiles
CREATE OR REPLACE FUNCTION public.ensure_profile_defaults()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Generate unique code if not provided
  IF NEW.unique_code IS NULL THEN
    NEW.unique_code := generate_unique_code('USR');
  END IF;
  
  -- Set updated_at timestamp
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$$;

-- Trigger for profiles
DROP TRIGGER IF EXISTS trigger_profile_defaults ON public.profiles;
CREATE TRIGGER trigger_profile_defaults
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_profile_defaults();

-- Trigger function for shifts
CREATE OR REPLACE FUNCTION public.ensure_shift_defaults()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Generate shift code if not provided
  IF NEW.shift_code IS NULL THEN
    NEW.shift_code := generate_unique_code('SHF');
  END IF;
  
  -- Set updated_at timestamp
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$$;

-- Trigger for shifts
DROP TRIGGER IF EXISTS trigger_shift_defaults ON public.shifts;
CREATE TRIGGER trigger_shift_defaults
  BEFORE INSERT OR UPDATE ON public.shifts
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_shift_defaults();

-- Trigger function for certificates
CREATE OR REPLACE FUNCTION public.ensure_certificate_defaults()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Generate certificate number if not provided
  IF NEW.certificate_number IS NULL THEN
    NEW.certificate_number := generate_certificate_number();
  END IF;
  
  -- Generate verification code if not provided
  IF NEW.verification_code IS NULL THEN
    NEW.verification_code := generate_verification_code();
  END IF;
  
  -- Set updated_at timestamp
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$$;

-- Trigger for certificates
DROP TRIGGER IF EXISTS trigger_certificate_defaults ON public.certificates;
CREATE TRIGGER trigger_certificate_defaults
  BEFORE INSERT OR UPDATE ON public.certificates
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_certificate_defaults();

-- ================================================================
-- 11. UPDATE EXISTING DATA WITH ENHANCED VALUES
-- ================================================================

-- Update existing profiles with unique codes and enhanced data
UPDATE public.profiles SET
  unique_code = 'USRNEUHC',
  age = 25,
  nationality = 'Test Country',
  phone_number = '+1-555-0101',
  skills = ARRAY['Promotions', 'Customer Service', 'Sales'],
  experience_years = 2,
  hourly_rate = 15.00,
  is_active = true,
  onboarding_completed = true,
  documents_verified = true,
  contract_signed = true
WHERE email = 'promoter1@test.com' AND full_name = 'John Smith';

UPDATE public.profiles SET
  unique_code = 'USR7JMF5',
  age = 25,
  nationality = 'Test Country',
  phone_number = '+1-555-0102',
  skills = ARRAY['Event Management', 'Marketing', 'Communication'],
  experience_years = 3,
  hourly_rate = 16.50,
  is_active = true,
  onboarding_completed = true,
  documents_verified = true,
  contract_signed = true
WHERE email = 'promoter2@test.com' AND full_name = 'Sarah Wilson';

UPDATE public.profiles SET
  unique_code = 'USRB96Q6',
  age = 35,
  nationality = 'Test Country',
  phone_number = '+1-555-0100',
  is_active = true,
  onboarding_completed = true
WHERE email = 'company1@test.com' AND full_name = 'Test Company';

-- ================================================================
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Simplified RLS policies to avoid recursion
-- Profiles policies
DROP POLICY IF EXISTS "profiles_select_simple" ON public.profiles;
CREATE POLICY "profiles_select_simple"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "profiles_insert_simple" ON public.profiles;
CREATE POLICY "profiles_insert_simple"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_simple" ON public.profiles;
CREATE POLICY "profiles_update_simple"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid() OR 
         EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'company_admin'));

-- Similar policies for other tables
DROP POLICY IF EXISTS "shifts_tenant_policy" ON public.shifts;
CREATE POLICY "shifts_tenant_policy"
  ON public.shifts FOR ALL
  TO authenticated
  USING (tenant_id IN (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
  ));

DROP POLICY IF EXISTS "shift_assignments_tenant_policy" ON public.shift_assignments;
CREATE POLICY "shift_assignments_tenant_policy"
  ON public.shift_assignments FOR ALL
  TO authenticated
  USING (tenant_id IN (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
  ));

-- ================================================================
-- 13. SAMPLE DATA CREATION
-- ================================================================

-- Insert sample shifts for testing
INSERT INTO public.shifts (
  tenant_id,
  title,
  description,
  date,
  start_time,
  end_time,
  location,
  hourly_rate,
  status,
  shift_code,
  client_name,
  special_requirements,
  dress_code,
  equipment_provided,
  transportation_provided,
  meal_provided,
  maximum_participants
) VALUES 
(
  (SELECT tenant_id FROM public.profiles WHERE email = 'company1@test.com' LIMIT 1),
  'Product Launch Event',
  'Promote new product at shopping mall',
  CURRENT_DATE + INTERVAL '7 days',
  '09:00:00',
  '17:00:00',
  'Westfield Shopping Center, Main Street',
  18.00,
  'open',
  NULL, -- Will be auto-generated
  'TechCorp Solutions',
  ARRAY['Friendly personality', 'Good communication skills'],
  'Business casual with company branded shirt',
  ARRAY['Promotional materials', 'Tablets', 'Branded shirts'],
  false,
  true,
  4
),
(
  (SELECT tenant_id FROM public.profiles WHERE email = 'company1@test.com' LIMIT 1),
  'Weekend Market Promotion',
  'Weekend farmers market promotional event',
  CURRENT_DATE + INTERVAL '10 days',
  '08:00:00',
  '16:00:00',
  'Downtown Farmers Market, Central Plaza',
  16.00,
  'open',
  NULL, -- Will be auto-generated
  'Organic Foods Co.',
  ARRAY['Early morning availability', 'Outdoor work'],
  'Casual outdoor clothing',
  ARRAY['Tent', 'Samples', 'Brochures'],
  false,
  false,
  2
);

-- ================================================================
-- 14. VIEWS FOR REPORTING
-- ================================================================

-- Create view for promoter performance
CREATE OR REPLACE VIEW public.promoter_performance AS
SELECT 
  p.id,
  p.unique_code,
  p.full_name,
  p.email,
  p.hourly_rate,
  COUNT(sa.id) as total_shifts,
  COUNT(sa.id) FILTER (WHERE sa.status = 'completed') as completed_shifts,
  AVG(sa.performance_rating) as avg_rating,
  SUM(sa.actual_hours_worked) as total_hours,
  SUM(sa.final_payment) as total_earnings,
  MAX(sa.updated_at) as last_shift_date
FROM public.profiles p
LEFT JOIN public.shift_assignments sa ON p.id = sa.promoter_id
WHERE p.role IN ('part_timer', 'promoter')
GROUP BY p.id, p.unique_code, p.full_name, p.email, p.hourly_rate;

-- Create view for shift analytics
CREATE OR REPLACE VIEW public.shift_analytics AS
SELECT 
  s.id,
  s.shift_code,
  s.title,
  s.date,
  s.status,
  s.hourly_rate,
  s.maximum_participants,
  s.current_participants,
  COUNT(sa.id) as total_assignments,
  COUNT(sa.id) FILTER (WHERE sa.status = 'accepted') as accepted_assignments,
  COUNT(sa.id) FILTER (WHERE sa.status = 'completed') as completed_assignments,
  AVG(sa.performance_rating) as avg_performance,
  SUM(sa.final_payment) as total_cost
FROM public.shifts s
LEFT JOIN public.shift_assignments sa ON s.id = sa.shift_id
GROUP BY s.id, s.shift_code, s.title, s.date, s.status, s.hourly_rate, s.maximum_participants, s.current_participants;

-- ================================================================
-- 15. VERIFICATION QUERIES
-- ================================================================

-- Verify all enhancements
SELECT 'Profiles with unique codes' as metric, COUNT(*) as count
FROM public.profiles 
WHERE unique_code IS NOT NULL
UNION ALL
SELECT 'Active promoters' as metric, COUNT(*) as count
FROM public.profiles 
WHERE role IN ('part_timer', 'promoter') AND is_active = true
UNION ALL
SELECT 'Available shifts' as metric, COUNT(*) as count
FROM public.shifts 
WHERE status = 'open' AND date >= CURRENT_DATE
UNION ALL
SELECT 'Tables with RLS enabled' as metric, COUNT(*) as count
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE t.schemaname = 'public' 
AND c.relrowsecurity = true
AND t.tablename IN ('profiles', 'shifts', 'shift_assignments', 'certificates', 'payments');

-- Show enhanced profiles data
SELECT 
  full_name,
  unique_code,
  role,
  verification_status,
  age,
  nationality,
  skills,
  experience_years,
  hourly_rate,
  is_active,
  onboarding_completed
FROM public.profiles 
WHERE role IN ('part_timer', 'promoter', 'company_admin')
ORDER BY role, full_name;

-- ================================================================
-- ENHANCEMENT COMPLETE
-- ================================================================

-- Final success message
SELECT 
  '🎉 FULL APP SQL ENHANCEMENT COMPLETED SUCCESSFULLY!' as status,
  'All tables, indexes, functions, triggers, and policies have been created/updated' as details,
  'Your Smart Shift Tracker app now has comprehensive database support' as result;