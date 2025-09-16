-- MINIMAL FIX FOR IMMEDIATE PROMOTER ASSIGNMENT FUNCTIONALITY
-- Run this in Supabase Dashboard → SQL Editor if you want just the essential fix

-- =====================================
-- ADD ESSENTIAL MISSING COLUMNS ONLY
-- =====================================

-- Add the critical missing columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS unique_code TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS age INTEGER DEFAULT 25;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nationality TEXT DEFAULT 'Not specified';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Create index for performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_unique_code
ON public.profiles(unique_code) WHERE unique_code IS NOT NULL;

-- =====================================
-- UPDATE EXISTING PROFILES WITH CODES
-- =====================================

-- Update John Smith (Promoter 1)
UPDATE public.profiles SET
  unique_code = 'USRNEUHC',
  age = 25,
  nationality = 'Test Country',
  phone_number = '+1-555-0101'
WHERE email = 'promoter1@test.com' AND full_name = 'John Smith';

-- Update Sarah Wilson (Promoter 2)
UPDATE public.profiles SET
  unique_code = 'USR7JMF5',
  age = 25,
  nationality = 'Test Country',
  phone_number = '+1-555-0102'
WHERE email = 'promoter2@test.com' AND full_name = 'Sarah Wilson';

-- Update Test Company
UPDATE public.profiles SET
  unique_code = 'USRB96Q6',
  age = 35,
  nationality = 'Test Country',
  phone_number = '+1-555-0100'
WHERE email = 'company1@test.com' AND full_name = 'Test Company';

-- =====================================
-- CREATE BASIC UNIQUE CODE GENERATOR
-- =====================================

-- Function to generate unique codes for new profiles
CREATE OR REPLACE FUNCTION public.generate_unique_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate random 8-character code
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

-- Trigger function to auto-generate unique codes for new profiles
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

-- Add trigger for auto-generating unique codes
DROP TRIGGER IF EXISTS trigger_ensure_unique_code ON public.profiles;
CREATE TRIGGER trigger_ensure_unique_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_unique_code();

-- =====================================
-- TEST THE FIX
-- =====================================

-- Verify the updates worked
SELECT 
  full_name,
  unique_code,
  role,
  verification_status,
  age,
  nationality,
  phone_number
FROM public.profiles 
WHERE role IN ('part_timer', 'promoter', 'company_admin')
ORDER BY role, full_name;

-- Test promoter query that frontend uses
SELECT 
  id,
  unique_code,
  full_name,
  age,
  nationality,
  phone_number,
  role,
  verification_status
FROM public.profiles 
WHERE role IN ('part_timer', 'promoter')
AND verification_status = 'approved'
ORDER BY full_name;

-- Success message
SELECT '🎉 MINIMAL FIX APPLIED SUCCESSFULLY!' as status,
       'Promoter assignment should now work!' as result;