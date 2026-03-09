
## Plan — All users see all projects

### Changes required

**1. Supabase RLS policy** (database migration)
Replace the current "Users can view their own projects" SELECT policy on `projects` with a new one allowing all authenticated users to read all projects.

**2. `src/types/index.ts`**
Add `ownerName` and `ownerId` fields to `SavedProject`:
```ts
export interface SavedProject {
  ...
  ownerId: string;
  ownerName: string;  // from profiles join
}
```

**3. `src/hooks/useProjects.ts`**
- Remove `.eq('owner_id', currentUser.id)` filter
- Add `owner_id, profiles(name, email)` to the select
- Map the new fields when building `SavedProject[]`

**4. `src/components/Dashboard.tsx`**
- Pass `currentUserId` into `ProjectCard`
- Add "Vytvoril:" line with `User` icon below customer name — shows "Ja" if `project.ownerId === currentUser.id`, otherwise the owner name/email
- Hide the delete `<button>` entirely when `project.ownerId !== currentUser.id`

### Files changed
- `supabase/migrations/` — new RLS policy (drop old SELECT, add new permissive one for authenticated)
- `src/types/index.ts` — extend `SavedProject`
- `src/hooks/useProjects.ts` — update query + mapping
- `src/components/Dashboard.tsx` — UI updates

### RLS migration SQL
```sql
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;

CREATE POLICY "All authenticated users can view all projects"
  ON public.projects FOR SELECT
  USING (auth.uid() IS NOT NULL);
```

The Supabase join query for profiles will look like:
```
.select('id, quote_number, customer_name, project_address, country, current_step, num_zones, snapshot, saved_at, owner_id, profiles!projects_owner_id_fkey(name, email)')
```
Since `projects.owner_id` is not a proper FK to `profiles`, a separate `eq` lookup will be needed, OR we use an explicit join hint. The simplest approach: add `owner_id` to the select and then resolve names in a second pass — but more efficient is to rely on Supabase's ability to join via `profiles` using the owner_id column. We'll fetch all profiles once separately and merge, to avoid FK constraint issues.

Actually, the cleanest approach given there's no FK defined: fetch projects without join, then separately fetch profiles for all unique owner_ids in a second query, then merge in the mapping step.
