-- Fix the remaining function search path issue
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    full_name,
    nationality,
    age,
    phone_number,
    gender,
    height,
    weight,
    is_student,
    address,
    role,
    verification_status
  )
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    '',
    18,
    NULL,
    'Male',
    170,
    70,
    false,
    '',
    'promoter',
    'pending'
  );
  RETURN NEW;
END;
$$;