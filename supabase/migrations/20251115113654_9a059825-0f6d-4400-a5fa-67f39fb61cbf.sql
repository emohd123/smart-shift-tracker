-- Fix remaining function security warning
CREATE OR REPLACE FUNCTION public.is_certificate_valid(ref_number text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.certificates
    WHERE reference_number = ref_number AND status = 'approved'
  )
$$;

-- Add missing tables that the application code references

-- Shift Locations Table (for saved locations)
CREATE TABLE IF NOT EXISTS public.shift_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  radius numeric DEFAULT 100,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.shift_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Companies can manage their locations"
ON public.shift_locations FOR ALL
USING (auth.uid() = company_id);

-- Credit Transactions Table
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount integer NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('purchase', 'usage', 'refund')),
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
ON public.credit_transactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
ON public.credit_transactions FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- User Module Progress Table (for training)
CREATE TABLE IF NOT EXISTS public.user_module_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  module_id text NOT NULL,
  completed boolean DEFAULT false,
  progress_percentage integer DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, module_id)
);

ALTER TABLE public.user_module_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own progress"
ON public.user_module_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
ON public.user_module_progress FOR ALL
USING (auth.uid() = user_id);

-- Subscribers Table (for subscription management)
CREATE TABLE IF NOT EXISTS public.subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  subscription_tier text NOT NULL CHECK (subscription_tier IN ('free', 'basic', 'premium')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription"
ON public.subscribers FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
ON public.subscribers FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Shift Assignments Table (for assigning promoters to shifts)
CREATE TABLE IF NOT EXISTS public.shift_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id uuid REFERENCES public.shifts(id) ON DELETE CASCADE NOT NULL,
  promoter_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(shift_id, promoter_id)
);

ALTER TABLE public.shift_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Promoters can view their assignments"
ON public.shift_assignments FOR SELECT
USING (auth.uid() = promoter_id);

CREATE POLICY "Companies can view assignments for their shifts"
ON public.shift_assignments FOR SELECT
USING (auth.uid() IN (SELECT company_id FROM public.shifts WHERE id = shift_id));

CREATE POLICY "Companies can manage assignments for their shifts"
ON public.shift_assignments FOR ALL
USING (auth.uid() IN (SELECT company_id FROM public.shifts WHERE id = shift_id));

CREATE POLICY "Promoters can update their assignment status"
ON public.shift_assignments FOR UPDATE
USING (auth.uid() = promoter_id);

-- Add unique_code to profiles (for referral system)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS unique_code text UNIQUE;

-- Add total_credits_purchased to user_credits if it doesn't exist (already in table creation)
-- This was already in the original migration so no action needed