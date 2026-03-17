
## Three problems to fix

### Problem 1 — Comment content missing in email
In `useTasks.ts` line 258, `triggerNotification` is called with only `(type, taskId, recipientId)` — no `commentText`, `commentAuthor`, or `commentAt` is passed. The edge function accepts those fields but never receives them.

**Fix:** Update `triggerNotification` signature and the `addTaskComment` call to pass `content` (the comment text), `currentUser.name` (author), and the current timestamp.

### Problem 2 — "Zobraziť úlohu" button links to homepage
In `index.ts` line 104, the `btn()` function hardcodes the href as `https://ghcalc.lovable.app` — no task ID. The URL needs to be `https://ghcalc.lovable.app/tasks?taskId=<id>`.

**Fix:** Pass `taskId` into `btn()` and build the deep-link URL.

### Problem 3 — Tasks page has no deep-link/URL support for individual tasks
Currently `/tasks` has no route for a specific task. The URL `https://ghcalc.lovable.app/tasks?taskId=<id>` needs to open the task detail modal automatically for that task.

**Fix:** Add a `useEffect` in `Tasks.tsx` that reads `?taskId=` from `URLSearchParams` on load, finds the task in the fetched list, and opens `TaskDetailModal` for it.

---

### Files to change

**`src/hooks/useTasks.ts`**
- Add optional params `commentText`, `commentAuthor`, `commentAt` to `triggerNotification()`
- In `addTaskComment`, pass `content.trim()`, `currentUser.name`, and `new Date().toISOString()` when invoking for `'comment'` type

**`src/pages/Tasks.tsx`**
- Read `?taskId=` from URL using `useSearchParams` (react-router-dom)
- When tasks load and a `taskId` param is present, find that task and auto-open `TaskDetailModal`

**`supabase/functions/send-task-notification/index.ts`**
- Update `btn(label, color, taskId)` to include `taskId` in the href: `https://ghcalc.lovable.app/tasks?taskId=${taskId}`
- Pass `task?.id` when calling `btn()` in all three notification templates (`assigned`, `comment`, `completed`)

Then redeploy the edge function.

---

### No schema changes needed — tasks already have `id` (uuid), we just use it in the URL.
