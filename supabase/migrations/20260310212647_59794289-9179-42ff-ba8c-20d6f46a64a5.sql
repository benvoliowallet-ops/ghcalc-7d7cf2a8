
-- tasks table
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  assigned_to uuid REFERENCES public.profiles(id),
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  parent_task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in_progress','done')),
  deadline timestamptz,
  completed_at timestamptz
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view tasks" ON public.tasks
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can insert own tasks" ON public.tasks
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creator can update tasks" ON public.tasks
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Assigned can update status" ON public.tasks
  FOR UPDATE USING (auth.uid() = assigned_to);

CREATE POLICY "Creator can delete tasks" ON public.tasks
  FOR DELETE USING (auth.uid() = created_by);

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- task_comments table
CREATE TABLE public.task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now(),
  content text NOT NULL
);

ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view task comments" ON public.task_comments
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can insert own task comments" ON public.task_comments
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Author can update own task comments" ON public.task_comments
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Author can delete own task comments" ON public.task_comments
  FOR DELETE USING (auth.uid() = created_by);
