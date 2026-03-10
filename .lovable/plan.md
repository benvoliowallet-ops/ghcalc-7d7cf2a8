## Root Cause (Precise)

**Problem 1 — Double/triple `loadProfile`:**
`App.tsx` runs both `getSession()` AND `onAuthStateChange()` in the same `useEffect`. On page load with an active session, Supabase fires `INITIAL_SESSION` (or `SIGNED_IN`) immediately from `onAuthStateChange`, so `loadProfile` is called twice before the component even settles. React Strict Mode (dev) doubles the effect, producing 3 calls → 3 `GET /profiles?id=eq.{userId}`.

**Problem 2 — `useLoadProjects` fires 3× due to unstable deps:**
`useLoadProjects` has `[currentUser, setSavedProjects]` as deps. `setSavedProjects` is a Zustand action that gets a **new function reference** on every store update. Every `loadProfile` call sets a new `currentUser` object even if data is identical (object equality fails). 3 profile loads → 3 `currentUser` object sets → 3 `useLoadProjects` fetches → 3× `/projects` + 3× `/profiles?id=in.(...)`.

---

## Fix

### 1. `src/App.tsx` — deduplicate auth bootstrap

Replace the two-path bootstrap (getSession + onAuthStateChange) with a **single path**: use only `onAuthStateChange`, which always fires `INITIAL_SESSION` on mount with the current session (null or valid). Drop the separate `getSession()` call entirely.

```ts
// BEFORE (fires loadProfile twice):
supabase.auth.getSession().then(({ data: { session } }) => {
  if (session?.user) loadProfile(session.user);
  else { setCurrentUser(null); setLoading(false); }
});
supabase.auth.onAuthStateChange((_event, session) => {
  if (session?.user) loadProfile(session.user);
  else { setCurrentUser(null); setLoading(false); }
});

// AFTER (fires exactly once):
const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
  if (session?.user) loadProfile(session.user);
  else { setCurrentUser(null); setLoading(false); }
});
```

### 2. `src/store/authStore.ts` — guard against redundant profile loads

Add a `_loadingUserId` guard inside `loadProfile` to skip if a fetch for the same user is already in-flight or already loaded:

```ts
loadProfile: async (user: SupabaseUser) => {
  // Skip if we already have this user loaded
  const state = get(); // (need to expose get() via create((set, get) => ...)
  if (state.currentUser?.id === user.id) return;
  // ... rest of existing fetch logic
}
```

This requires changing `create<AuthStore>((set) => ...)` to `create<AuthStore>()((set, get) => ...)` (curried form needed to access `get`).

### 3. `src/hooks/useProjects.ts` — stable deps + load-once guard

Two changes:

1. Remove `setSavedProjects` from deps (it's a stable Zustand action but React doesn't know that — pull it outside with `useRef` or just exclude it):
  ```ts
   const setSavedProjects = useProjectStore((s) => s.setSavedProjects);
   const setSavedProjectsRef = useRef(setSavedProjects);
   setSavedProjectsRef.current = setSavedProjects;
  ```
2. Guard with `useRef` to only load once per `currentUser.id` change (not on object reference change):
  ```ts
   const loadedForRef = useRef<string | null>(null);
   useEffect(() => {
     if (!currentUser) return;
     if (loadedForRef.current === currentUser.id) return; // skip re-fetch for same user
     loadedForRef.current = currentUser.id;
     loadProjects(); // single fetch
   }, [currentUser?.id]); // use .id as dep, not the whole object
  ```

---

## Summary of file changes


| File                       | Change                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------ |
| `src/App.tsx`              | Remove `getSession()` call; keep only `onAuthStateChange` handler                          |
| `src/store/authStore.ts`   | Change to `(set, get)` curried form; add `id` guard at start of `loadProfile`              |
| `src/hooks/useProjects.ts` | Use `currentUser?.id` as dep; add `loadedForRef` guard to prevent re-fetches for same user |


Important: After removing getSession(), make sure the initial 

loading state is handled correctly — the app should remain in 

loading state until onAuthStateChange fires its first event 

(INITIAL_SESSION). Do not set loading=false prematurely 

before the first auth event arrives.  
  
No component, type, or DB changes needed.