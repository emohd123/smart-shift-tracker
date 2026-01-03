-- Grant admin role to emohd123@gmail.com
-- Updates profiles.role directly

DO $$
DECLARE
  user_uuid uuid;
BEGIN
  -- Get the user ID from auth.users
  SELECT id INTO user_uuid
  FROM auth.users
  WHERE email = 'emohd123@gmail.com';

  IF user_uuid IS NOT NULL THEN
    -- Update profile role directly
    UPDATE profiles
    SET role = 'admin'
    WHERE id = user_uuid;

    RAISE NOTICE 'Admin role granted to emohd123@gmail.com (%)', user_uuid;
  ELSE
    RAISE EXCEPTION 'User emohd123@gmail.com not found';
  END IF;
END $$;
