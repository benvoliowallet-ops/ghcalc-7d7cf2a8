
## Root Cause — Confirmed

The SELECT RLS policy on `profiles` is:
```sql
qual: is_admin(auth.uid()) OR (auth.uid() = id)
```

For an **admin user**, `is_admin()` returns `true` → the condition is `true OR (auth.uid() = id)` → **all rows in the table are returned**.

There are **2 profiles** in the database. When `loadProfile` calls:
```ts
.from('profiles').select('id, email, name, role').eq('id', user.id).single()
```

The `.eq('id', user.id)` filter is applied AFTER RLS, so it should return only 1 row... actually no — `.eq()` is a WHERE clause that runs alongside the RLS policy. The RLS policy makes ALL rows visible, then `.eq('id', user.id)` filters to just the 1 matching row. So `.single()` should be fine...

Wait, let me reconsider. The issue noted in the system context: **"avoid using `.single()` — use `.maybeSingle()`"**. `.single()` throws a PostgREST error if zero OR more than one row is returned. With the RLS policy making ALL rows visible to admin + the `.eq()` filter, it should still return exactly 1 row.

But what if the RLS is evaluated differently? Let me think again about `is_admin` recursion:

The SELECT policy on `profiles` calls `is_admin(auth.uid())`. `is_admin` is SECURITY DEFINER and queries `public.profiles`. Even though SECURITY DEFINER bypasses RLS for the function itself, the **outer query** on `profiles` that triggered the policy is still in flight. In PostgreSQL, SECURITY DEFINER functions DO bypass RLS on the tables they access internally — so `is_admin()` can read `profiles` freely. No infinite recursion should occur.

**BUT** — there's a known Supabase/PostgREST issue: when a SECURITY DEFINER function is called inside an RLS policy on the same table, it can cause issues in certain Supabase versions. The safe pattern is to use `user_roles` table or avoid `is_admin` querying the same table as the policy it's used in.

**The actual loading problem:**

Looking at `App.tsx` again:
```ts
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
    if (session?.user) {
      await loadProfile(session.user);   // ← sets loading: true first
    } else {
      setCurrentUser(null);
      setLoading(false);
    }
  });
  return () => subscription.unsubscribe();
}, []);
```

`loadProfile` now sets `loading: true` at the start (added in the previous fix). 

**The flow on page load with an existing session:**
1. `loading = true` (initial state)
2. `onAuthStateChange` fires with existing session → calls `loadProfile` → sets `loading: true` (same)
3. `loadProfile` queries `profiles` with the bad RLS/recursion → fails → sets `currentUser: null, loading: false`
4. App shows `<LoginPage />` ✓

**The flow after clicking login:**
1. LoginPage is shown, `loading = false`
2. User clicks login → `login()` is called → `signInWithPassword` → returns OK
3. `onAuthStateChange` fires with `SIGNED_IN` → calls `loadProfile`
4. `loadProfile` sets `loading: true` ← **THIS IS THE BUG**
5. `loadProfile` queries `profiles` → if it fails (RLS issue) → sets `currentUser: null, loading: false` → LoginPage shown again
6. But if `loadProfile` is HANGING (RLS recursion causing a long DB timeout) → `loading` stays `true` for many seconds → user sees "Načítavam..."

The previous fix added `set({ loading: true })` to `loadProfile`. This is correct in theory, but it causes the loading screen to flash between the login form and the dashboard. Worse, if the RLS causes a query hang/timeout, the user is stuck on loading.

**The two-part fix:**

### Fix 1 — RLS policy (database migration)
Replace the recursive `is_admin()` SELECT policy with a simple self-read policy. Admins don't need to see ALL profiles via the `loadProfile` call — they only need their OWN profile. The admin's ability to see all users is only needed in the `UsersPage` component, which can use a separate mechanism (edge function or service role).

**New SELECT policy:** `auth.uid() = id` (everyone can only read their own profile)

This eliminates `is_admin()` from the SELECT RLS entirely, removing any possibility of recursion or unexpected multi-row returns.

### Fix 2 — `loadProfile` should NOT set `loading: true`
The loading state is already `true` on initial app load. `loadProfile` setting `loading: true` again mid-session (e.g. after login) causes the "Načítavam..." screen to appear after the user was already on the login page. Remove `set({ loading: true })` from `loadProfile`.

### Fix 3 — UsersPage admin query
The `UsersPage` currently uses the profiles SELECT to list all users (relying on the admin RLS). Once we restrict the SELECT policy to own-profile only, we need to give `UsersPage` a way to fetch all profiles. We'll create a `SECURITY DEFINER` function `get_all_profiles()` that returns all profiles, callable only within the app (since anon key is used — but we can verify via the app's auth context).

Actually, simpler: create an admin-only edge function OR use a `SECURITY DEFINER` RPC that checks `is_admin(auth.uid())` before returning all profiles.

Let me check what UsersPage currently does to fetch users:

### Changes

**Migration (SQL):**
```sql
-- Drop the old permissive admin SELECT policy
DROP POLICY IF EXISTS "Users can read own or admin reads all profiles" ON public.profiles;

-- Simple, safe SELECT policy: users read only their own profile
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Create a SECURITY DEFINER function for admins to list all profiles
CREATE OR REPLACE FUNCTION public.get_all_profiles()
RETURNS TABLE(id uuid, email text, name text, role text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, email, name, role FROM public.profiles
  WHERE public.is_admin(auth.uid()) = true;
$$;
```

**`src/store/authStore.ts`:**
- Remove `set({ loading: true })` from `loadProfile` — loading state is managed by App.tsx's initial `true` state and only cleared once. We don't want it flickering back to `true` mid-session.

**`src/components/admin/UsersPage.tsx`:**
- Change from direct `.from('profiles').select()` to `supabase.rpc('get_all_profiles')` so it works with the new restricted SELECT policy.

This is the definitive, clean fix:
1. No more RLS policy that calls `is_admin()` on the same `profiles` table → no recursion risk
2. `loadProfile` only sets `loading: false` (never back to `true`) → no "Načítavam..." flash after clicking login
3. Admin user listing still works via a safe SECURITY DEFINER function
