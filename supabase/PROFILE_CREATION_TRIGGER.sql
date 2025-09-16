-- PROFILE CREATION TRIGGER - Ensures profiles are created when users sign up
-- This fixes the issue where auth.users exist but profiles table is empty

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create enhanced function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  user_name TEXT;
  user_email TEXT;
BEGIN
  -- Extract user details from the new auth user
  user_email := NEW.email;
  user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(user_email, '@', 1));
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'part_timer');

  -- Insert new profile with enhanced data
  INSERT INTO public.profiles (
    id, 
    tenant_id,
    email, 
    full_name, 
    role,
    unique_code,
    nationality,
    age,
    phone_number,
    gender,
    height,
    weight,
    is_student,
    address,
    bank_details,
    id_card_url,
    profile_photo_url,
    verification_status,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.id, -- Use user ID as tenant_id for now
    user_email,
    user_name,
    user_role,
    public.generate_unique_user_code(), -- Auto-generate unique code
    COALESCE(NEW.raw_user_meta_data->>'nationality', ''),
    COALESCE((NEW.raw_user_meta_data->>'age')::INTEGER, NULL),
    COALESCE(NEW.raw_user_meta_data->>'phone_number', NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'gender', 'Male'),
    COALESCE((NEW.raw_user_meta_data->>'height')::NUMERIC, NULL),
    COALESCE((NEW.raw_user_meta_data->>'weight')::NUMERIC, NULL),
    COALESCE((NEW.raw_user_meta_data->>'is_student')::BOOLEAN, false),
    COALESCE(NEW.raw_user_meta_data->>'address', ''),
    COALESCE(NEW.raw_user_meta_data->>'bank_details', ''),
    COALESCE(NEW.raw_user_meta_data->>'id_card_url', ''),
    COALESCE(NEW.raw_user_meta_data->>'profile_photo_url', ''),
    'pending',
    NOW(),
    NOW()
  );
  
  -- Log the profile creation for debugging
  INSERT INTO public.activity_logs (
    user_id,
    activity_type,
    description,
    metadata,
    created_at
  ) VALUES (
    NEW.id,
    'profile_created',
    'Profile automatically created for new user',
    jsonb_build_object(
      'email', user_email,
      'role', user_role,
      'trigger', 'handle_new_user'
    ),
    NOW()
  ) ON CONFLICT DO NOTHING; -- In case activity_logs doesn't exist yet

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create function to backfill missing profiles for existing auth users
CREATE OR REPLACE FUNCTION public.backfill_missing_profiles()
RETURNS INTEGER AS $$
DECLARE
  missing_count INTEGER := 0;
  auth_user RECORD;
  user_role TEXT;
  user_name TEXT;
BEGIN
  -- Find auth users without corresponding profiles
  FOR auth_user IN 
    SELECT au.id, au.email, au.raw_user_meta_data, au.created_at
    FROM auth.users au
    LEFT JOIN public.profiles p ON au.id = p.id
    WHERE p.id IS NULL
  LOOP
    -- Extract user details
    user_name := COALESCE(auth_user.raw_user_meta_data->>'full_name', auth_user.raw_user_meta_data->>'name', split_part(auth_user.email, '@', 1));
    user_role := COALESCE(auth_user.raw_user_meta_data->>'role', 'part_timer');
    
    -- Create missing profile
    INSERT INTO public.profiles (
      id, 
      tenant_id,
      email, 
      full_name, 
      role,
      unique_code,
      nationality,
      age,
      phone_number,
      gender,
      height,
      weight,
      is_student,
      address,
      bank_details,
      id_card_url,
      profile_photo_url,
      verification_status,
      created_at,
      updated_at
    ) VALUES (
      auth_user.id,
      auth_user.id, -- Use user ID as tenant_id
      auth_user.email,
      user_name,
      user_role,
      public.generate_unique_user_code(),
      COALESCE(auth_user.raw_user_meta_data->>'nationality', ''),
      COALESCE((auth_user.raw_user_meta_data->>'age')::INTEGER, NULL),
      COALESCE(auth_user.raw_user_meta_data->>'phone_number', auth_user.raw_user_meta_data->>'phone', ''),
      COALESCE(auth_user.raw_user_meta_data->>'gender', 'Male'),
      COALESCE((auth_user.raw_user_meta_data->>'height')::NUMERIC, NULL),
      COALESCE((auth_user.raw_user_meta_data->>'weight')::NUMERIC, NULL),
      COALESCE((auth_user.raw_user_meta_data->>'is_student')::BOOLEAN, false),
      COALESCE(auth_user.raw_user_meta_data->>'address', ''),
      COALESCE(auth_user.raw_user_meta_data->>'bank_details', ''),
      COALESCE(auth_user.raw_user_meta_data->>'id_card_url', ''),
      COALESCE(auth_user.raw_user_meta_data->>'profile_photo_url', ''),
      'pending',
      auth_user.created_at,
      NOW()
    );
    
    missing_count := missing_count + 1;
  END LOOP;
  
  RETURN missing_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the backfill function to create profiles for existing users
SELECT public.backfill_missing_profiles() as profiles_created;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_unique_user_code() TO authenticated;
GRANT EXECUTE ON FUNCTION public.backfill_missing_profiles() TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates profile when new user signs up via auth.users trigger';
COMMENT ON FUNCTION public.backfill_missing_profiles() IS 'Creates profiles for existing auth users who dont have profiles yet';

-- Refresh schema
NOTIFY pgrst, 'reload schema';
