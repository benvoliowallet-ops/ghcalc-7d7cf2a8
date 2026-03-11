
-- 1. Add status column to projects
ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'in_progress';

-- 2. Create project_changes table
CREATE TABLE IF NOT EXISTS public.project_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  changed_at timestamptz NOT NULL DEFAULT now(),
  changed_by uuid,
  changed_by_email text NOT NULL DEFAULT '',
  reason text NOT NULL
);

ALTER TABLE public.project_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view project changes"
  ON public.project_changes FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can insert project changes"
  ON public.project_changes FOR INSERT
  WITH CHECK (auth.uid() = changed_by);
