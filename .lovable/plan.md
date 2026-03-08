

## Full Codebase Audit — Prioritized Report

### CRITICAL (breaks functionality / data loss risk)

**C1 — `deleteSavedProject` only removes from local store, NOT from Supabase**
- `projectStore.ts` line 190-192: `deleteSavedProject` only does `set(s => ({ savedProjects: s.savedProjects.filter(...) }))` — there is no `supabase.from('projects').delete()` call.
- Result: project disappears from UI but remains forever in the database. On next login it reappears.
- Files: `src/store/projectStore.ts`, `src/components/Dashboard.tsx`

**C2 — `useSupabaseItems.ts` imports from the stub `lib/supabaseClient.ts` (not the real client)**
- Line 3: `import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'` — the stub always returns `isSupabaseConfigured = false`, so `useNormistChecker` in Step8 NEVER fetches live NORMIST codes from the DB.
- The `isNormist()` check that classifies BOM lines falls back to string-prefix matching only (NOR, NORMIST, NMC...). Any newly added stock item with supplier=NORMIST whose code doesn't start with those prefixes will be misclassified.
- Files: `src/hooks/useSupabaseItems.ts`, `src/lib/supabaseClient.ts`

**C3 — `useState` misused as `useEffect` in `LoginPage.tsx`**
- Line 97-103: `useState(() => { supabase.from('profiles').select(...) })` — using `useState` initializer to run an async side effect. This is a React anti-pattern; the async call result is never captured back in state correctly because `useState` initializers are synchronous. The `setIsBootstrap` call inside the promise works by closure but the initializer itself should be `useEffect`.
- This can cause the "Načítavam..." screen to hang if the Supabase call is slow on first render, since `isBootstrap` starts as `null` and blocks rendering.
- Files: `src/components/auth/LoginPage.tsx`

**C4 — `Step9_PreOrderCheck` rope overrides ignored in BOM (Steps 8 & 10)**
- Steps 8 and 10 both read `calc.ropeLength` directly from `zoneCalcs` for the rope quantity in BOM lines, **completely ignoring `ropeOverrides`** from the store.
- User can set overrides in Step 9, but the actual order documents use the old values. This is a data correctness bug.
- Files: `src/components/steps/Step8_Documents.tsx` line 67, `src/components/steps/Step10_OrderForm.tsx` line 55

**C5 — `pumpConnectorMeters` and `etnaDistance`/`etnaCustomCost` in Step9 are local state only**
- These values are entered in Step 9 but never persisted to the store or Supabase. If the user navigates away from Step 9 and comes back, all entered values reset to defaults.
- The `etnaCustomCost` is also never fed back into Step 8 BOM (Step 8 always uses the hardcoded 200 €).
- Files: `src/components/steps/Step9_PreOrderCheck.tsx`

**C6 — `useAutoSave` only triggers when `view === 'project'`**
- `AutoSaveSubscriber` in `App.tsx` line 72 returns early when `view !== 'project'`. This means if a user edits stock or goes to another view, the currently open project state from store is NOT auto-saved. The debounce timer from a previous edit might fire after navigation to another view and then correctly save, but there's a race condition window.
- More critically: `debouncedSave` is defined in `useAutoSave` but `immediateSave` (for CAD) is never actually called anywhere — the CAD autosave (immediate save on `addSegment`/`removeSegment`) was planned but **never wired up**.
- Files: `src/App.tsx`, `src/hooks/useProjects.ts`

---

### HIGH (significant bugs, security, data integrity)

**H1 — `handleDeleteUser` in `UsersPage` only deletes from `profiles` table**
- Line 101: `supabase.from('profiles').delete().eq('id', id)` — deletes the profile but not the Supabase Auth user. The user can still log in with their credentials. RLS policies check `auth.uid()` from the auth system, not the profiles table. After profile deletion, their auth session still works but `loadProfile` will fail → stuck loading.
- Fix: needs an admin Edge Function calling `supabase.auth.admin.deleteUser(id)`.
- Files: `src/components/admin/UsersPage.tsx`

**H2 — `stockStore.ts` is a dead localStorage duplicate that's never used**
- `src/store/stockStore.ts` is a complete old localStorage-based stock store. It's never imported anywhere (search confirms 0 consumers), but it's still in the codebase taking up space and could confuse developers. It also persists under `greenhouse-stock` key in localStorage — will conflict if someone ever imports it.
- Files: `src/store/stockStore.ts`

**H3 — Hardcoded prices in BOM generation (Steps 8 & 10) bypass the live stock database**
- BOM lines for nozzles, fittings, rope, hangers etc. all use hardcoded `price` values (`1.23`, `0.15`, `2.4`, etc.) instead of looking up current prices from the `stock_items` table.
- When an admin updates a price in the Sklad, the BOM documents continue to show old prices.
- Files: `src/components/steps/Step8_Documents.tsx` (throughout), `src/components/steps/Step10_OrderForm.tsx`

**H4 — Console warning: `ConfirmProvider` / `AppInner` function components given refs**
- Console shows 3x "Function components cannot be given refs" pointing at `ConfirmProvider` and `AppInner`. This is because `App.tsx` wraps `AppInner` in `ConfirmProvider` and something in the render tree passes a ref to a function component without `forwardRef`. This is a React warning that can cause silent failures with ref-based libraries. The `useRef` in `useConfirm.tsx` at line 12 is imported but never actually used (the `useRef` import is unused).
- Files: `src/hooks/useConfirm.tsx`, `src/App.tsx`

**H5 — `useLoadProjects` loads projects from DB but never re-fetches on project save**
- Projects are loaded once on mount when `currentUser` changes. But when `saveCurrentProject` or the auto-save writes to DB, the `savedProjects` in the store is only updated locally (the store update in `saveCurrentProject` writes to `savedProjects` array, not DB). After logout/login, the DB version is loaded. But between sessions, the DB and local store can diverge if one is updated.
- The `saveCurrentProject` store action doesn't call Supabase at all — only updates the local `savedProjects` array. The actual DB save happens separately via `useProjectSaver`. So the `savedAt` timestamp and `currentStep` in the DB record may lag behind.
- Files: `src/store/projectStore.ts` line 165-182, `src/hooks/useProjects.ts`

**H6 — No `React` import in `Sidebar.tsx` but uses JSX**
- `Sidebar.tsx` line 1 imports from `lucide-react` and `authStore` but has `React.ElementType` typed in the `NavItem` interface without importing React. Works with the current Vite/SWC config due to automatic JSX transform, but the `React.ElementType` type reference on line 16 requires React to be in scope for TypeScript.
- Files: `src/components/Sidebar.tsx`

---

### MEDIUM (incorrect behavior, inconsistencies, UX problems)

**M1 — Step3_Zones uses hardcoded Tailwind colors inconsistent with design system**
- Zone tab buttons: `border-green-500 bg-green-50 text-green-700 border-gray-200 bg-white text-gray-600` (lines 96-99)
- Tab strip: `bg-green-50 text-green-700 border-green-500 text-gray-500` (lines 105-110)
- All other pages in the app use the design token system (`text-teal`, `bg-card`, `border-border`, etc.)
- This creates a visual inconsistency — Step3 looks like a completely different app.
- Same issue in Step4 (red-50, red-200, red-500), Step5 (gray-100, gray-700, gray-800), Step8 (white, gray-50, gray-100, blue-100), Step10 (gray-800, green-50, green-300, blue-700)

**M2 — `spacingOptions` labels show wrong unit (cm vs mm)**
- `Step3_Zones.tsx` line 55: `const spacingOptions = [200, 250, 300, 350, 400, 450, 500].map((v) => ({ value: v, label: `${v} cm` }))` — but `nozzleSpacing` in the data model and calculations uses **mm** internally (divisions show `zone.nozzleSpacing / 100` for conversion). The label says "cm" but the value stored is mm. So "400 cm" actually means 400 mm = 40 cm. The label is wrong; should say "mm".
- Files: `src/components/steps/Step3_Zones.tsx` line 55, `src/types/index.ts` line 80

**M3 — `MVEMKCS2X1PVCW` cable price in stock differs from BOM**
- `stockItems.ts` line 42: CYSY 2×1 price = `0.3672`
- `Step8_Documents.tsx` line 78: hardcoded as `0.367`
- `Step10_OrderForm.tsx` line 92: hardcoded as `0.367`
- Discrepancy of 0.0002 per meter, harmless now but confirms the broader issue of hardcoded prices vs. live stock DB.

**M4 — `useRef` imported but unused in `useConfirm.tsx`**
- Line 1: `import React, { createContext, useContext, useState, useCallback, useRef } from 'react'` — `useRef` is never used anywhere in the file. Minor but generates unused import warning.
- Files: `src/hooks/useConfirm.tsx`

**M5 — `Step9_PreOrderCheck` `useEffect` has missing dependencies**
- Line 22-28: `useEffect(() => { ... }, [globalParams.numberOfZones])` — calls `setRopeOverrides` and `setLocalRopeOverrides` but neither is in the dependency array. ESLint suppression is missing here. Will re-run correctly but causes React dev warnings.

**M6 — `AuthStore.bootstrapAdmin` sets role via profile update but `handle_new_user` trigger already runs**
- Lines 86-90: after `signUp`, immediately does `update({ role: 'admin' })` on profiles. But the `handle_new_user` DB trigger runs first (async on the server) and sets role based on `invited_role` metadata. There's a race condition: the trigger might run with `admin` (because no profiles exist) or the client might win first. The `ON CONFLICT (id) DO NOTHING` in the trigger means if the client update runs first, the trigger is a no-op, and vice versa. Generally works but fragile.

**M7 — `Step8_Documents.tsx` and `Step10_OrderForm.tsx` use `snfg.004.00016` (extra zero in code)**
- `stockItems.ts` line 63: code is `snfg.004.00016` — this has a double zero. Both Step8 (line 82) and Step10 use this code. Inconsistent with `snfg.004.0017` pattern. Probably intentional but suspicious.

**M8 — `Step10` rope quantity uses `calc.ropeLength` not `ropeOverrides`**
- Already mentioned in C4 but specifically in Step10 line 55: `if (globalParams.steelRope === 'SS_NEREZ') totalRopeSS += calc.ropeLength` — ignores `ropeOverrides[i]`.

**M9 — `AutoSaveSubscriber` subscribes to entire store object causing excessive re-renders**
- `App.tsx` line 69: `const store = useProjectStore()` — subscribes to the entire store. Any store mutation causes the component to re-render and re-evaluate the snapshot, queuing a debounced save. This is by design but means every store mutation fires the subscriber twice (once in the mutating component, once in AutoSaveSubscriber).

**M10 — `Step3_Zones` `useEffect(() => { recalcAllZones(); }, [])` missing dependency**
- Line 44: empty deps array with a call to `recalcAllZones` that closes over store state. Safe in practice (only runs on mount), but the ESLint warning is suppressed silently without a comment.

---

### LOW / MINOR (code quality, dead code, UI polish)

**L1 — `src/store/stockStore.ts` — completely dead code, never imported**
- Full 84-line file implementing a localStorage-based stock store. No component imports it. Should be deleted.

**L2 — `src/lib/supabaseClient.ts` — misleading stub still in codebase**
- The stub exports `isSupabaseConfigured = false` and a fake `supabase` object. Only `useSupabaseItems.ts` imports it. This file should either be deleted or `useSupabaseItems.ts` should be updated to use the real client.

**L3 — `User` interface in `types/index.ts` has `passwordHash` field**
- Line 220: `passwordHash: string` — this is a leftover from the old localStorage auth system. No component uses it. Leftover dead type definition.

**L4 — `useRef` imported unused in `useConfirm.tsx`** (see M4)

**L5 — Duplicate nozzle codes in `stockItems.ts`**
- `NOR NMC25S303C-AD` (line 5) and `NMC25S303C-AD` (line 90) — similar names, both D0.25 nozzles, different codes. One is used in BOM via `NOZZLE_BY_ORIFICE` (uses `NMC25S303C-AD`), the other appears to be a duplicate entry.
- Similarly: `NOR 0104003-KIT` (line 18) and `0104003-kit` (line 19) — same item, two entries with different casing.

**L6 — App title inconsistency: "Greenhouse Calc" vs "GreenHouse Calc"**
- `LoginPage.tsx` line 205: `"Greenhouse Calc"` (lowercase 'h')
- `Sidebar.tsx` line 44: `"GreenHouse Calc"` (capital 'H')
- `App.tsx` footer line 286: `"GreenHouse Calc · 2026 · v13"`
- The LoginPage uses the lowercase version.

**L7 — Emoji used in admin/section headings not matching the vector icon design language**
- `UsersPage.tsx` line 119: `👥 Správa používateľov` 
- `StockPage.tsx` line 71: `📦 Skladové karty`
- `ChangeLogPage.tsx` line 34: `📋 Log zmien`
- All other navigation uses vector Lucide icons. These heading emojis are inconsistent.

**L8 — Delete button in `Dashboard.tsx` uses emoji 🗑 (line 131) instead of Lucide `Trash2` icon**
- Same in `StockPage.tsx` line 138, `UsersPage.tsx` line 177 — uses emoji `🗑` instead of Lucide icons.

**L9 — `src/components/ui/toaster.tsx` exists but `Toaster` component is never mounted in `App.tsx`**
- The `Toaster` (for `useToast` hook) is defined but never added to the component tree. Any `useToast()` calls would silently fail to show toasts. Sonner's `<Toaster>` from `sonner` package is also not mounted.

**L10 — `src/main.tsx` should be checked for Toaster mounting** (likely missing)

**L11 — `getPipe10mmForSpacing` in `stockItems.ts` line 122 — returns 4000mm pipe for spacing > 300, but spacings 350, 400, 450, 500 could use different pipe lengths**
- All spacings > 300 get the 4000mm pipe. There's no differentiation for 350, 400, 450, 500mm spacing. May be intentional by domain knowledge but undocumented.

**L12 — `Step6_Costs.tsx` uses `as any` casts for `costInputs` dynamic keys**
- Lines 75-83: `(costInputs as any)[row.daysKey]` — bypasses TypeScript type safety. Should be typed properly with a key union type.

**L13 — `PUMP_TABLE` in `calculations.ts` only has 4 entries (AR50, AR60, AR70, AR100)**
- `stockItems.ts` has `NORMIST_PUMP_AR42`, `NORMIST_PUMP_AR55`, `NORMIST_PUMP_AR65` in the stock list, but these don't appear in `PUMP_TABLE`. The pump selection logic uses `PUMP_TABLE.find(p => p.maxFlow >= flowLpm)` — if flow is < 50 lpm, it hits `AR50`. But `AR42` and smaller pumps from stockItems are never considered.

**L14 — No loading spinner/skeleton for `StockPage` while DB loads**
- `StockPage.tsx` shows just a small `loading` text inline ("· načítavam..."). On slow connections the table header appears empty briefly. No full loading state.

**L15 — `useStockItems` seeds the entire stock DB on first run but doesn't check if admin**
- `useStockDB.ts` line 48-64: seeding runs for ANY authenticated user when DB is empty. Non-admin users cannot insert (RLS blocks admins only), so seeding would silently fail for non-admin users and show static data.

**L16 — `src/App.tsx` mounts `<AutoSaveSubscriber view={view} />` inside the main `div` as a sibling to `<Sidebar>`**
- The component returns `null` so it's technically fine as a render-null component, but it's unconventional. Better placed at the top of `AppInner` return, not inside the layout div.

---

### Summary Table

| ID | Severity | Area | Fix Effort |
|----|----------|------|------------|
| C1 | 🔴 CRITICAL | Data persistence | Small |
| C2 | 🔴 CRITICAL | BOM correctness | Small |
| C3 | 🔴 CRITICAL | Auth reliability | Small |
| C4 | 🔴 CRITICAL | BOM/Order correctness | Medium |
| C5 | 🔴 CRITICAL | Data loss Step9 | Medium |
| C6 | 🔴 CRITICAL | CAD autosave missing | Medium |
| H1 | 🟠 HIGH | Security / User mgmt | Medium |
| H2 | 🟠 HIGH | Dead code / confusion | Trivial |
| H3 | 🟠 HIGH | BOM price accuracy | Large |
| H4 | 🟠 HIGH | React warning / refs | Small |
| H5 | 🟠 HIGH | Sync consistency | Medium |
| H6 | 🟠 HIGH | TypeScript / runtime | Trivial |
| M1 | 🟡 MEDIUM | UI consistency | Medium |
| M2 | 🟡 MEDIUM | UX / unit labeling | Trivial |
| M3 | 🟡 MEDIUM | Price accuracy | Trivial |
| M4 | 🟡 MEDIUM | Code quality | Trivial |
| M5 | 🟡 MEDIUM | React hooks | Small |
| M6 | 🟡 MEDIUM | Auth race condition | Small |
| L1-L16 | 🟢 LOW | Various | Trivial–Small |

