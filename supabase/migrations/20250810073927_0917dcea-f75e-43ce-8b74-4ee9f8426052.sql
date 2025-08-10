-- 1) Fix security issue: run the view under invoker rights (Postgres 15+)
-- If the server supports it, this will update the existing view options without needing the full definition
DO $$
BEGIN
  -- Attempt to set security_invoker on the view; if the view doesn't exist, do nothing
  IF EXISTS (
    SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'shifts_with_stats'
  ) THEN
    EXECUTE 'ALTER VIEW public.shifts_with_stats SET (security_invoker = on)';
  END IF;
EXCEPTION WHEN others THEN
  -- If ALTER VIEW is not supported in current Postgres version, leave a note in the migration log
  RAISE NOTICE 'Could not set security_invoker on public.shifts_with_stats: %', SQLERRM;
END $$;

-- 2) Company profiles table
CREATE TABLE IF NOT EXISTS public.company_profiles (
  user_id uuid NOT NULL PRIMARY KEY,
  name text NOT NULL,
  website text,
  logo_url text,
  registration_id text NOT NULL,
  address text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ BEGIN
  -- View own company profile
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'company_profiles' AND policyname = 'Users can view own company profile'
  ) THEN
    CREATE POLICY "Users can view own company profile"
    ON public.company_profiles
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;

  -- Admins can view all
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'company_profiles' AND policyname = 'Admins can view all company profiles'
  ) THEN
    CREATE POLICY "Admins can view all company profiles"
    ON public.company_profiles
    FOR SELECT
    USING (is_admin());
  END IF;

  -- Users can insert own profile
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'company_profiles' AND policyname = 'Users can insert own company profile'
  ) THEN
    CREATE POLICY "Users can insert own company profile"
    ON public.company_profiles
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Users can update own profile
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'company_profiles' AND policyname = 'Users can update own company profile'
  ) THEN
    CREATE POLICY "Users can update own company profile"
    ON public.company_profiles
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Unique registration/tax id to prevent duplicates
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname = 'company_profiles' AND c.conname = 'company_profiles_registration_id_key'
  ) THEN
    ALTER TABLE public.company_profiles
    ADD CONSTRAINT company_profiles_registration_id_key UNIQUE (registration_id);
  END IF;
END $$;

-- Timestamps trigger for updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_company_profiles_updated_at'
  ) THEN
    CREATE TRIGGER trg_company_profiles_updated_at
    BEFORE UPDATE ON public.company_profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- 3) Storage bucket for company logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('company_logos', 'company_logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DO $$ BEGIN
  -- Public read access to company logos
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public can view company logos'
  ) THEN
    CREATE POLICY "Public can view company logos"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'company_logos');
  END IF;

  -- Users can upload their own logo under folder userId/
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can upload their own company logo'
  ) THEN
    CREATE POLICY "Users can upload their own company logo"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
      bucket_id = 'company_logos'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;

  -- Users can update their own logo
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can update their own company logo'
  ) THEN
    CREATE POLICY "Users can update their own company logo"
    ON storage.objects
    FOR UPDATE
    USING (
      bucket_id = 'company_logos'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;