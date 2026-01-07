-- Migration: Create get_user_role RPC function
-- This function is called by the frontend to get a user's role

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = _user_id;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;

COMMENT ON FUNCTION public.get_user_role IS 'Returns the role of a user from the profiles table. Used by frontend for role-based access control.';

