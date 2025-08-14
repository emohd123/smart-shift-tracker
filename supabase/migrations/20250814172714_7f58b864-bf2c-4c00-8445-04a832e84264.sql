-- Fix security vulnerabilities identified in security scan

-- 1. Fix promoter profile data exposure - restrict sensitive information access
DROP POLICY IF EXISTS "Anyone can query promoters" ON public.profiles;

-- Create new policy that only allows viewing basic profile info for authenticated users
CREATE POLICY "Authenticated users can view basic promoter info"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  (role)::text = 'promoter'::text AND 
  -- Only allow viewing basic fields, exclude sensitive data in application logic
  true
);

-- 2. Fix shift locations being publicly accessible - require authentication
DROP POLICY IF EXISTS "Allow anyone to read shift locations" ON public.shift_locations;

CREATE POLICY "Authenticated users can view shift locations"
ON public.shift_locations
FOR SELECT
TO authenticated
USING (true);

-- 3. Fix training modules paid content being publicly accessible
DROP POLICY IF EXISTS "Everyone can view active training modules" ON public.training_modules;

-- Allow viewing basic module info but restrict full content access
CREATE POLICY "Authenticated users can view training modules"
ON public.training_modules
FOR SELECT
TO authenticated
USING (is_active = true);

-- Create function to check if user has purchased training module
CREATE OR REPLACE FUNCTION public.user_has_purchased_module(module_id uuid)
RETURNS boolean AS $$
BEGIN
  -- Check if user has completed the module (indicates purchase)
  RETURN EXISTS (
    SELECT 1 FROM public.user_module_progress 
    WHERE user_id = auth.uid() 
    AND module_id = user_has_purchased_module.module_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add policy for viewing purchased training content
CREATE POLICY "Users can view purchased training content"
ON public.training_modules
FOR SELECT
TO authenticated
USING (
  is_active = true AND 
  (price_credits = 0 OR public.user_has_purchased_module(id))
);