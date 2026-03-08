
-- Public SECURITY DEFINER function so the login page can check
-- if any users exist WITHOUT being authenticated (bypasses RLS on profiles).
CREATE OR REPLACE FUNCTION public.get_user_count()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer FROM public.profiles;
$$;

-- Allow anonymous/unauthenticated callers to invoke this function
GRANT EXECUTE ON FUNCTION public.get_user_count() TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_count() TO authenticated;
