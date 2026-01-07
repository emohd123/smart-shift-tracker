-- Migration: Create missing tables (notifications, shift_ratings, shift_assignment_payment_status)
-- These tables are referenced in the frontend but don't exist in the database

-- =============================================
-- 1. CREATE NOTIFICATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text,
  read boolean DEFAULT false,
  type text DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'contract_required')),
  related_id uuid,
  data jsonb,
  created_at timestamptz DEFAULT now()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, read);

-- Add RLS policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" 
  ON public.notifications FOR SELECT 
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" 
  ON public.notifications FOR UPDATE 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "System can insert notifications" 
  ON public.notifications FOR INSERT 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications" 
  ON public.notifications FOR DELETE 
  USING (user_id = auth.uid());

COMMENT ON TABLE public.notifications IS 'Stores in-app notifications for users';
COMMENT ON COLUMN public.notifications.type IS 'Notification type: info, success, warning, error, contract_required';
COMMENT ON COLUMN public.notifications.related_id IS 'Optional reference to related entity (e.g., shift_id, contract_id)';
COMMENT ON COLUMN public.notifications.data IS 'Optional JSON data for additional context';

-- =============================================
-- 2. CREATE SHIFT_RATINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.shift_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id uuid NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  shift_assignment_id uuid REFERENCES public.shift_assignments(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  promoter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(shift_assignment_id)
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_shift_ratings_shift_id ON public.shift_ratings(shift_id);
CREATE INDEX IF NOT EXISTS idx_shift_ratings_promoter_id ON public.shift_ratings(promoter_id);
CREATE INDEX IF NOT EXISTS idx_shift_ratings_company_id ON public.shift_ratings(company_id);

-- Add RLS policies
ALTER TABLE public.shift_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Companies can insert ratings" ON public.shift_ratings;
CREATE POLICY "Companies can insert ratings" 
  ON public.shift_ratings FOR INSERT 
  WITH CHECK (company_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can view ratings" ON public.shift_ratings;
CREATE POLICY "Anyone can view ratings" 
  ON public.shift_ratings FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Companies can update own ratings" ON public.shift_ratings;
CREATE POLICY "Companies can update own ratings" 
  ON public.shift_ratings FOR UPDATE 
  USING (company_id = auth.uid())
  WITH CHECK (company_id = auth.uid());

DROP POLICY IF EXISTS "Companies can delete own ratings" ON public.shift_ratings;
CREATE POLICY "Companies can delete own ratings" 
  ON public.shift_ratings FOR DELETE 
  USING (company_id = auth.uid());

COMMENT ON TABLE public.shift_ratings IS 'Stores ratings given by companies to promoters for completed shifts';
COMMENT ON COLUMN public.shift_ratings.rating IS 'Rating from 1-5 stars';

-- =============================================
-- 3. CREATE SHIFT_ASSIGNMENT_PAYMENT_STATUS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.shift_assignment_payment_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.shift_assignments(id) ON DELETE CASCADE UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'paid')),
  scheduled_at timestamptz,
  scheduled_by uuid REFERENCES public.profiles(id),
  paid_at timestamptz,
  paid_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_payment_status_assignment_id ON public.shift_assignment_payment_status(assignment_id);
CREATE INDEX IF NOT EXISTS idx_payment_status_status ON public.shift_assignment_payment_status(status);

-- Add RLS policies
ALTER TABLE public.shift_assignment_payment_status ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is company owner of assignment
CREATE OR REPLACE FUNCTION public.is_assignment_company_owner(p_assignment_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.shift_assignments sa 
    JOIN public.shifts s ON sa.shift_id = s.id 
    WHERE sa.id = p_assignment_id AND s.company_id = auth.uid()
  );
$$;

-- Helper function to check if user is promoter of assignment
CREATE OR REPLACE FUNCTION public.is_assignment_promoter(p_assignment_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.shift_assignments sa 
    WHERE sa.id = p_assignment_id AND sa.promoter_id = auth.uid()
  );
$$;

DROP POLICY IF EXISTS "Companies can manage payment status" ON public.shift_assignment_payment_status;
CREATE POLICY "Companies can manage payment status" 
  ON public.shift_assignment_payment_status FOR ALL 
  USING (public.is_assignment_company_owner(assignment_id))
  WITH CHECK (public.is_assignment_company_owner(assignment_id));

DROP POLICY IF EXISTS "Promoters can view own payment status" ON public.shift_assignment_payment_status;
CREATE POLICY "Promoters can view own payment status" 
  ON public.shift_assignment_payment_status FOR SELECT 
  USING (public.is_assignment_promoter(assignment_id));

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_payment_status_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_payment_status_timestamp ON public.shift_assignment_payment_status;
CREATE TRIGGER update_payment_status_timestamp
  BEFORE UPDATE ON public.shift_assignment_payment_status
  FOR EACH ROW
  EXECUTE FUNCTION public.update_payment_status_updated_at();

COMMENT ON TABLE public.shift_assignment_payment_status IS 'Tracks payment status for shift assignments';
COMMENT ON COLUMN public.shift_assignment_payment_status.status IS 'Payment status: pending, scheduled, or paid';

