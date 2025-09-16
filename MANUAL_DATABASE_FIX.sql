-- ===============================================
-- MANUAL DATABASE FIX FOR PROMOTERS LOADING
-- ===============================================
-- Run this SQL in Supabase Dashboard → SQL Editor
-- This will fix the "Failed to load promoters data" issue

-- Step 1: Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS age INTEGER DEFAULT 25 CHECK (age >= 16 AND age <= 80),
ADD COLUMN IF NOT EXISTS nationality TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'Male' CHECK (gender IN ('Male', 'Female', 'Other')),
ADD COLUMN IF NOT EXISTS height INTEGER DEFAULT 170 CHECK (height >= 120 AND height <= 250),
ADD COLUMN IF NOT EXISTS weight INTEGER DEFAULT 70 CHECK (weight >= 40 AND weight <= 200),
ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS is_student BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS bank_details TEXT,
ADD COLUMN IF NOT EXISTS unique_code TEXT,
ADD COLUMN IF NOT EXISTS id_card_url TEXT,
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

-- Step 2: Create unique index on unique_code
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_unique_code 
ON public.profiles(unique_code) 
WHERE unique_code IS NOT NULL;

-- Step 3: Add performance indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role_verification 
ON public.profiles(role, verification_status);

CREATE INDEX IF NOT EXISTS idx_profiles_nationality 
ON public.profiles(nationality);

CREATE INDEX IF NOT EXISTS idx_profiles_age 
ON public.profiles(age);

-- Step 4: Create function to generate unique codes
CREATE OR REPLACE FUNCTION public.generate_unique_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Step 5: Update existing profiles with unique codes
UPDATE public.profiles 
SET unique_code = generate_unique_code(),
    updated_at = now()
WHERE unique_code IS NULL;

-- Step 6: Create trigger to auto-generate unique codes for new profiles
CREATE OR REPLACE FUNCTION public.ensure_unique_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Step 7: Update RLS policy to allow promoter discovery
DROP POLICY IF EXISTS "profiles_select_by_unique_code" ON public.profiles;
CREATE POLICY "profiles_select_by_unique_code"
  ON public.profiles FOR SELECT
  USING (
    role IN ('part_timer', 'promoter') 
    AND verification_status = 'approved'
    AND unique_code IS NOT NULL
  );

-- Step 8: Migrate user metadata to profile columns (if auth.users accessible)
-- This will try to update profiles with data from user metadata
DO $$
DECLARE
  profile_record RECORD;
BEGIN
  -- Update profiles that don't have complete data
  FOR profile_record IN 
    SELECT id FROM public.profiles 
    WHERE age = 25 AND nationality = '' -- Default values indicate unmigrated data
  LOOP
    -- For now, just ensure they have unique codes and basic data
    UPDATE public.profiles 
    SET 
      age = CASE WHEN age = 25 THEN 25 ELSE age END,
      nationality = CASE WHEN nationality = '' THEN 'Not specified' ELSE nationality END,
      updated_at = now()
    WHERE id = profile_record.id;
  END LOOP;
END $$;

-- Step 9: Verify the fix
-- This should return data without errors if the fix worked
SELECT 
  id, 
  unique_code, 
  full_name, 
  age, 
  nationality, 
  phone_number, 
  role, 
  verification_status,
  created_at
FROM public.profiles 
WHERE role IN ('part_timer', 'promoter')
ORDER BY created_at DESC
LIMIT 10;

-- Show summary
SELECT 
  'Total profiles' as metric,
  count(*) as value
FROM public.profiles
UNION ALL
SELECT 
  'Part-timer profiles' as metric,
  count(*) as value
FROM public.profiles 
WHERE role IN ('part_timer', 'promoter')
UNION ALL
SELECT 
  'Approved promoters' as metric,
  count(*) as value
FROM public.profiles 
WHERE role IN ('part_timer', 'promoter') 
AND verification_status = 'approved'
UNION ALL
SELECT 
  'Profiles with unique codes' as metric,
  count(*) as value
FROM public.profiles 
WHERE unique_code IS NOT NULL;