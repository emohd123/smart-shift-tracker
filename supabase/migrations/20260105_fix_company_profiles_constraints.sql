-- Fix NOT NULL constraints on company_profiles table
-- These constraints prevent updates when fields are optional in the form

-- Make registration_id nullable (some companies may not have CR yet)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'company_profiles'
    AND column_name = 'registration_id'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.company_profiles ALTER COLUMN registration_id DROP NOT NULL;
  END IF;
END $$;

-- Make address nullable (optional field in form)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'company_profiles'
    AND column_name = 'address'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.company_profiles ALTER COLUMN address DROP NOT NULL;
  END IF;
END $$;
