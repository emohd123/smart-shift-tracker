-- Fix function search path security issues
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

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON public.certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON public.certificates(status);
CREATE INDEX IF NOT EXISTS idx_certificates_reference_number ON public.certificates(reference_number);
CREATE INDEX IF NOT EXISTS idx_shifts_date ON public.shifts(date);
CREATE INDEX IF NOT EXISTS idx_time_logs_user_id ON public.time_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_shift_id ON public.time_logs(shift_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON public.messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Ensure all tables have proper updated_at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers where missing
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payouts_updated_at
    BEFORE UPDATE ON public.payouts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();