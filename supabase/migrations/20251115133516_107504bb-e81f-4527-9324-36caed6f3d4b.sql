-- Approve all existing pending promoters
UPDATE profiles 
SET verification_status = 'approved' 
WHERE role = 'promoter' AND verification_status = 'pending';

-- Update the handle_new_user trigger to auto-approve promoters
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert profile with data from user metadata
  INSERT INTO public.profiles (
    id, 
    full_name, 
    email,
    phone_number,
    nationality,
    age,
    gender,
    height,
    weight,
    is_student,
    address,
    bank_details,
    role,
    verification_status
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'fullName'),
    NEW.email,
    NEW.raw_user_meta_data->>'phone_number',
    NEW.raw_user_meta_data->>'nationality',
    (NEW.raw_user_meta_data->>'age')::integer,
    NEW.raw_user_meta_data->>'gender',
    (NEW.raw_user_meta_data->>'height')::numeric,
    (NEW.raw_user_meta_data->>'weight')::numeric,
    COALESCE((NEW.raw_user_meta_data->>'is_student')::boolean, (NEW.raw_user_meta_data->>'isStudent')::boolean, false),
    NEW.raw_user_meta_data->>'address',
    NEW.raw_user_meta_data->>'bank_details',
    COALESCE(NEW.raw_user_meta_data->>'role', 'promoter'),
    -- Auto-approve promoters, keep others pending
    CASE 
      WHEN COALESCE(NEW.raw_user_meta_data->>'role', 'promoter') = 'promoter' 
      THEN 'approved'
      ELSE 'pending'
    END
  );
  
  -- Insert user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'promoter'::app_role)
  );
  
  RETURN NEW;
END;
$$;