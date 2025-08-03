-- CRITICAL SECURITY FIX: Prevent privilege escalation
-- Remove existing problematic policies and create secure ones

-- Drop existing problematic policies on profiles table
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create secure admin role checking function first
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- Create secure policy that prevents role changes by users
CREATE POLICY "Users can update own profile (except role)" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Create admin-only policy for role changes  
CREATE POLICY "Only admins can change user roles" 
ON public.profiles 
FOR UPDATE 
USING (is_admin());

-- Fix hardcoded admin email in certificates policy
DROP POLICY IF EXISTS "Admins can view all certificates" ON public.certificates;
CREATE POLICY "Admins can view all certificates" 
ON public.certificates 
FOR SELECT 
USING (is_admin());

-- Fix shift_locations admin policy
DROP POLICY IF EXISTS "Allow admins to manage shift locations" ON public.shift_locations;
CREATE POLICY "Allow admins to manage shift locations" 
ON public.shift_locations 
FOR ALL 
USING (is_admin());

-- Update payouts policies to use is_admin() function
DROP POLICY IF EXISTS "Admins can view all payouts" ON public.payouts;
DROP POLICY IF EXISTS "Only admins can insert payouts" ON public.payouts;
DROP POLICY IF EXISTS "Only admins can update payouts" ON public.payouts;

CREATE POLICY "Admins can view all payouts" 
ON public.payouts 
FOR SELECT 
USING (is_admin());

CREATE POLICY "Only admins can insert payouts" 
ON public.payouts 
FOR INSERT 
WITH CHECK (is_admin());

CREATE POLICY "Only admins can update payouts" 
ON public.payouts 
FOR UPDATE 
USING (is_admin());

-- Update documents policies
DROP POLICY IF EXISTS "Admins can view all documents" ON public.documents;
DROP POLICY IF EXISTS "Only admins can update documents" ON public.documents;

CREATE POLICY "Admins can view all documents" 
ON public.documents 
FOR SELECT 
USING (is_admin());

CREATE POLICY "Only admins can update documents" 
ON public.documents 
FOR UPDATE 
USING (is_admin());

-- Create audit function for role changes
CREATE OR REPLACE FUNCTION public.audit_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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

-- Create trigger for role change auditing
DROP TRIGGER IF EXISTS audit_role_changes_trigger ON public.profiles;
CREATE TRIGGER audit_role_changes_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role)
  EXECUTE FUNCTION public.audit_role_changes();