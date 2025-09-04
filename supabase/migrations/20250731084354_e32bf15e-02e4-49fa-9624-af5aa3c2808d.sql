-- Fix function search path security warnings
-- Update existing functions to have proper search_path settings

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

-- Fix delete_user_time_logs function
CREATE OR REPLACE FUNCTION public.delete_user_time_logs(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Delete all time logs for the specified user
  DELETE FROM public.time_logs WHERE user_id = user_id_param;
END;
$function$;

-- Fix log_certificate_verification function
CREATE OR REPLACE FUNCTION public.log_certificate_verification(ref_number text, ip_address text, user_agent text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  verification_record JSONB;
BEGIN
  -- Create the verification record
  verification_record = jsonb_build_object(
    'timestamp', now(),
    'ip_address', ip_address,
    'user_agent', user_agent
  );
  
  -- Add the record to the verification_logs array
  UPDATE public.certificates 
  SET verification_logs = verification_logs || verification_record
  WHERE reference_number = ref_number;
END;
$function$;

-- Fix delete_user function
CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Delete user's profile data
  DELETE FROM public.profiles WHERE id = auth.uid();
  
  -- Delete user from auth.users
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$function$;

-- Fix is_certificate_valid function
CREATE OR REPLACE FUNCTION public.is_certificate_valid(ref_number text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  is_valid BOOLEAN;
  cert_record RECORD;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.certificates 
    WHERE reference_number = ref_number
    AND (expiration_date IS NULL OR expiration_date > CURRENT_DATE)
    AND status = 'approved'
  ) INTO is_valid;
  
  RETURN is_valid;
END;
$function$;