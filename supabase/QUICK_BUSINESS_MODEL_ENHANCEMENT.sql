-- QUICK ENHANCED BUSINESS MODEL - Apply immediately
-- Focus: Certificate Revenue Model + Shift Management by Unique ID

-- 1. Enhance certificates table for $9.99 revenue model
ALTER TABLE public.certificates 
ADD COLUMN IF NOT EXISTS price_paid NUMERIC(10,2) DEFAULT 9.99,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS total_hours_worked NUMERIC(8,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS campaigns_completed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS client_names TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS work_period_start DATE,
ADD COLUMN IF NOT EXISTS work_period_end DATE;

-- 2. Add certificate pricing constraint
ALTER TABLE public.certificates 
ADD CONSTRAINT check_certificate_price CHECK (price_paid >= 0);

-- 3. Enhance shift assignments for better tracking
ALTER TABLE public.shift_assignments
ADD COLUMN IF NOT EXISTS hours_worked NUMERIC(8,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_amount NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- 4. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_certificates_payment_status ON public.certificates(payment_status);
CREATE INDEX IF NOT EXISTS idx_certificates_price_paid ON public.certificates(price_paid);
CREATE INDEX IF NOT EXISTS idx_shift_assignments_hours_worked ON public.shift_assignments(hours_worked);
CREATE INDEX IF NOT EXISTS idx_shift_assignments_payment_status ON public.shift_assignments(payment_status);

-- 5. Create view for certificate revenue tracking
CREATE OR REPLACE VIEW public.certificate_revenue AS
SELECT 
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as certificates_issued,
  SUM(price_paid) as total_revenue,
  AVG(total_hours_worked) as avg_hours_per_certificate
FROM public.certificates 
WHERE payment_status = 'completed'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- 6. Create view for part-timer performance tracking
CREATE OR REPLACE VIEW public.part_timer_performance AS
SELECT 
  p.id,
  p.full_name,
  p.unique_code,
  COUNT(DISTINCT sa.shift_id) as total_shifts,
  SUM(sa.hours_worked) as total_hours,
  SUM(sa.payment_amount) as total_earnings,
  COUNT(c.id) as certificates_purchased
FROM public.profiles p
LEFT JOIN public.shift_assignments sa ON p.id = sa.part_timer_id
LEFT JOIN public.certificates c ON p.id = c.user_id
WHERE p.role = 'part_timer'
GROUP BY p.id, p.full_name, p.unique_code;

-- Grant permissions
GRANT SELECT ON public.certificate_revenue TO authenticated;
GRANT SELECT ON public.part_timer_performance TO authenticated;

NOTIFY pgrst, 'reload schema';
