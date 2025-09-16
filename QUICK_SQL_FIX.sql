-- Quick SQL Fix for Unique Codes Display
-- Run this in Supabase Dashboard → SQL Editor

-- 1. Add unique_code column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS unique_code TEXT;

-- 2. Create unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_unique_code
ON public.profiles(unique_code) WHERE unique_code IS NOT NULL;

-- 3. Update existing profiles with their unique codes from metadata
-- (This uses the specific codes we found)

-- Update John Smith with his unique code
UPDATE public.profiles 
SET unique_code = 'USRNEUHC'
WHERE email = 'promoter1@test.com' AND full_name = 'John Smith';

-- Update Sarah Wilson with her unique code  
UPDATE public.profiles 
SET unique_code = 'USR7JMF5'
WHERE email = 'promoter2@test.com' AND full_name = 'Sarah Wilson';

-- Update Test Company with its unique code
UPDATE public.profiles 
SET unique_code = 'USRB96Q6'
WHERE email = 'company1@test.com' AND full_name = 'Test Company';

-- 4. Verify the updates
SELECT 
  full_name,
  email,
  role,
  verification_status,
  unique_code
FROM public.profiles 
WHERE role IN ('part_timer', 'promoter', 'company_admin')
ORDER BY role, full_name;