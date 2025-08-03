-- Fix shifts table RLS policies to use proper admin check

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can create shifts" ON public.shifts;
DROP POLICY IF EXISTS "Only admin can insert shifts" ON public.shifts;
DROP POLICY IF EXISTS "Only admin can update shifts" ON public.shifts;
DROP POLICY IF EXISTS "Admins can view all shifts" ON public.shifts;

-- Create corrected policies using is_admin() function
CREATE POLICY "Admins can insert shifts" ON public.shifts
FOR INSERT 
WITH CHECK (is_admin());

CREATE POLICY "Admins can update shifts" ON public.shifts
FOR UPDATE 
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Admins can delete shifts" ON public.shifts
FOR DELETE 
USING (is_admin());