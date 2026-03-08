
-- ─── Project Portals ─────────────────────────────────────────────────────────
CREATE TABLE public.project_portals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  plain_password text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,
  expires_at timestamptz,
  UNIQUE(project_id)
);

ALTER TABLE public.project_portals ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view portals for projects they own
CREATE POLICY "Authenticated users can manage their portals"
  ON public.project_portals
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Public: anyone can read portal by project_id (for password verification in edge function)
-- Edge function uses service role, so no extra policy needed for public access

-- ─── Project Comments ────────────────────────────────────────────────────────
CREATE TABLE public.project_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  author_id uuid NOT NULL,
  author_name text NOT NULL DEFAULT '',
  body text NOT NULL,
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all comments"
  ON public.project_comments
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert comments"
  ON public.project_comments
  FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors and admins can update comments"
  ON public.project_comments
  FOR UPDATE
  USING (auth.uid() = author_id OR is_admin(auth.uid()));

CREATE POLICY "Authors and admins can delete comments"
  ON public.project_comments
  FOR DELETE
  USING (auth.uid() = author_id OR is_admin(auth.uid()));

-- ─── Enable Realtime ─────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_comments;
