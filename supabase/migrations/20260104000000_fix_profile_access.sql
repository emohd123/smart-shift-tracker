-- Drop the recursive policies that caused infinite recursion
DROP POLICY IF EXISTS "Promoters can view companies they work with" ON public.profiles;
DROP POLICY IF EXISTS "Companies can view assigned promoters" ON public.profiles;

-- Create a security-definer function to get company details
CREATE OR REPLACE FUNCTION public.get_company_name(company_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(full_name, 'Unknown Company')
  FROM profiles
  WHERE id = company_id AND role = 'company'
$$;

GRANT EXECUTE ON FUNCTION public.get_company_name(uuid) TO authenticated;
