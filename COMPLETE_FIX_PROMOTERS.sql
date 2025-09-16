-- COMPLETE FIX FOR PROMOTERS LOADING ISSUE
-- Run this SQL in Supabase Dashboard → SQL Editor

-- =====================================
-- 1. FIX INFINITE RECURSION IN RLS POLICIES
-- =====================================

-- The tenant_memberships table has recursive policies causing infinite loops
-- Let's simplify the profiles table policies to not depend on tenant_memberships

-- Drop problematic policies on profiles table
DROP POLICY IF EXISTS "profiles_select_tenant" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

-- Create simple, non-recursive policies for profiles
CREATE POLICY "profiles_select_simple"
  ON public.profiles FOR SELECT
  USING (true); -- Allow all users to read profiles (for now)

CREATE POLICY "profiles_insert_simple"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_simple"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- =====================================
-- 2. ADD MISSING UNIQUE_CODE COLUMN
-- =====================================

-- Add unique_code column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS unique_code TEXT;

-- Add other missing columns that might be needed
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS age INTEGER DEFAULT 25;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nationality TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Create unique index on unique_code
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_unique_code
ON public.profiles(unique_code) WHERE unique_code IS NOT NULL;

-- =====================================
-- 3. UPDATE EXISTING PROFILES WITH UNIQUE CODES
-- =====================================

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

-- =====================================
-- 4. CREATE TRIGGER FOR NEW PROFILES
-- =====================================

-- Function to generate unique codes
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

-- Trigger function to auto-generate unique codes
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
-- 5. TEST THE FIX
-- =====================================

-- Verify the updates worked
SELECT 
  full_name,
  email,
  role,
  verification_status,
  unique_code,
  age,
  nationality
FROM public.profiles 
WHERE role IN ('part_timer', 'promoter', 'company_admin')
ORDER BY role, full_name;

-- Test the promoters query that the frontend uses
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

-- Show summary
SELECT 
  'Total profiles' as metric,
  count(*) as count
FROM public.profiles
UNION ALL
SELECT 
  'Part-timer profiles' as metric,
  count(*) as count
FROM public.profiles 
WHERE role IN ('part_timer', 'promoter')
UNION ALL
SELECT 
  'Approved promoters' as metric,
  count(*) as count
FROM public.profiles 
WHERE role IN ('part_timer', 'promoter') 
AND verification_status = 'approved'
UNION ALL
SELECT 
  'Profiles with unique codes' as metric,
  count(*) as count
FROM public.profiles 
WHERE unique_code IS NOT NULL;