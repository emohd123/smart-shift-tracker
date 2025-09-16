-- Add unique_code column and fix promoters loading issue
-- Migration: 20250915000000_add_unique_code_column.sql

-- 1. Add missing columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS unique_code TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS age INTEGER DEFAULT 25;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nationality TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- 2. Create unique index on unique_code
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_unique_code
ON public.profiles(unique_code) WHERE unique_code IS NOT NULL;

-- 3. Update existing profiles with their unique codes
-- Update John Smith with his unique code
UPDATE public.profiles 
SET unique_code = 'USRNEUHC',
    age = 25,
    nationality = 'Test Country'
WHERE email = 'promoter1@test.com' AND full_name = 'John Smith';

-- Update Sarah Wilson with her unique code  
UPDATE public.profiles 
SET unique_code = 'USR7JMF5',
    age = 25,
    nationality = 'Test Country'
WHERE email = 'promoter2@test.com' AND full_name = 'Sarah Wilson';

-- Update Test Company with its unique code
UPDATE public.profiles 
SET unique_code = 'USRB96Q6',
    age = 30,
    nationality = 'Test Country'
WHERE email = 'company1@test.com' AND full_name = 'Test Company';

-- 4. Create function to generate unique codes
CREATE OR REPLACE FUNCTION public.generate_unique_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate random 8-character alphanumeric code (uppercase)
    new_code := 'USR' || upper(substring(md5(random()::text) from 1 for 5));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE unique_code = new_code) INTO code_exists;
    
    -- Exit loop if code is unique
    IF NOT code_exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN new_code;
END;
$$;

-- 5. Create trigger function to auto-generate unique codes
CREATE OR REPLACE FUNCTION public.ensure_unique_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Generate unique code if not provided
  IF NEW.unique_code IS NULL THEN
    NEW.unique_code := generate_unique_code();
  END IF;
  
  RETURN NEW;
END;
$$;

-- 6. Add trigger for auto-generating unique codes
DROP TRIGGER IF EXISTS trigger_ensure_unique_code ON public.profiles;
CREATE TRIGGER trigger_ensure_unique_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_unique_code();