
## What needs to change

### 3 problems bundled into this request

**1. `/tasks/:id` route** — each task gets its own shareable URL  
**2. Email button deep-link** — `btn()` must include task ID in URL  
**3. Comment content in email** — `triggerNotification` never passes `commentText`/`commentAuthor`/`commentAt`

---

### Files to change

**`src/App.tsx`**  
Add a new route `/tasks/:id` that renders `TasksPage` — same component, no new page file needed. The page already handles auto-opening via `selectedTask` state.

Actually cleaner: create a thin `TaskDetailPage` component inline in `App.tsx` (or a new `src/pages/TaskDetail.tsx`) that:
- Reads `id` from `useParams()`
- Fetches the single task by ID
- Shows the full `TasksPage` layout with the modal pre-opened and URL synced

But even simpler and consistent with how the app works (modal-based, not page-based): 

**Approach**: Keep `TasksPage` as the main view. Add `/tasks/:id` as an alias route that renders `TasksPage`. Inside `Tasks.tsx`, use `useParams()` to read `:id` (alongside existing `useSearchParams` for `?taskId=` backwards compat). When the task list loads and a task ID is in the URL, auto-open `TaskDetailModal`. When the modal closes, navigate back to `/tasks`.

This means:
- `/tasks` — task list, no modal open
- `/tasks/abc-uuid` — task list + modal pre-opened for that task
- Clicking a task row → `navigate('/tasks/' + task.id)` → opens modal + sets URL
- Closing modal → `navigate('/tasks')` → clears URL

**`src/App.tsx`**  
Add route: `<Route path="/tasks/:id" element={<TasksPage />} />`

**`src/pages/Tasks.tsx`**  
- Import `useParams`, `useNavigate` from react-router-dom  
- Read `const { id: taskIdParam } = useParams<{ id?: string }>()`  
- On tasks load, if `taskIdParam` is set, find task in list and call `setSelectedTask`  
- When opening a task: `navigate('/tasks/' + task.id)` instead of `setSelectedTask(task)` directly  
- When closing modal: `navigate('/tasks')` + `setSelectedTask(null)`  
- Also handle case: task may not be in `filteredTasks` (e.g. completed task, filtered out) — fetch it separately if needed using `useAllTasks` (already available)

**`supabase/functions/send-task-notification/index.ts`**  
- Update `btn(label, color, taskId)` to accept `taskId` param  
- Change href to `https://ghcalc.lovable.app/tasks/${taskId}`  
- Pass `task?.id` (or `taskId` from body) to all three `btn()` calls

**`src/hooks/useTasks.ts`**  
- Update `triggerNotification` to accept optional extra fields
- In `addTaskComment`, pass `content.trim()`, `currentUser.name`, `new Date().toISOString()` to the notification call for `'comment'` type
- `triggerNotification` signature: add optional `extras?: { commentText?: string; commentAuthor?: string; commentAt?: string }`
- Pass these in the body when invoking the edge function

---

### Summary of all 5 file changes

| File | What changes |
|---|---|
| `src/App.tsx` | Add `/tasks/:id` route |
| `src/pages/Tasks.tsx` | Use `useParams` to auto-open task modal + `navigate` on open/close |
| `src/hooks/useTasks.ts` | Pass comment payload in `triggerNotification`; update `addTaskComment` |
| `supabase/functions/send-task-notification/index.ts` | `btn()` gets `taskId` param → deep-link URL |

No DB migration needed — tasks already have UUIDs as their `id`.

### Edge case: task not visible in current filter
If user opens `/tasks/abc` but that task is filtered out (e.g. completed and `showCompleted=false`), it won't appear in `filteredTasks`. We use `allTasks` (already fetched via `useAllTasks`) to find it as fallback. If found in `allTasks`, open the modal directly regardless of filters.
