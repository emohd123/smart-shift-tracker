-- Fix profiles table schema to support promoter data loading
-- This migration adds missing columns that are expected by the frontend usePromoters hook

-- Add missing columns to profiles table
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

-- Create unique index on unique_code (allowing NULL values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_unique_code 
ON public.profiles(unique_code) 
WHERE unique_code IS NOT NULL;

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role_verification 
ON public.profiles(role, verification_status);

CREATE INDEX IF NOT EXISTS idx_profiles_nationality 
ON public.profiles(nationality);

CREATE INDEX IF NOT EXISTS idx_profiles_age 
ON public.profiles(age);

-- Function to generate unique codes for existing users
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

-- Function to migrate user metadata to profile columns
CREATE OR REPLACE FUNCTION public.migrate_user_metadata_to_profiles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_record RECORD;
  metadata JSONB;
BEGIN
  -- Iterate through all profiles that need metadata migration
  FOR user_record IN 
    SELECT p.id, u.raw_user_meta_data 
    FROM public.profiles p
    JOIN auth.users u ON p.id = u.id
    WHERE p.unique_code IS NULL 
    OR p.age = 25 -- Default value indicates unmigrated data
    OR p.nationality = '' -- Default value indicates unmigrated data
  LOOP
    metadata := user_record.raw_user_meta_data;
    
    -- Update profile with metadata, using defaults for missing values
    UPDATE public.profiles 
    SET 
      age = COALESCE((metadata->>'age')::INTEGER, 25),
      nationality = COALESCE(metadata->>'nationality', ''),
      phone_number = CASE 
        WHEN metadata->>'phone_number' = 'null' OR metadata->>'phone_number' = '' 
        THEN NULL 
        ELSE metadata->>'phone_number' 
      END,
      gender = COALESCE(metadata->>'gender', 'Male'),
      height = COALESCE((metadata->>'height')::INTEGER, 170),
      weight = COALESCE((metadata->>'weight')::INTEGER, 70),
      address = COALESCE(metadata->>'address', ''),
      is_student = COALESCE((metadata->>'is_student')::BOOLEAN, false),
      bank_details = CASE 
        WHEN metadata->>'bank_details' = 'null' OR metadata->>'bank_details' = '' 
        THEN NULL 
        ELSE metadata->>'bank_details' 
      END,
      unique_code = COALESCE(
        metadata->>'unique_code',
        generate_unique_code()
      ),
      id_card_url = CASE 
        WHEN metadata->>'id_card_url' = 'null' OR metadata->>'id_card_url' = '' 
        THEN NULL 
        ELSE metadata->>'id_card_url' 
      END,
      profile_photo_url = CASE 
        WHEN metadata->>'profile_photo_url' = 'null' OR metadata->>'profile_photo_url' = '' 
        THEN NULL 
        ELSE metadata->>'profile_photo_url' 
      END,
      updated_at = now()
    WHERE id = user_record.id;
  END LOOP;
  
  -- Ensure all profiles have unique codes
  UPDATE public.profiles 
  SET unique_code = generate_unique_code(), updated_at = now()
  WHERE unique_code IS NULL;
  
  RAISE NOTICE 'Successfully migrated user metadata to profiles table';
END;
$$;

-- Run the migration
SELECT public.migrate_user_metadata_to_profiles();

-- Create trigger to auto-generate unique codes for new profiles
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

-- Update RLS policies to handle the new columns
DROP POLICY IF EXISTS "profiles_select_tenant" ON public.profiles;
CREATE POLICY "profiles_select_tenant"
  ON public.profiles FOR SELECT
  USING (
    id = auth.uid() OR
    tenant_id IN (
      SELECT tenant_id 
      FROM public.tenant_memberships 
      WHERE user_id = auth.uid() 
      AND status = 'active'
    ) OR
    -- Allow companies to see part-timer profiles for assignment
    (
      role IN ('part_timer', 'promoter') 
      AND verification_status = 'approved'
      AND EXISTS (
        SELECT 1 
        FROM public.tenant_memberships 
        WHERE user_id = auth.uid() 
        AND role IN ('company_admin', 'company_manager')
        AND status = 'active'
      )
    )
  );

-- Add policy to allow promoters to be discoverable by companies via unique code
CREATE POLICY IF NOT EXISTS "profiles_select_by_unique_code"
  ON public.profiles FOR SELECT
  USING (
    role IN ('part_timer', 'promoter') 
    AND verification_status = 'approved'
    AND unique_code IS NOT NULL
  );

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.generate_unique_code() TO authenticated;
GRANT EXECUTE ON FUNCTION public.migrate_user_metadata_to_profiles() TO authenticated;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.unique_code IS 'Unique 8-character code for easy company identification of promoters';
COMMENT ON COLUMN public.profiles.age IS 'User age in years (16-80)';
COMMENT ON COLUMN public.profiles.nationality IS 'User nationality/citizenship';
COMMENT ON COLUMN public.profiles.phone_number IS 'User contact phone number';
COMMENT ON COLUMN public.profiles.gender IS 'User gender (Male/Female/Other)';
COMMENT ON COLUMN public.profiles.height IS 'User height in centimeters (120-250)';
COMMENT ON COLUMN public.profiles.weight IS 'User weight in kilograms (40-200)';
COMMENT ON COLUMN public.profiles.address IS 'User residential address';
COMMENT ON COLUMN public.profiles.is_student IS 'Whether user is currently a student';
COMMENT ON COLUMN public.profiles.bank_details IS 'User banking information for payments';
COMMENT ON COLUMN public.profiles.id_card_url IS 'URL to uploaded ID card document';
COMMENT ON COLUMN public.profiles.profile_photo_url IS 'URL to uploaded profile photo';

COMMENT ON FUNCTION public.generate_unique_code() IS 'Generates a unique 8-character alphanumeric code for promoter identification';
COMMENT ON FUNCTION public.migrate_user_metadata_to_profiles() IS 'Migrates user metadata from auth.users to profiles table columns';
COMMENT ON FUNCTION public.ensure_unique_code() IS 'Trigger function to auto-generate unique codes for new profiles';