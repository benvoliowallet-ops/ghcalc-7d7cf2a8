
## Full picture of the problem

**Current state — all data lives in localStorage only:**
- `useProjectStore` uses `zustand/persist` with `{ name: 'greenhouse-project' }` → localStorage
- `useAuthStore` uses `zustand/persist` with `{ name: 'greenhouse-auth' }` → localStorage
- Authentication is completely custom (plain JS hash, users stored in localStorage)
- Supabase database is empty (types.ts shows no tables)
- `src/lib/supabaseClient.ts` is a stub with `isSupabaseConfigured = false`

**Risks:**
1. Browser cache clear / incognito / different device = total data loss
2. Multiple users can't share projects — each user has their own localStorage
3. No CAD autosave — losing the browser tab mid-draw loses all work
4. Auth credentials (hashed passwords) in localStorage = easy to manipulate
5. No crash recovery

---

## What needs to be built

### 1. Database tables (via migration)

```text
profiles           — user display data (id, name, role)
user_roles         — admin/user role separation (security pattern)
projects           — one row per project (id, owner_id, snapshot as JSONB, metadata)
```

The `ProjectState` (including CAD) is a deep nested object — we store it as a single `snapshot JSONB` column. This is the simplest approach that requires zero schema changes when ProjectState evolves. Alternative would be separate tables per entity but that's massive scope and fragile.

### 2. Auth: switch from custom localStorage auth to Supabase Auth

Replace `useAuthStore` custom login/register/hash logic with `supabase.auth.signInWithPassword` / `signUp`. The current invite code system stays but validates against a `invitations` table in the DB instead of localStorage. Admin bootstrap becomes the first user to register.

Key change: `currentUser` comes from `supabase.auth.getUser()` + `profiles` join instead of localStorage.

### 3. Project persistence: save to DB on every store action

Add a Zustand middleware/subscriber that:
- Debounces 2s after any store change
- Calls `supabase.from('projects').upsert(...)` with the full snapshot
- Shows a "Ukladanie..." / "Uložené ✓" indicator in the header
- On CAD actions (addSegment, removeSegment, setCADData) → immediate save (no debounce) for data safety

### 4. Project load: read from DB on login

On auth state change (user logs in), load all their projects from `projects` table, hydrate `savedProjects` in the store.

### 5. Stock items & changelog: also persist to DB

`stockStore` and change log entries currently live in localStorage. Move them to `stock_items` and `change_log` tables.

---

## Files to change

**New DB migration:**
```sql
-- profiles table
-- user_roles table  
-- projects table
-- stock_items table
-- change_log table
-- RLS policies for each
-- invitations table
```

**Modified:**
1. `src/store/authStore.ts` — replace custom auth with Supabase Auth
2. `src/store/projectStore.ts` — add Supabase sync (upsert on change, debounced + immediate for CAD)
3. `src/hooks/useProjects.ts` (new) — hook to load/sync projects from DB
4. `src/components/auth/LoginPage.tsx` — update form handlers to use new auth
5. `src/components/admin/UsersPage.tsx` — read users from profiles table
6. `src/App.tsx` — add auth session listener, auto-save status indicator in header
7. `src/store/stockStore.ts` — persist stock items to DB
8. `src/components/stock/StockPage.tsx` / `StockItemModal.tsx` — use DB for CRUD
9. `src/components/admin/ChangeLogPage.tsx` — read/write change log from DB

---

## Auto-save strategy

```text
Any store mutation
  └─ updateZone, updateProject, updateGlobalParams  → debounce 2s → upsert
  └─ addSegment, removeSegment, setCADData (CAD)    → immediate upsert (no debounce)
  └─ saveCurrentProject (manual)                    → immediate upsert + toast "Uložené ✓"
```

UI: small indicator in the header next to the project number — "⟳ Ukladám..." / "✓ Uložené" / "⚠ Chyba ukladania"

---

## RLS policies (security)

- `profiles`: user can read/write own row only
- `user_roles`: only security definer function for role checks; no direct access
- `projects`: owner_id = auth.uid() for SELECT/INSERT/UPDATE/DELETE
- `stock_items`: authenticated users can SELECT; only admins can INSERT/UPDATE/DELETE
- `change_log`: authenticated users can SELECT; INSERT from any authenticated user
- `invitations`: admin only for INSERT/DELETE; SELECT own row for registration

---

## What stays the same

- All business logic (calculations, BOM generation, CAD drawing)
- All UI components and layouts
- The `ProjectState` shape (stored as JSONB snapshot)
- Step wizard flow

---

## Scope of this plan

This is a large migration. The plan implements everything in one go:
1. DB schema + RLS (migration)
2. Supabase Auth replacing custom auth
3. Project auto-save with status indicator
4. Stock items + change log to DB
5. Admin users page reads from DB

The localStorage zustand persist stays as an **offline fallback** (belt-and-suspenders), but all mutations also write to Supabase immediately.
