-- ============================================================
-- SMART SHIFT TRACKER - BUSINESS MODEL ENHANCEMENT
-- ============================================================
-- This script implements the new business model:
-- 1. Companies create shifts and assign part-timers by unique ID
-- 2. Certificate generation as primary revenue source ($9.99)
-- 3. Enhanced shift tracking with hours/payments per promoter
-- 4. Simplified revenue model focused on certificate sales
-- ============================================================

BEGIN;

-- ============================================================
-- STEP 1: ENHANCE PROFILES WITH UNIQUE ID SYSTEM
-- ============================================================

-- Add unique_id to profiles if not exists (this should already exist from previous enhancement)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'unique_id') THEN
    ALTER TABLE public.profiles ADD COLUMN unique_id VARCHAR(12) UNIQUE;
    
    -- Generate unique IDs for existing profiles
    UPDATE public.profiles 
    SET unique_id = UPPER(SUBSTRING(MD5(id::text || created_at::text) FROM 1 FOR 8) || LPAD((ROW_NUMBER() OVER (ORDER BY created_at))::text, 4, '0'))
    WHERE unique_id IS NULL;
    
    -- Make unique_id required for new records
    ALTER TABLE public.profiles ALTER COLUMN unique_id SET NOT NULL;
    
    -- Create index for fast lookups
    CREATE INDEX IF NOT EXISTS idx_profiles_unique_id ON public.profiles(unique_id);
  END IF;
END $$;

-- ============================================================
-- STEP 2: ENHANCE SHIFTS TABLE FOR NEW BUSINESS MODEL
-- ============================================================

-- Add enhanced fields to shifts table
DO $$ 
BEGIN
  -- Add company-specific fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shifts' AND column_name = 'company_id') THEN
    ALTER TABLE public.shifts ADD COLUMN company_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  
  -- Add assignment tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shifts' AND column_name = 'total_assigned_promoters') THEN
    ALTER TABLE public.shifts ADD COLUMN total_assigned_promoters INTEGER DEFAULT 0;
  END IF;
  
  -- Add revenue tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shifts' AND column_name = 'certificates_generated') THEN
    ALTER TABLE public.shifts ADD COLUMN certificates_generated INTEGER DEFAULT 0;
    ALTER TABLE public.shifts ADD COLUMN certificate_revenue DECIMAL(10,2) DEFAULT 0.00;
  END IF;
  
  -- Add enhanced metadata
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shifts' AND column_name = 'assignment_method') THEN
    ALTER TABLE public.shifts ADD COLUMN assignment_method VARCHAR(20) DEFAULT 'manual'; -- 'manual', 'unique_id', 'bulk'
    ALTER TABLE public.shifts ADD COLUMN requirements TEXT;
    ALTER TABLE public.shifts ADD COLUMN shift_notes TEXT;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_shifts_company_id ON public.shifts(company_id);
CREATE INDEX IF NOT EXISTS idx_shifts_status_date ON public.shifts(status, date);
CREATE INDEX IF NOT EXISTS idx_shifts_certificates ON public.shifts(certificates_generated) WHERE certificates_generated > 0;

-- ============================================================
-- STEP 3: ENHANCE SHIFT ASSIGNMENTS FOR UNIQUE ID TRACKING
-- ============================================================

-- Enhanced shift_assignments table
DO $$ 
BEGIN
  -- Add unique_id assignment tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shift_assignments' AND column_name = 'assigned_via_unique_id') THEN
    ALTER TABLE public.shift_assignments ADD COLUMN assigned_via_unique_id VARCHAR(12);
    ALTER TABLE public.shift_assignments ADD COLUMN assignment_method VARCHAR(20) DEFAULT 'manual';
  END IF;
  
  -- Add performance tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shift_assignments' AND column_name = 'total_hours_worked') THEN
    ALTER TABLE public.shift_assignments ADD COLUMN total_hours_worked DECIMAL(10,2) DEFAULT 0.00;
    ALTER TABLE public.shift_assignments ADD COLUMN total_earnings DECIMAL(10,2) DEFAULT 0.00;
    ALTER TABLE public.shift_assignments ADD COLUMN performance_rating DECIMAL(3,2) DEFAULT 0.00;
  END IF;
  
  -- Add certificate tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shift_assignments' AND column_name = 'certificate_requested') THEN
    ALTER TABLE public.shift_assignments ADD COLUMN certificate_requested BOOLEAN DEFAULT FALSE;
    ALTER TABLE public.shift_assignments ADD COLUMN certificate_generated BOOLEAN DEFAULT FALSE;
    ALTER TABLE public.shift_assignments ADD COLUMN certificate_payment_status VARCHAR(20) DEFAULT 'pending'; -- 'pending', 'paid', 'generated'
  END IF;
END $$;

-- Create indexes for enhanced queries
CREATE INDEX IF NOT EXISTS idx_shift_assignments_unique_id ON public.shift_assignments(assigned_via_unique_id);
CREATE INDEX IF NOT EXISTS idx_shift_assignments_certificate ON public.shift_assignments(certificate_requested, certificate_generated);
CREATE INDEX IF NOT EXISTS idx_shift_assignments_earnings ON public.shift_assignments(total_earnings) WHERE total_earnings > 0;

-- ============================================================
-- STEP 4: ENHANCED CERTIFICATE SYSTEM FOR REVENUE GENERATION
-- ============================================================

-- Add certificate pricing and revenue tracking
DO $$ 
BEGIN
  -- Add pricing fields to certificates
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certificates' AND column_name = 'price_paid') THEN
    ALTER TABLE public.certificates ADD COLUMN price_paid DECIMAL(10,2) DEFAULT 9.99;
    ALTER TABLE public.certificates ADD COLUMN payment_status VARCHAR(20) DEFAULT 'pending'; -- 'pending', 'paid', 'completed'
    ALTER TABLE public.certificates ADD COLUMN payment_reference VARCHAR(100);
  END IF;
  
  -- Add enhanced certificate data
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certificates' AND column_name = 'work_summary') THEN
    ALTER TABLE public.certificates ADD COLUMN work_summary JSONB;
    ALTER TABLE public.certificates ADD COLUMN included_shifts JSONB;
    ALTER TABLE public.certificates ADD COLUMN total_hours_certified DECIMAL(10,2) DEFAULT 0.00;
    ALTER TABLE public.certificates ADD COLUMN campaigns_worked JSONB;
    ALTER TABLE public.certificates ADD COLUMN client_names JSONB;
  END IF;
END $$;

-- Create revenue tracking indexes
CREATE INDEX IF NOT EXISTS idx_certificates_payment_status ON public.certificates(payment_status);
CREATE INDEX IF NOT EXISTS idx_certificates_price ON public.certificates(price_paid) WHERE price_paid > 0;
CREATE INDEX IF NOT EXISTS idx_certificates_date_created ON public.certificates(created_at);

-- ============================================================
-- STEP 5: CREATE CERTIFICATE REVENUE TRACKING TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.certificate_revenue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id UUID NOT NULL REFERENCES public.certificates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL DEFAULT 9.99,
  payment_method VARCHAR(50) DEFAULT 'stripe',
  payment_reference VARCHAR(255),
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'completed', -- 'pending', 'completed', 'refunded'
  stripe_session_id VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for revenue tracking
CREATE INDEX IF NOT EXISTS idx_certificate_revenue_user ON public.certificate_revenue(user_id);
CREATE INDEX IF NOT EXISTS idx_certificate_revenue_date ON public.certificate_revenue(payment_date);
CREATE INDEX IF NOT EXISTS idx_certificate_revenue_amount ON public.certificate_revenue(amount);
CREATE INDEX IF NOT EXISTS idx_certificate_revenue_status ON public.certificate_revenue(status);

-- ============================================================
-- STEP 6: ENHANCED RLS POLICIES FOR NEW BUSINESS MODEL
-- ============================================================

-- Enable RLS on new table
ALTER TABLE public.certificate_revenue ENABLE ROW LEVEL SECURITY;

-- Certificate revenue policies
CREATE POLICY "Users can view own certificate payments"
  ON public.certificate_revenue FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own certificate payments"
  ON public.certificate_revenue FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all certificate payments"
  ON public.certificate_revenue FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Enhanced shift assignment policies for unique ID system
DROP POLICY IF EXISTS "Enhanced shift assignment access" ON public.shift_assignments;
CREATE POLICY "Enhanced shift assignment access"
  ON public.shift_assignments FOR ALL
  USING (
    -- Part-timers can see their own assignments
    auth.uid() = part_timer_id OR
    -- Companies can see assignments they created
    auth.uid() = assigned_by OR
    -- Admins can see everything
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- ============================================================
-- STEP 7: CREATE FUNCTIONS FOR NEW BUSINESS MODEL
-- ============================================================

-- Function to assign part-timer by unique ID
CREATE OR REPLACE FUNCTION public.assign_part_timer_by_unique_id(
  p_shift_id UUID,
  p_unique_id VARCHAR(12),
  p_company_id UUID DEFAULT auth.uid()
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_part_timer_id UUID;
  v_assignment_id UUID;
  v_result JSON;
BEGIN
  -- Find part-timer by unique ID
  SELECT id INTO v_part_timer_id
  FROM public.profiles
  WHERE unique_id = p_unique_id
  AND role = 'part_timer';
  
  IF v_part_timer_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Part-timer not found with unique ID: ' || p_unique_id
    );
  END IF;
  
  -- Check if already assigned
  IF EXISTS (
    SELECT 1 FROM public.shift_assignments
    WHERE shift_id = p_shift_id AND part_timer_id = v_part_timer_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Part-timer already assigned to this shift'
    );
  END IF;
  
  -- Create assignment
  INSERT INTO public.shift_assignments (
    shift_id,
    part_timer_id,
    assigned_by,
    assigned_via_unique_id,
    assignment_method,
    status,
    assigned_at
  ) VALUES (
    p_shift_id,
    v_part_timer_id,
    p_company_id,
    p_unique_id,
    'unique_id',
    'assigned',
    NOW()
  ) RETURNING id INTO v_assignment_id;
  
  -- Update shift assignment count
  UPDATE public.shifts
  SET total_assigned_promoters = total_assigned_promoters + 1,
      updated_at = NOW()
  WHERE id = p_shift_id;
  
  RETURN json_build_object(
    'success', true,
    'assignment_id', v_assignment_id,
    'part_timer_id', v_part_timer_id,
    'message', 'Part-timer assigned successfully'
  );
END;
$$;

-- Function to calculate certificate revenue
CREATE OR REPLACE FUNCTION public.calculate_certificate_revenue(
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  total_certificates BIGINT,
  total_revenue DECIMAL(10,2),
  average_price DECIMAL(10,2),
  monthly_breakdown JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
BEGIN
  -- Set default date range if not provided
  v_start_date := COALESCE(p_start_date, DATE_TRUNC('month', NOW() - INTERVAL '12 months'));
  v_end_date := COALESCE(p_end_date, NOW()::DATE);
  
  RETURN QUERY
  WITH revenue_stats AS (
    SELECT 
      COUNT(*) as cert_count,
      SUM(amount) as total_amount,
      AVG(amount) as avg_amount
    FROM public.certificate_revenue
    WHERE payment_date::DATE BETWEEN v_start_date AND v_end_date
    AND status = 'completed'
  ),
  monthly_data AS (
    SELECT 
      json_agg(
        json_build_object(
          'month', TO_CHAR(DATE_TRUNC('month', payment_date), 'YYYY-MM'),
          'certificates', COUNT(*),
          'revenue', SUM(amount)
        ) ORDER BY DATE_TRUNC('month', payment_date)
      ) as breakdown
    FROM public.certificate_revenue
    WHERE payment_date::DATE BETWEEN v_start_date AND v_end_date
    AND status = 'completed'
    GROUP BY DATE_TRUNC('month', payment_date)
  )
  SELECT 
    rs.cert_count,
    rs.total_amount,
    rs.avg_amount,
    COALESCE(md.breakdown, '[]'::jsonb)
  FROM revenue_stats rs
  CROSS JOIN monthly_data md;
END;
$$;

-- Function to update shift assignment earnings
CREATE OR REPLACE FUNCTION public.update_assignment_earnings(
  p_assignment_id UUID,
  p_hours_worked DECIMAL(10,2),
  p_hourly_rate DECIMAL(10,2)
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_earnings DECIMAL(10,2);
BEGIN
  v_earnings := p_hours_worked * p_hourly_rate;
  
  UPDATE public.shift_assignments
  SET 
    total_hours_worked = p_hours_worked,
    total_earnings = v_earnings,
    updated_at = NOW()
  WHERE id = p_assignment_id
  AND (part_timer_id = auth.uid() OR assigned_by = auth.uid() OR 
       EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
       
  RETURN FOUND;
END;
$$;

-- ============================================================
-- STEP 8: CREATE TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================

-- Trigger to update shift statistics when assignments change
CREATE OR REPLACE FUNCTION public.update_shift_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update total assigned promoters count
  UPDATE public.shifts
  SET 
    total_assigned_promoters = (
      SELECT COUNT(*)
      FROM public.shift_assignments
      WHERE shift_id = COALESCE(NEW.shift_id, OLD.shift_id)
      AND status IN ('assigned', 'confirmed', 'completed')
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.shift_id, OLD.shift_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_shift_stats ON public.shift_assignments;
CREATE TRIGGER trigger_update_shift_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.shift_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_shift_stats();

-- Trigger to update certificate revenue when certificates are paid
CREATE OR REPLACE FUNCTION public.update_certificate_revenue_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update shift certificate statistics
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE public.shifts
    SET 
      certificates_generated = certificates_generated + 1,
      certificate_revenue = certificate_revenue + NEW.amount,
      updated_at = NOW()
    WHERE id IN (
      SELECT DISTINCT sa.shift_id
      FROM public.shift_assignments sa
      JOIN public.certificates c ON c.user_id = sa.part_timer_id
      WHERE c.id = NEW.certificate_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_certificate_revenue_stats ON public.certificate_revenue;
CREATE TRIGGER trigger_update_certificate_revenue_stats
  AFTER UPDATE ON public.certificate_revenue
  FOR EACH ROW
  EXECUTE FUNCTION public.update_certificate_revenue_stats();

-- ============================================================
-- STEP 9: CREATE VIEWS FOR DASHBOARD ANALYTICS
-- ============================================================

-- Enhanced dashboard view for companies
CREATE OR REPLACE VIEW public.company_dashboard_stats AS
SELECT 
  u.id as company_id,
  u.email as company_email,
  p.full_name as company_name,
  -- Shift statistics
  COUNT(DISTINCT s.id) as total_shifts_created,
  COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.id END) as active_shifts,
  COUNT(DISTINCT CASE WHEN s.status = 'completed' THEN s.id END) as completed_shifts,
  -- Assignment statistics
  COUNT(DISTINCT sa.id) as total_assignments,
  COUNT(DISTINCT sa.part_timer_id) as unique_part_timers,
  -- Revenue statistics
  SUM(s.certificate_revenue) as total_certificate_revenue,
  SUM(s.certificates_generated) as total_certificates_generated,
  -- Performance metrics
  AVG(sa.total_hours_worked) as avg_hours_per_assignment,
  AVG(sa.total_earnings) as avg_earnings_per_assignment,
  AVG(sa.performance_rating) as avg_performance_rating
FROM auth.users u
JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.shifts s ON s.company_id = u.id OR s.employer_id = u.id
LEFT JOIN public.shift_assignments sa ON sa.shift_id = s.id
WHERE p.role IN ('company_admin', 'company_manager')
GROUP BY u.id, u.email, p.full_name;

-- Enhanced dashboard view for part-timers
CREATE OR REPLACE VIEW public.part_timer_dashboard_stats AS
SELECT 
  u.id as part_timer_id,
  p.unique_id,
  p.full_name,
  -- Assignment statistics
  COUNT(DISTINCT sa.shift_id) as total_shifts_assigned,
  COUNT(DISTINCT CASE WHEN sa.status = 'completed' THEN sa.shift_id END) as completed_shifts,
  -- Work statistics
  SUM(sa.total_hours_worked) as total_hours_worked,
  SUM(sa.total_earnings) as total_earnings,
  AVG(sa.performance_rating) as avg_performance_rating,
  -- Certificate statistics
  COUNT(DISTINCT CASE WHEN sa.certificate_requested THEN sa.id END) as certificates_requested,
  COUNT(DISTINCT CASE WHEN sa.certificate_generated THEN sa.id END) as certificates_generated,
  -- Recent activity
  MAX(sa.updated_at) as last_assignment_update
FROM auth.users u
JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.shift_assignments sa ON sa.part_timer_id = u.id
WHERE p.role = 'part_timer'
GROUP BY u.id, p.unique_id, p.full_name;

-- Revenue analytics view
CREATE OR REPLACE VIEW public.revenue_analytics AS
SELECT 
  DATE_TRUNC('month', cr.payment_date) as month,
  COUNT(*) as certificates_sold,
  SUM(cr.amount) as total_revenue,
  AVG(cr.amount) as average_price,
  COUNT(DISTINCT cr.user_id) as unique_customers,
  -- Growth metrics
  LAG(COUNT(*)) OVER (ORDER BY DATE_TRUNC('month', cr.payment_date)) as prev_month_certificates,
  LAG(SUM(cr.amount)) OVER (ORDER BY DATE_TRUNC('month', cr.payment_date)) as prev_month_revenue
FROM public.certificate_revenue cr
WHERE cr.status = 'completed'
GROUP BY DATE_TRUNC('month', cr.payment_date)
ORDER BY month DESC;

-- Grant necessary permissions
GRANT SELECT ON public.company_dashboard_stats TO authenticated;
GRANT SELECT ON public.part_timer_dashboard_stats TO authenticated;
GRANT SELECT ON public.revenue_analytics TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

COMMIT;

-- ============================================================
-- SUMMARY OF BUSINESS MODEL ENHANCEMENTS
-- ============================================================
/*
This enhancement implements the new business model with:

1. UNIQUE ID SYSTEM:
   - Part-timers get unique IDs for easy assignment
   - Companies can assign by unique ID instead of searching
   - Tracking of assignment methods

2. ENHANCED SHIFT MANAGEMENT:
   - Companies create shifts with better tracking
   - Assignment counts and performance metrics
   - Revenue tracking per shift

3. CERTIFICATE REVENUE MODEL:
   - $9.99 default price for certificates
   - Payment tracking and revenue analytics
   - Enhanced certificate data with work summaries

4. PERFORMANCE TRACKING:
   - Hours worked and earnings per assignment
   - Performance ratings and metrics
   - Dashboard views for insights

5. STREAMLINED BUSINESS FOCUS:
   - Removed training/credits/subscription complexity
   - Focus on shift management + certificate revenue
   - Enhanced analytics for business intelligence

Key Functions Added:
- assign_part_timer_by_unique_id(): Assign by unique ID
- calculate_certificate_revenue(): Revenue analytics
- update_assignment_earnings(): Track performance

Key Views Added:
- company_dashboard_stats: Company performance metrics
- part_timer_dashboard_stats: Part-timer work statistics
- revenue_analytics: Monthly revenue tracking
*/
