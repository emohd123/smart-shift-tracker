-- Create credits system for pay-per-use features
CREATE TABLE public.user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credits_balance INTEGER NOT NULL DEFAULT 0,
  total_purchased INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

-- Users can view their own credits
CREATE POLICY "Users can view their own credits" 
ON public.user_credits 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can update their own credits (for purchases)
CREATE POLICY "Users can update their own credits" 
ON public.user_credits 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can insert their own credit record
CREATE POLICY "Users can insert their own credits" 
ON public.user_credits 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create credit transactions table for tracking
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- positive for purchases, negative for usage
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'usage', 'refund', 'bonus')),
  description TEXT NOT NULL,
  reference_id TEXT, -- reference to related entity (certificate, job posting, etc.)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view their own transactions" 
ON public.credit_transactions 
FOR SELECT 
USING (auth.uid() = user_id);

-- System can insert transactions
CREATE POLICY "System can insert transactions" 
ON public.credit_transactions 
FOR INSERT 
WITH CHECK (true);

-- Create premium job postings table
CREATE TABLE public.job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  pay_rate NUMERIC,
  pay_rate_type TEXT DEFAULT 'hour' CHECK (pay_rate_type IN ('hour', 'day', 'project', 'month')),
  job_type TEXT NOT NULL CHECK (job_type IN ('promotion', 'event', 'retail', 'hospitality', 'other')),
  requirements TEXT[],
  benefits TEXT[],
  start_date DATE,
  end_date DATE,
  positions_available INTEGER DEFAULT 1,
  is_premium BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_urgent BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'filled', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;

-- Everyone can view active job postings
CREATE POLICY "Everyone can view active job postings" 
ON public.job_postings 
FOR SELECT 
USING (status = 'active');

-- Employers can manage their own job postings
CREATE POLICY "Employers can manage their own job postings" 
ON public.job_postings 
FOR ALL 
USING (auth.uid() = employer_id);

-- Create job applications table
CREATE TABLE public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cover_letter TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected')),
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  UNIQUE(job_id, applicant_id)
);

-- Enable RLS
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Applicants can view their own applications
CREATE POLICY "Users can view their own applications" 
ON public.job_applications 
FOR SELECT 
USING (auth.uid() = applicant_id);

-- Applicants can create applications
CREATE POLICY "Users can apply for jobs" 
ON public.job_applications 
FOR INSERT 
WITH CHECK (auth.uid() = applicant_id);

-- Employers can view applications for their jobs
CREATE POLICY "Employers can view applications for their jobs" 
ON public.job_applications 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.job_postings 
  WHERE job_postings.id = job_applications.job_id 
  AND job_postings.employer_id = auth.uid()
));

-- Employers can update application status
CREATE POLICY "Employers can update application status" 
ON public.job_applications 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.job_postings 
  WHERE job_postings.id = job_applications.job_id 
  AND job_postings.employer_id = auth.uid()
));

-- Create training modules table
CREATE TABLE public.training_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('video', 'text', 'interactive', 'mixed')),
  difficulty_level TEXT NOT NULL CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  estimated_duration INTEGER NOT NULL, -- in minutes
  price_credits INTEGER NOT NULL DEFAULT 0, -- 0 for free modules
  category TEXT NOT NULL,
  skills_covered TEXT[],
  preview_content TEXT,
  full_content TEXT,
  video_url TEXT,
  completion_certificate BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.training_modules ENABLE ROW LEVEL SECURITY;

-- Everyone can view active training modules
CREATE POLICY "Everyone can view active training modules" 
ON public.training_modules 
FOR SELECT 
USING (is_active = true);

-- Create user module progress table
CREATE TABLE public.user_module_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.training_modules(id) ON DELETE CASCADE,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  completed_at TIMESTAMPTZ,
  certificate_issued BOOLEAN DEFAULT false,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_accessed TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, module_id)
);

-- Enable RLS
ALTER TABLE public.user_module_progress ENABLE ROW LEVEL SECURITY;

-- Users can view their own progress
CREATE POLICY "Users can view their own progress" 
ON public.user_module_progress 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can update their own progress
CREATE POLICY "Users can update their own progress" 
ON public.user_module_progress 
FOR ALL 
USING (auth.uid() = user_id);

-- Update timestamps trigger for various tables
CREATE TRIGGER update_user_credits_updated_at
BEFORE UPDATE ON public.user_credits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_postings_updated_at
BEFORE UPDATE ON public.job_postings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_training_modules_updated_at
BEFORE UPDATE ON public.training_modules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample training modules
INSERT INTO public.training_modules (title, description, content_type, difficulty_level, estimated_duration, price_credits, category, skills_covered, preview_content) VALUES
('Customer Service Excellence', 'Master the art of exceptional customer service in retail and hospitality environments', 'mixed', 'beginner', 120, 50, 'Customer Service', ARRAY['Communication', 'Problem Solving', 'Conflict Resolution'], 'Learn the fundamentals of customer service...'),
('Advanced Sales Techniques', 'Proven strategies for increasing sales conversion and customer satisfaction', 'video', 'intermediate', 90, 75, 'Sales', ARRAY['Sales Psychology', 'Negotiation', 'Closing Techniques'], 'Discover advanced sales methodologies...'),
('Event Management Fundamentals', 'Complete guide to planning and executing successful promotional events', 'mixed', 'intermediate', 150, 100, 'Event Management', ARRAY['Planning', 'Coordination', 'Risk Management'], 'Master the essentials of event management...'),
('Digital Marketing for Promoters', 'Leverage social media and digital tools to enhance promotional campaigns', 'interactive', 'beginner', 60, 40, 'Digital Marketing', ARRAY['Social Media', 'Content Creation', 'Analytics'], 'Learn how to amplify your promotional impact...');

-- Function to deduct credits from user balance
CREATE OR REPLACE FUNCTION public.deduct_user_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_description TEXT,
  p_reference_id TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  -- Get current balance
  SELECT credits_balance INTO current_balance 
  FROM public.user_credits 
  WHERE user_id = p_user_id;
  
  -- Check if user has sufficient credits
  IF current_balance IS NULL OR current_balance < p_amount THEN
    RETURN FALSE;
  END IF;
  
  -- Deduct credits
  UPDATE public.user_credits 
  SET credits_balance = credits_balance - p_amount,
      updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Record transaction
  INSERT INTO public.credit_transactions (user_id, amount, transaction_type, description, reference_id)
  VALUES (p_user_id, -p_amount, 'usage', p_description, p_reference_id);
  
  RETURN TRUE;
END;
$$;

-- Function to add credits to user balance
CREATE OR REPLACE FUNCTION public.add_user_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_description TEXT,
  p_reference_id TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Add credits (upsert in case user doesn't have a record yet)
  INSERT INTO public.user_credits (user_id, credits_balance, total_purchased)
  VALUES (p_user_id, p_amount, p_amount)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    credits_balance = user_credits.credits_balance + p_amount,
    total_purchased = user_credits.total_purchased + p_amount,
    updated_at = now();
  
  -- Record transaction
  INSERT INTO public.credit_transactions (user_id, amount, transaction_type, description, reference_id)
  VALUES (p_user_id, p_amount, 'purchase', p_description, p_reference_id);
  
  RETURN TRUE;
END;
$$;