-- ENHANCED PROFILES TABLE - Add missing fields from signup form
-- Run this in Supabase SQL Editor after SCHEMA_OPTIMIZATION.sql

-- Add missing columns to profiles table for complete user data storage
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS nationality TEXT,
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'Male',
ADD COLUMN IF NOT EXISTS height NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS weight NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS is_student BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS bank_details TEXT,
ADD COLUMN IF NOT EXISTS id_card_url TEXT,
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT,
ADD COLUMN IF NOT EXISTS unique_code TEXT;

-- Add constraints for data integrity
ALTER TABLE public.profiles 
ADD CONSTRAINT check_age_valid CHECK (age IS NULL OR age >= 16),
ADD CONSTRAINT check_height_valid CHECK (height IS NULL OR height > 0),
ADD CONSTRAINT check_weight_valid CHECK (weight IS NULL OR weight > 0),
ADD CONSTRAINT check_gender_valid CHECK (gender IN ('Male', 'Female', 'Other'));

-- Create unique index for unique_code when it's not null
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_unique_code ON public.profiles(unique_code) WHERE unique_code IS NOT NULL;

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_profiles_nationality ON public.profiles(nationality);
CREATE INDEX IF NOT EXISTS idx_profiles_age ON public.profiles(age);
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON public.profiles(gender);
CREATE INDEX IF NOT EXISTS idx_profiles_is_student ON public.profiles(is_student);

-- Add RLS policies for profile file access (if using Supabase Storage)
-- These ensure users can only access their own uploaded files
DO $$
BEGIN
    -- Policy for profile photos bucket access
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can view their own profile files'
    ) THEN
        -- Note: This policy would be for storage.objects table
        -- The actual implementation depends on your storage bucket setup
        -- CREATE POLICY "Users can view their own profile files" ON storage.objects 
        -- FOR SELECT USING (bucket_id = 'profiles' AND auth.uid()::text = (storage.foldername(name))[1]);
        
        -- For now, we'll add a comment placeholder
        -- Uncomment and modify the above policy based on your storage bucket structure
    END IF;
END $$;

-- Update existing profiles to have default values for new columns
UPDATE public.profiles 
SET 
  nationality = COALESCE(nationality, ''),
  age = COALESCE(age, 25),
  gender = COALESCE(gender, 'Male'),
  height = COALESCE(height, 0),
  weight = COALESCE(weight, 0),
  is_student = COALESCE(is_student, false),
  address = COALESCE(address, ''),
  bank_details = COALESCE(bank_details, '')
WHERE nationality IS NULL 
   OR age IS NULL 
   OR gender IS NULL 
   OR height IS NULL 
   OR weight IS NULL 
   OR is_student IS NULL 
   OR address IS NULL 
   OR bank_details IS NULL;

-- Create function to generate unique codes for users
CREATE OR REPLACE FUNCTION public.generate_unique_user_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 8-character code
    new_code := 'USR' || UPPER(substr(md5(random()::text), 1, 5));
    
    -- Check if this code already exists
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE unique_code = new_code) INTO code_exists;
    
    -- If code doesn't exist, we can use it
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-generate unique codes for new profiles
CREATE OR REPLACE FUNCTION public.set_profile_unique_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set unique_code if it's null
  IF NEW.unique_code IS NULL THEN
    NEW.unique_code = public.generate_unique_user_code();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new profiles
DROP TRIGGER IF EXISTS trigger_set_profile_unique_code ON public.profiles;
CREATE TRIGGER trigger_set_profile_unique_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_profile_unique_code();

-- Update existing profiles without unique codes
UPDATE public.profiles 
SET unique_code = public.generate_unique_user_code()
WHERE unique_code IS NULL;

-- Create view for complete profile data (optional - for easier querying)
CREATE OR REPLACE VIEW public.complete_profiles AS
SELECT 
  p.id,
  p.tenant_id,
  p.full_name,
  p.email,
  p.role,
  p.unique_code,
  p.nationality,
  p.age,
  p.phone_number,
  p.gender,
  p.height,
  p.weight,
  p.is_student,
  p.address,
  p.bank_details,
  p.id_card_url,
  p.profile_photo_url,
  p.verification_status,
  p.created_at,
  p.updated_at,
  -- Derived fields
  CASE 
    WHEN p.profile_photo_url IS NOT NULL THEN true 
    ELSE false 
  END as has_profile_photo,
  CASE 
    WHEN p.id_card_url IS NOT NULL THEN true 
    ELSE false 
  END as has_id_card,
  CASE 
    WHEN p.full_name != '' AND p.nationality != '' AND p.address != '' THEN true 
    ELSE false 
  END as profile_complete
FROM public.profiles p;

-- Grant access to the view
GRANT SELECT ON public.complete_profiles TO authenticated;

-- Add RLS policy for the view
ALTER VIEW public.complete_profiles SET (security_invoker = on);

-- Add helpful comments
COMMENT ON TABLE public.profiles IS 'Extended user profiles with complete signup form data';
COMMENT ON COLUMN public.profiles.unique_code IS 'Auto-generated unique identifier for users';
COMMENT ON COLUMN public.profiles.nationality IS 'User nationality from signup form';
COMMENT ON COLUMN public.profiles.age IS 'User age from signup form';
COMMENT ON COLUMN public.profiles.phone_number IS 'Optional phone number from signup form';
COMMENT ON COLUMN public.profiles.gender IS 'User gender selection';
COMMENT ON COLUMN public.profiles.height IS 'User height in cm';
COMMENT ON COLUMN public.profiles.weight IS 'User weight in kg';
COMMENT ON COLUMN public.profiles.is_student IS 'Student status checkbox from signup';
COMMENT ON COLUMN public.profiles.address IS 'User address from signup form';
COMMENT ON COLUMN public.profiles.bank_details IS 'Optional bank details for payments';
COMMENT ON COLUMN public.profiles.id_card_url IS 'URL to uploaded ID card document';
COMMENT ON COLUMN public.profiles.profile_photo_url IS 'URL to uploaded profile photo';

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
