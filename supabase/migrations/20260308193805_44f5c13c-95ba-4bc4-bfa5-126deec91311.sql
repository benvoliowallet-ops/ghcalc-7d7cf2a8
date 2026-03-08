
-- Fix 1: Replace the recursive SELECT policy with a simple self-read policy
DROP POLICY IF EXISTS "Users can read own or admin reads all profiles" ON public.profiles;

CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Fix 2: Create a SECURITY DEFINER function for admins to list all profiles
CREATE OR REPLACE FUNCTION public.get_all_profiles()
RETURNS TABLE(id uuid, email text, name text, role text, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.email, p.name, p.role::text, p.created_at
  FROM public.profiles p
  WHERE public.is_admin(auth.uid()) = true;
$$;
