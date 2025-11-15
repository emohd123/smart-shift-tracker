-- Training Modules Table
CREATE TABLE IF NOT EXISTS public.training_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  content_type text NOT NULL CHECK (content_type IN ('video', 'quiz', 'document')),
  difficulty_level text DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  duration_minutes integer,
  content_url text,
  order_index integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.training_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active training modules"
ON public.training_modules FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage training modules"
ON public.training_modules FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Payouts Table
CREATE TABLE IF NOT EXISTS public.payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  payment_method text,
  transaction_reference text,
  payout_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payouts"
ON public.payouts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all payouts"
ON public.payouts FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Documents Table (for uploaded documents)
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  document_type text NOT NULL,
  document_url text NOT NULL,
  file_name text,
  file_size integer,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own documents"
ON public.documents FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can upload their own documents"
ON public.documents FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all documents"
ON public.documents FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all documents"
ON public.documents FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Add missing RPC functions for user management

-- Function to delete user time logs
CREATE OR REPLACE FUNCTION public.delete_user_time_logs(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.time_logs WHERE user_id = target_user_id;
END;
$$;

-- Function to delete user (admin only)
CREATE OR REPLACE FUNCTION public.delete_user(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can delete users';
  END IF;
  
  -- Delete from profiles (cascade will handle related data)
  DELETE FROM public.profiles WHERE id = target_user_id;
  
  -- Delete from auth.users
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

-- Add missing shift fields that code references
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS end_date date;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS pay_rate_type text DEFAULT 'hourly' CHECK (pay_rate_type IN ('hourly', 'fixed'));

-- Update shift_locations to support shift_id (for saved locations with shifts)
ALTER TABLE public.shift_locations ADD COLUMN IF NOT EXISTS shift_id uuid REFERENCES public.shifts(id) ON DELETE CASCADE;