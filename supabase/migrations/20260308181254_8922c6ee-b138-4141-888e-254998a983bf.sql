
-- ============================================================
-- GreenHouse Calc — Full Schema Migration
-- ============================================================

-- 1. App roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- 2. Profiles table (stores display name + role per user)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Invitations table
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL DEFAULT '',
  role app_role NOT NULL DEFAULT 'user',
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  used_at TIMESTAMPTZ,
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- 4. Projects table — stores full ProjectState JSONB snapshot
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quote_number TEXT NOT NULL DEFAULT '',
  customer_name TEXT NOT NULL DEFAULT '',
  project_address TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT 'SK',
  current_step INTEGER NOT NULL DEFAULT 1,
  num_zones INTEGER NOT NULL DEFAULT 1,
  snapshot JSONB NOT NULL DEFAULT '{}',
  saved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own projects"
  ON public.projects FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own projects"
  ON public.projects FOR DELETE
  USING (auth.uid() = owner_id);

-- 5. Stock items table
CREATE TABLE public.stock_items (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  additional_text TEXT NOT NULL DEFAULT '',
  price NUMERIC(12, 4) NOT NULL DEFAULT 0,
  "group" TEXT NOT NULL DEFAULT '',
  supplier TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can read stock items"
  ON public.stock_items FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- 6. Change log table
CREATE TABLE public.change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  item_code TEXT NOT NULL,
  item_name TEXT NOT NULL,
  before_data JSONB,
  after_data JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.change_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can read change log"
  ON public.change_log FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert change log"
  ON public.change_log FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 7. Auto-update updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stock_items_updated_at
  BEFORE UPDATE ON public.stock_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Security definer function for admin check (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND role = 'admin'
  )
$$;

-- 9. RLS policies using is_admin to avoid recursion
CREATE POLICY "Users can read own or admin reads all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin(auth.uid()) OR auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can manage invitations"
  ON public.invitations FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Anyone can read invitation by code for registration"
  ON public.invitations FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert stock items"
  ON public.stock_items FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update stock items"
  ON public.stock_items FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete stock items"
  ON public.stock_items FOR DELETE
  USING (public.is_admin(auth.uid()));

-- 10. Auto-create profile on user signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role app_role := 'user';
  v_name TEXT := '';
BEGIN
  v_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));

  -- First user becomes admin
  IF NOT EXISTS (SELECT 1 FROM public.profiles LIMIT 1) THEN
    v_role := 'admin';
  ELSE
    v_role := COALESCE(
      (NEW.raw_user_meta_data->>'invited_role')::app_role,
      'user'
    );
  END IF;

  INSERT INTO public.profiles (id, email, name, role)
  VALUES (NEW.id, NEW.email, v_name, v_role)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
