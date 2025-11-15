-- Add missing field to shifts table
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS is_paid boolean DEFAULT false;

-- Create company_profiles table
CREATE TABLE IF NOT EXISTS public.company_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  name text NOT NULL,
  website text,
  registration_id text,
  address text,
  logo_url text,
  description text,
  industry text,
  company_size text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Companies can view their own profile"
ON public.company_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Companies can update their own profile"
ON public.company_profiles FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all company profiles"
ON public.company_profiles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Add missing training module fields
ALTER TABLE public.training_modules ADD COLUMN IF NOT EXISTS estimated_duration text;
ALTER TABLE public.training_modules ADD COLUMN IF NOT EXISTS price_credits integer DEFAULT 0;
ALTER TABLE public.training_modules ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.training_modules ADD COLUMN IF NOT EXISTS skills_covered text[];
ALTER TABLE public.training_modules ADD COLUMN IF NOT EXISTS preview_content text;