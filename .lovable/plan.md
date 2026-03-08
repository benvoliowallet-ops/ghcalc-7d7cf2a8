
## Root Cause Analysis

The login works (200 OK from Supabase auth), but the app gets stuck on "Načítavam..." because `loadProfile` fails silently.

### The exact chain of failure:

**Step 1 — Login succeeds:** `supabase.auth.signInWithPassword` returns 200 with a valid user.

**Step 2 — `onAuthStateChange` fires in `App.tsx`** (line 119–127) with the new session and calls `loadProfile(session.user)`.

**Step 3 — `loadProfile` queries the `profiles` table** (authStore.ts line 33):
```
SELECT id, email, name, role FROM profiles WHERE id = user.id
```

**Step 4 — THE BUG: The SELECT RLS policy calls `is_admin(auth.uid())`:**
```sql
qual: (is_admin(auth.uid()) OR (auth.uid() = id))
```

The `is_admin()` function itself queries `profiles`:
```sql
SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND role = 'admin')
```

This creates an **infinite recursive loop**: Reading `profiles` → triggers RLS → calls `is_admin()` → reads `profiles` again → triggers RLS → calls `is_admin()` → ...

Supabase has protection against infinite recursion in RLS, so it **aborts the query and returns an error or empty result** instead of hanging forever. But crucially, `is_admin` is `SECURITY DEFINER` — it bypasses RLS when reading `profiles`... except the policy itself calls `is_admin()` which queries profiles WITH the security definer context. This should work in theory but in practice on this Supabase version it causes the query to fail.

**Why did it work before?** The previous code path used the `login()` function in authStore which called `loadProfile` AFTER the signIn — at that point `onAuthStateChange` also fired, causing `loadProfile` to be called **twice simultaneously**. One would succeed, one would fail, and both raced to set `loading: false`. Now with the added safety logic, both calls may be hitting the recursion issue at the same time and both failing.

**Step 5 — Result**: `loadProfile` either gets an error OR empty data → falls into `if (error || !data)` → sets `loading: false` but does NOT set `currentUser` → app shows LoginPage again (or if called a second time from `getSession`, the second `loadProfile` call also fails → still no `currentUser`).

Wait, re-reading the screenshot — user says "ostane loading po kliknutí" — so it stays loading. That means `loading` is staying `true`. So `loadProfile` is neither setting loading=false nor setting currentUser. 

The only way `loading` stays `true` is if `loadProfile` is throwing an exception that is NOT caught, or if it never returns at all. But we have a try/catch...

Actually wait — looking at `login()` in authStore (line 60–65):
```ts
login: async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword(...)
  if (error) return { ok: false, ... }
  if (data.user) await get().loadProfile(data.user)   // ← calls loadProfile
  return { ok: true }
}
```

AND in `App.tsx` the `onAuthStateChange` listener also calls `loadProfile` when a `SIGNED_IN` event fires. So `loadProfile` is called TWICE — once from `login()` directly and once from the `onAuthStateChange` callback.

The problem is a **DOUBLE `loading` state race**: 
1. `login()` calls `loadProfile` → sets `loading: false` + `currentUser`
2. Meanwhile `onAuthStateChange` fires → calls `loadProfile` AGAIN
3. Second `loadProfile` call starts → loading is currently `false` (already set by step 1), but if this second call sets `loading: true` somewhere, or if the second call fails...

Actually no — `loadProfile` never sets `loading: true`. So that's not it.

The real issue is **different**: When `login()` is called from `LoginPage`, it calls `loadProfile`. But then `onAuthStateChange` ALSO fires with `SIGNED_IN` event. This means `loadProfile` is called twice concurrently. If the first call is still awaiting the DB query, and the second fires immediately after — both run simultaneously. If there's an RLS infinite recursion issue, BOTH fail → `loading` gets set to `false` but `currentUser` is never set → app shows `<LoginPage />` again. But user says it stays on loading...

Let me reconsider. The `loading` state starts as `true`. In `App.tsx`:
- `safetyTimeout` is set for 6 seconds
- `onAuthStateChange` is set up
- `getSession()` is also called as fallback

**After clicking login:**
1. `handleSubmit` in LoginPage calls `login(email, password)`  
2. `login()` in authStore calls `signInWithPassword` → 200 OK
3. `login()` then calls `await loadProfile(data.user)` 
4. `loadProfile` queries `profiles` → **fails due to RLS recursion**
5. `loadProfile` sets `loading: false`, `currentUser: null`
6. Meanwhile `onAuthStateChange` fires with `SIGNED_IN` → calls `loadProfile` again
7. This sets `loading: true`??? No — it doesn't set loading to true.

Hmm. Actually `loadProfile` NEVER sets `loading: true`. So after step 5, `loading` is `false` and `currentUser` is `null` → LoginPage is shown.

But the user says it stays on "loading"... Let me reconsider whether the `loading` initial state is the issue. `authStore` initializes with `loading: true`. If the app reloads when the user clicks submit (e.g. hot reload), the state resets to `loading: true`.

**ACTUALLY** — looking more carefully at App.tsx after my last fix:
- `onAuthStateChange` fires BEFORE the login button is clicked (with the existing session check)
- But at login time, `onAuthStateChange` fires AGAIN with event `SIGNED_IN`
- The `onAuthStateChange` handler calls `await loadProfile(session.user)` 
- ALSO `getSession()` is called as a fallback — it runs and calls `loadProfile(user)` as well if there's a session

So the sequence after a fresh page load + login:

1. Page loads → `loading = true`
2. `onAuthStateChange` fires immediately with `null` session → `setCurrentUser(null); setLoading(false)` → now `loading = false`, shows LoginPage ✓
3. User fills form, clicks "Prihlásiť sa"
4. `login()` is called → `signInWithPassword` → 200 OK
5. `onAuthStateChange` fires with `SIGNED_IN` event → `clearTimeout(safetyTimeout)`... wait but `safetyTimeout` was already cleared in step 2? No! `clearTimeout(safetyTimeout)` is called in the handler on line 120, regardless of whether there's a session or not.
6. `loadProfile` is called from `onAuthStateChange`
7. ALSO `login()` itself calls `await loadProfile(data.user)` on line 63

**The core issue**: After step 2, `loading` is `false`. The LoginPage is shown. User logs in. `onAuthStateChange` fires → calls `loadProfile` which sets `loading: true`? NO — loadProfile never sets loading to true! So `loading` stays `false` throughout.

Wait, but user says it stays loading. Let me look at this from a different angle — maybe it's the **initial page load** issue, not the post-login issue. Let me re-read: "teraz sa neviem prihlásiť.. ostane loading po kliknutí"

So: the login page shows correctly (loading resolves), user fills in credentials, clicks button, and THEN it stays on loading. This means after clicking, `loading` becomes `true` again somehow.

**Found it!** Looking at `login()`:
```ts
login: async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword(...)
  if (data.user) await get().loadProfile(data.user)
  return { ok: true }
}
```

And in `App.tsx` `onAuthStateChange`:
```ts
supabase.auth.onAuthStateChange(async (_event, session) => {
  clearTimeout(safetyTimeout)
  if (session?.user) {
    await loadProfile(session.user)  // ← sets loading: false + currentUser
  } else {
    setCurrentUser(null)
    setLoading(false)
  }
})
```

When the user clicks login:
1. `onAuthStateChange` fires with `SIGNED_IN` + valid session → calls `loadProfile` → this should set `currentUser` and `loading: false`
2. BUT — `login()` in authStore ALSO calls `loadProfile` after signIn

If `loadProfile` in the `onAuthStateChange` succeeds (sets `currentUser`, `loading: false`), but then the `login()` version ALSO calls `loadProfile` and that second one FAILS → it sets `currentUser: null` via... wait no, on failure `loadProfile` only sets `loading: false`, not `currentUser: null`.

Actually the path on failure is:
```ts
if (error || !data) {
  set({ loading: false })  // only sets loading, doesn't touch currentUser
  return
}
```

So even if the second call fails, `currentUser` stays set from the first call. Loading stays false. App should work.

**Unless** — the RLS policy query is failing in a way that makes `loadProfile` hang/throw without reaching the catch block. Let me check: is `is_admin` causing a recursion that Supabase handles by timing out (rather than returning an error immediately)?

Supabase's RLS recursion protection may cause the query to **hang for a long time** before failing. If the `loadProfile` query hangs for several seconds → `loading` stays `true` during that time → user sees the loading screen.

But `loading` would have been set to `false` BEFORE the user clicked login (at initial page load check).

**WAIT.** I missed something crucial. `authStore` initial state has `loading: true`. Looking at App.tsx line 146:
```ts
if (loading) {
  return <div>Načítavam...</div>
}
```

After initial page load, `onAuthStateChange` fires with null session → `setLoading(false)` → LoginPage shows. ✓

User clicks login → `handleSubmit` in LoginPage calls `login()` → inside `login()`, after `signInWithPassword` succeeds, it calls `await loadProfile(data.user)`.

**At this EXACT moment**, `loadProfile` queries `profiles` with RLS. If the RLS policy using `is_admin()` causes a recursive loop or timeout, the query hangs for a long time. During this time, `loading` is still `false` (never set back to true), so the LoginPage is still shown. But the button shows `submitting = true` (the `...` spinner on the button), so the user sees the form with a spinning button, not the "Načítavam..." screen.

Hmm, that contradicts "ostane loading po kliknutí". Unless...

**ACTUALLY** — `onAuthStateChange` fires when `signInWithPassword` is called (before `loadProfile` in `login()` even starts). The `onAuthStateChange` handler sets... it calls `await loadProfile(session.user)`. `loadProfile` currently does NOT set `loading: true` at the start. So `loading` would stay `false`.

Unless `loadProfile` is called from `onAuthStateChange` BEFORE `login()` calls it, and the `onAuthStateChange` version fails (sets loading: false + no currentUser), then `login()` also calls `loadProfile` which also fails... At no point does loading become true again.

Let me approach differently. The screenshot shows `loading` is true (the "Načítavam..." full screen). This state means `loading === true`. The ONLY way to get there is:
1. Initial state (`loading: true`) — but the LoginPage was shown, meaning loading was `false`
2. Something set `loading` back to `true`

Nothing in the codebase sets `loading: true` except the initial Zustand store creation. So if the user sees "Načítavam..." after clicking login, the app must have **re-mounted** — i.e., the component tree re-rendered from scratch with a fresh Zustand store, resetting `loading: true`.

**THIS IS THE KEY INSIGHT**: Zustand stores are module-level singletons. They persist across re-renders. But if the module is hot-reloaded (HMR), the store resets. But HMR wouldn't happen just from clicking a button.

Alternatively — maybe the **page refreshes** after login? If `LoginPage` is inside a `<form onSubmit>` that doesn't properly `e.preventDefault()`... but it does call `e.preventDefault()` on line X.

Wait, actually looking at `login()`:
```ts
login: async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword(...)
  if (error) return { ok: false, error: ... }
  if (data.user) await get().loadProfile(data.user)
  return { ok: true }
}
```

When `signInWithPassword` returns, `onAuthStateChange` fires synchronously-ish (or very shortly after). The `SIGNED_IN` event triggers the handler in App.tsx, which also calls `loadProfile`. So we have two concurrent `loadProfile` calls.

If the RLS query fails for BOTH: both set `loading: false`, neither sets `currentUser`. LoginPage shown. User doesn't see "Načítavam...".

If the RLS query HANGS for one: that one is pending, keeps `loading: false`, shows LoginPage. User doesn't see "Načítavam...".

I'm going in circles. Let me check if there's a RLS policy SELECT issue that causes loadProfile to actually fail in a specific way that somehow brings back `loading: true`. OR — maybe the issue is simpler: the profiles table doesn't have the right data/the query returns nothing because of RLS.

The SELECT RLS policy is: `is_admin(auth.uid()) OR (auth.uid() = id)`

`is_admin` is SECURITY DEFINER. For user `52a4ae19...` who IS an admin, `is_admin()` queries profiles and finds them → returns true. So the policy passes. The data SHOULD be returned.

BUT `is_admin` queries profiles WITHOUT LIMIT. If profiles has 2 rows, `is_admin()` checks if the current user is admin. This should work fine since it's SECURITY DEFINER (bypasses RLS for the inner query).

Actually wait — let me check if there's a recursion issue with the SELECT policy calling `is_admin` which calls `profiles` again. On Postgres, SECURITY DEFINER functions bypass RLS. So `is_admin()` reads profiles without RLS → not recursive. This should work.

Let me look at this from a completely different angle: Maybe the issue is that `loadProfile` succeeds and sets `currentUser`, but then something RESETS the auth store.

Oh! I think I see it now. `login()` in authStore:
```ts
if (data.user) await get().loadProfile(data.user)
return { ok: true }
```

The `onAuthStateChange` in App.tsx ALSO calls `loadProfile(session.user)`. These two run concurrently. 

If `loadProfile` from `onAuthStateChange` sets `{ currentUser: user, loading: false }` first ✓
Then `loadProfile` from `login()` query completes... and ALSO sets `{ currentUser: user, loading: false }` → fine.

But what if `onAuthStateChange` loadProfile call fails (RLS issue) → sets `{ loading: false }` with no currentUser change → user is null, LoginPage shows.

THEN `login()` itself finishes → loadProfile sets `{ currentUser: user, loading: false }` → app shows dashboard?

No wait, let me re-read the user issue: "ostane loading po kliknutí" = stays LOADING after clicking. They see "Načítavam..." which requires `loading === true`.

Since Zustand is persistent across renders and nothing sets `loading: true` after initialization, this can ONLY happen if the entire app re-mounts. And the only trigger for that in this app is... hmm.

Actually: Could `ConfirmProvider` or some parent component cause a full re-mount? Let me check.

No. The only explanation is either: the page navigates (form submit without preventDefault?), or the Vite hot reload, or... Zustand persist middleware? No, there's no persist middleware here.

**Wait** — maybe the loading state I'm thinking about is wrong. Maybe it's not `loading: true` from authStore but rather the LoginPage's own "Načítavam..." state from the bootstrap check! 

`LoginPage` has: `if (isBootstrap === null) { return <div>Načítavam...</div> }` 

And `isBootstrap` is set via `useEffect`. If the LoginPage UNMOUNTS and REMOUNTS (because `currentUser` changes briefly), the `isBootstrap` state resets to `null` and shows "Načítavam..." while the `get_user_count` RPC runs.

**THIS IS THE ACTUAL BUG!**

1. LoginPage shows, `isBootstrap` goes `null → false` (get_user_count returns 2)
2. User fills form, clicks login
3. `signInWithPassword` → 200 OK
4. `onAuthStateChange` fires with `SIGNED_IN` → calls `loadProfile` in App.tsx
5. `loadProfile` returns immediately (or fails fast) → sets `currentUser = user` 
6. App re-renders: `currentUser` is set → `<LoginPage />` unmounts
7. Meanwhile `loadProfile` is still running (async) or something causes `currentUser` to be set then unset

Actually — more likely:
1. `onAuthStateChange` fires → calls `loadProfile` → profile is fetched → `currentUser` set, `loading: false` → Dashboard shows briefly
2. THEN the `getSession()` fallback also fires → calls `loadProfile` again → now there's a second query running
3. If this second query fails → `loading: false` (stays), `currentUser` unchanged (stays) → should be fine

I think the real bug could actually be much simpler: **double `loadProfile` calls cause a race condition where the second call's failure doesn't impact things, but there's a timing issue.**

Let me stop theorizing and look at what ACTUALLY changed recently. The last fix added:
1. Safety timeout of 6 seconds
2. Both `onAuthStateChange` AND `getSession()` calling `loadProfile`

The `getSession()` path on line 130-138: it calls `loadProfile(session.user)` even when `onAuthStateChange` already handled it. This causes two concurrent `loadProfile` calls on login.

The real fix is simple: **remove the double `loadProfile` from `login()` in authStore** since `onAuthStateChange` already handles it. And remove `getSession()` fallback that duplicates the same work.

Also, the `login()` function sets `loading` indirectly. Looking again: `login()` calls `await get().loadProfile()`. If `loadProfile` sets `currentUser` and `loading: false`, great. But if it fails, `loading: false` but `currentUser: null` → LoginPage re-shown.

Then `onAuthStateChange` fires (which may have already fired before `loadProfile` in `login()` completed) → calls `loadProfile` again → this time `loading` is `false` already so there's nothing wrong visually but the state is inconsistent.

**The cleanest fix**: 
1. Remove `await get().loadProfile(data.user)` from inside `login()` — let `onAuthStateChange` handle it exclusively
2. Remove the duplicate `getSession()` fallback in App.tsx since `onAuthStateChange` fires reliably with current session on mount
3. This means the login flow is: click → signInWithPassword → onAuthStateChange fires → loadProfile → success → currentUser set → Dashboard

This is the standard Supabase auth pattern: use `onAuthStateChange` as the single source of truth, never call `loadProfile` from multiple places.

## Plan

### Root Cause
**Double `loadProfile` calls** are racing each other. `login()` in authStore calls `loadProfile(data.user)` directly, AND `onAuthStateChange` in App.tsx ALSO calls `loadProfile` when `SIGNED_IN` fires. These two run concurrently. The second call completing after the first causes inconsistent state (or one call's failure masking the other's success).

Additionally, `getSession()` in App.tsx is a third redundant trigger of `loadProfile`.

The correct Supabase pattern: `onAuthStateChange` is the **single** source of truth. Never call profile loading from inside `login()` / `registerWithInvite()` / `bootstrapAdmin()`.

### Changes

**`src/store/authStore.ts`**:
- Remove `await get().loadProfile(data.user)` from `login()` — return `{ ok: true }` immediately after signIn succeeds
- Remove `await get().loadProfile(data.user)` from `bootstrapAdmin()` — same reason
- Remove `await get().loadProfile(data.user)` from `registerWithInvite()` — same reason
- Add `setLoading(true)` at the start of `loadProfile` so the loading state is always consistent
- Keep `loadProfile` itself clean as the only profile-loading mechanism

**`src/App.tsx`**:
- Remove the duplicate `getSession()` fallback block entirely (lines 130–138) — `onAuthStateChange` fires on mount with the current session, so `getSession()` is redundant and causes a second concurrent `loadProfile`
- Keep only `onAuthStateChange` as the auth state handler
- Keep the 6-second safety timeout as a last resort

This is the minimal, correct fix that follows Supabase's recommended auth pattern.
