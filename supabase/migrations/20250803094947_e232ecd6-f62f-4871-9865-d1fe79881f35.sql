-- Phase 1: Critical Role Security Fixes (Corrected)

-- Update the role escalation prevention function to handle trigger context properly
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only allow role changes by admins
  IF OLD.role != NEW.role AND NOT is_admin() THEN
    RAISE EXCEPTION 'Only administrators can change user roles';
  END IF;
  
  -- Log role changes for security monitoring
  IF OLD.role != NEW.role THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      NEW.id,
      'Role Changed',
      'Your role has been changed from ' || OLD.role || ' to ' || NEW.role,
      'security_audit'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for role change prevention
DROP TRIGGER IF EXISTS prevent_role_escalation_trigger ON public.profiles;
CREATE TRIGGER prevent_role_escalation_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_escalation();

-- Strengthen profiles RLS policy to prevent unauthorized role changes
DROP POLICY IF EXISTS "Users can update own profile data" ON public.profiles;
CREATE POLICY "Users can update own profile data" ON public.profiles
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Ensure admin verification function is properly secured
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;