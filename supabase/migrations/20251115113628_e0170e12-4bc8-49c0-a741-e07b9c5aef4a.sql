-- Fix Security Issue 1: Enable RLS on certificate_verifications table
ALTER TABLE public.certificate_verifications ENABLE ROW LEVEL SECURITY;

-- Add RLS policy for certificate_verifications (admins can view verification logs)
CREATE POLICY "Admins can view certificate verifications"
ON public.certificate_verifications FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Fix Security Issue 2 & 3: Update functions to set search_path
CREATE OR REPLACE FUNCTION public.log_certificate_verification(
  ref_number text,
  ip_address text,
  user_agent text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.certificate_verifications (reference_number, ip_address, user_agent)
  VALUES (ref_number, ip_address, user_agent);
END;
$$;