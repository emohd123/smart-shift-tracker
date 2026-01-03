-- Complete admin role grant for emohd123@gmail.com
-- This migration ensures admin role is set in ALL required locations:
-- 1. profiles table (already updated)
-- 2. user_roles table (PRIMARY - used by frontend RPC) - if it exists
-- 3. auth.users metadata (for initial formatUser() consistency)

-- Step 1: Insert/update admin role in user_roles table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
    INSERT INTO user_roles (user_id, role)
    VALUES (
      (SELECT id FROM auth.users WHERE email = 'emohd123@gmail.com'),
      'admin'::app_role
    )
    ON CONFLICT (user_id, role) 
    DO UPDATE SET role = 'admin'::app_role;
    RAISE NOTICE 'user_roles table updated';
  ELSE
    RAISE NOTICE 'user_roles table does not exist, skipping';
  END IF;
END $$;

-- Step 2: Ensure profiles table has admin role (should already be set, but enforce it)
UPDATE profiles 
SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'emohd123@gmail.com');

-- Step 3: Update auth metadata for consistency with formatUser() initial load
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'emohd123@gmail.com';

-- Step 4: Verify all three locations have admin role
DO $$
DECLARE
  user_uuid UUID;
  profile_role TEXT;
  user_role_exists BOOLEAN;
  meta_role TEXT;
BEGIN
  -- Get user ID
  SELECT id INTO user_uuid FROM auth.users WHERE email = 'emohd123@gmail.com';
  
  IF user_uuid IS NULL THEN
    RAISE EXCEPTION 'User emohd123@gmail.com not found in auth.users';
  END IF;
  
  -- Check profiles table
  SELECT role INTO profile_role FROM profiles WHERE id = user_uuid;
  
  -- Check user_roles table
  SELECT EXISTS(
    SELECT 1 FROM user_roles WHERE user_id = user_uuid AND role = 'admin'
  ) INTO user_role_exists;
  
  -- Check auth metadata
  SELECT raw_user_meta_data->>'role' INTO meta_role FROM auth.users WHERE id = user_uuid;
  
  -- Report results
  RAISE NOTICE '=== Admin Grant Verification ===';
  RAISE NOTICE 'User ID: %', user_uuid;
  RAISE NOTICE 'profiles.role: %', COALESCE(profile_role, 'NULL');
  RAISE NOTICE 'user_roles has admin: %', user_role_exists;
  RAISE NOTICE 'auth.users metadata role: %', COALESCE(meta_role, 'NULL');
  
  -- Validate
  IF profile_role != 'admin' THEN
    RAISE EXCEPTION 'profiles.role is not admin: %', profile_role;
  END IF;
  
  IF NOT user_role_exists THEN
    RAISE EXCEPTION 'user_roles table does not have admin role for user';
  END IF;
  
  IF meta_role != 'admin' THEN
    RAISE WARNING 'auth.users metadata role is not admin: % (non-critical)', meta_role;
  END IF;
  
  RAISE NOTICE '✅ Admin role successfully granted in all locations!';
END $$;

-- Final verification query (run this to confirm)
SELECT 
  u.email,
  p.role as profile_role,
  ur.role as user_roles_role,
  u.raw_user_meta_data->>'role' as metadata_role
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'emohd123@gmail.com';
