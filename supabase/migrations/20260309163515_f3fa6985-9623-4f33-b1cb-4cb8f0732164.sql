
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;

CREATE POLICY "All authenticated users can view all projects"
  ON public.projects FOR SELECT
  USING (auth.uid() IS NOT NULL);
