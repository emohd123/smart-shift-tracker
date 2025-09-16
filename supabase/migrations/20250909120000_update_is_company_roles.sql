-- Align is_company() with current role model (company_admin/company_manager/admin)
-- Safe to run multiple times
CREATE OR REPLACE FUNCTION public.is_company()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
      AND role IN ('admin', 'company_admin', 'company_manager', 'company')
  );
$$;
