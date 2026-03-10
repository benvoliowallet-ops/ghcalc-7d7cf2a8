## ÚLOHY (Tasks) Module — Full Implementation Plan

### Architecture Overview

The app currently uses a view-based navigation system (AppView type in App.tsx + Sidebar), not React Router routes for internal pages. The `/tasks` view will follow the same pattern as `dashboard`, `stock`, `changelog`, etc. — adding `'tasks'` to the `AppView` union and rendering `<TasksPage />` in `renderContent()`.

The sidebar is a custom component (not using shadcn Sidebar) — we add the nav item directly to `NAV_ITEMS`.

---

### 1. Database Migration

New file: `supabase/migrations/<timestamp>_tasks_module.sql`

```sql
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

-- RLS: SELECT for all authenticated
CREATE POLICY "Authenticated can view tasks" ON public.tasks FOR SELECT USING (auth.uid() IS NOT NULL);
-- RLS: INSERT own
CREATE POLICY "Authenticated can insert own tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = created_by);
-- RLS: UPDATE creator only (assigned_to status updates handled app-side with separate .update() call scoped to status/completed_at only)
CREATE POLICY "Creator can update tasks" ON public.tasks FOR UPDATE USING (auth.uid() = created_by);
-- RLS: allow assigned_to to update status/completed_at (separate policy)
CREATE POLICY "Assigned can update status" ON public.tasks FOR UPDATE USING (auth.uid() = assigned_to);
-- RLS: DELETE creator only
CREATE POLICY "Creator can delete tasks" ON public.tasks FOR DELETE USING (auth.uid() = created_by);

-- updated_at trigger
CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON public.tasks
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

CREATE POLICY "Authenticated can view task comments" ON public.task_comments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can insert own task comments" ON public.task_comments FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Author can update own task comments" ON public.task_comments FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Author can delete own task comments" ON public.task_comments FOR DELETE USING (auth.uid() = created_by);
```

---

### 2. New Files

`**src/hooks/useTasks.ts**`

- `useTasks(filters?: { assignedTo?, projectId?, includeCompleted? })` — fetches tasks with profiles join via `.select('*, assignee:profiles!assigned_to(id,name), creator:profiles!created_by(id,name), project:projects!project_id(id,quote_number,customer_name)')`. Sorting: overdue first, then deadline asc, then created_at.
- `useTaskComments(taskId)` — fetches comments with realtime subscription (same pattern as `useComments`)
- `createTask(payload)` — inserts + triggers notification edge function if assigned_to set
- `updateTask(id, patch)` — full update (creator only in practice)
- `updateTaskStatus(id, status)` — restricted patch: `{ status, completed_at }` only — safe for assigned_to user
- `deleteTask(id)`
- `addTaskComment(taskId, content)` — inserts comment + triggers `send-task-notification` type='comment' for TWO recipients separately: task.created_by (if different from commenter) and task.assigned_to (if set and different from commenter)
- `deleteTaskComment(id)`

`**src/pages/Tasks.tsx**`

- Header with title + "+ Nová úloha" button
- Filter bar: assigned_to dropdown (all profiles), priority filter, toggle for completed tasks
- Renders `<TaskList />` with the active filter params
- Uses `supabase.from('profiles').select(...)` once to build the user list for filters

`**src/components/tasks/TaskList.tsx**`

- Receives `tasks[]`, renders `<TaskRow />` for each
- Appends collapsed "Dokončené" section when `showCompleted` is true (toggled from parent)

`**src/components/tasks/TaskRow.tsx**`

- Left border color by priority: gray/blue/orange/red (via inline style based on priority value)
- Shows: title, assigned_to name, project badge (quote_number), deadline (red+bold if overdue), status badge, created_by name, subtask count badge
- `onClick` → opens `<TaskDetailModal task={task} />`

Priority border colors:

```
low    → border-left: 3px solid hsl(var(--muted-foreground))
medium → border-left: 3px solid hsl(var(--teal))
high   → border-left: 3px solid hsl(var(--orange))
urgent → border-left: 3px solid hsl(0 72% 51%)  /* destructive */
```

`**src/components/tasks/NewTaskModal.tsx**`

- Dialog (using radix Dialog already installed)
- Fields: title (required), description, assigned_to dropdown, project searchable select, priority radio group, deadline datetime input
- On submit: `createTask(...)`, then if assigned_to → invoke `send-task-notification` type='assigned'
- `projectId` prop (optional) — pre-fills + locks the project field when opened from ProjectSummary

`**src/components/tasks/TaskDetailModal.tsx**`

- Large dialog (max-w-3xl)
- Top section: title (inline edit if `currentUser.id === task.created_by`), description, priority, assigned_to, project, deadline — all editable by creator only
- Status selector: editable by creator OR assigned_to. On change to 'done': sets `completed_at = now()`, calls `updateTaskStatus`. On revert from done: clears `completed_at`.
- Read-only: created_by name + created_at, completed_at (shown when done)
- **Subtasks section**: renders `<SubtaskTree parentId={task.id} />` + "+ Pridať podúlohu" inline form
- **Comments section**: list + input, same visual style as `InlineProjectComments`

`**src/components/tasks/SubtaskTree.tsx**`

- Recursive component: `SubtaskTree({ parentId, depth = 0 })`
- Fetches `tasks.filter(t => t.parent_task_id === parentId)` (passed from parent's loaded task list — avoids extra queries)
- Each subtask row shows title, status badge, assigned_to, expand button if has children
- Expand → renders `<SubtaskTree parentId={subtask.id} depth={depth+1} />`
- "+ Pridať podúlohu" calls `createTask({ parent_task_id: parentId, ... })`

`**supabase/functions/send-task-notification/index.ts**`

- Accepts `{ type: 'assigned' | 'completed' | 'comment', taskId, recipientId }`
- Only `console.log` for now (email via Resend added later)
- Validates JWT via `getClaims()` pattern
- Returns `{ ok: true }`

---

### 3. Modified Files

`**src/App.tsx**`

- Add `'tasks'` to `AppView` type
- Import `TasksPage` from `./pages/Tasks`
- Add case in `renderContent()`: `case 'tasks': return <TasksPage />;`

`**src/components/Sidebar.tsx**`

- Import `CheckSquare` from lucide-react
- Add to `NAV_ITEMS` after dashboard entry:
  ```ts
  { target: 'tasks', icon: CheckSquare, label: 'Úlohy' }
  ```

`**src/components/ProjectSummary.tsx**`

- Add "ÚLOHY PROJEKTU" section near the bottom (before the existing comments section)
- Renders `<ProjectTasksSection projectId={openProjectId} />` — an inline component that uses `useTasks({ projectId, includeCompleted: false })` with a local toggle for completed tasks and a "+ Nová úloha" button opening `<NewTaskModal projectId={openProjectId} />`

---

### 4. Edge Function Config

Add to `supabase/config.toml`:

```toml
[functions.send-task-notification]
verify_jwt = true
```

---

### File Count Summary


| New Files                                            | Count |
| ---------------------------------------------------- | ----- |
| `src/pages/Tasks.tsx`                                | 1     |
| `src/components/tasks/TaskList.tsx`                  | 1     |
| `src/components/tasks/TaskRow.tsx`                   | 1     |
| `src/components/tasks/TaskDetailModal.tsx`           | 1     |
| `src/components/tasks/NewTaskModal.tsx`              | 1     |
| `src/components/tasks/SubtaskTree.tsx`               | 1     |
| `src/hooks/useTasks.ts`                              | 1     |
| `supabase/functions/send-task-notification/index.ts` | 1     |
| DB migration                                         | 1     |



| Modified Files                      | &nbsp;                 |
| ----------------------------------- | ---------------------- |
| `src/App.tsx`                       | add view + route       |
| `src/components/Sidebar.tsx`        | add nav item           |
| `src/components/ProjectSummary.tsx` | add tasks section      |
| `supabase/config.toml`              | register edge function |


---

### Key Design Decisions

1. **No new router route** — follows existing view-based navigation pattern of the app (avoids breaking the current auth guard and sidebar setup).
2. **Profile fetching for dropdowns** — `useTasks` and the modals will call `supabase.from('profiles').select('id, name')` once; this reuses the existing RLS "all authenticated can read profiles" policy.
3. **Subtask nesting** — `SubtaskTree` receives the already-loaded full task list from the parent hook, filters client-side by `parent_task_id` — avoids N+1 queries for infinite nesting up to reasonable depths.
4. `**updateTaskStatus` vs `updateTask**` — assigned user calls a narrower `.update({ status, completed_at }).eq('id', id).eq('assigned_to', uid)` which RLS allows via the "Assigned can update status" policy. Creator calls full `.update(patch).eq('id', id).eq('created_by', uid)`.