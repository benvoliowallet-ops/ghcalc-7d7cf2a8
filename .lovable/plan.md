

## Full Codebase Audit — Second Pass (Post-Fix State)

### What was fixed since last audit
- C1: deleteSavedProject now calls Supabase delete ✓
- C2: useSupabaseItems.ts now uses real client ✓
- C3: LoginPage useState→useEffect fix ✓
- C4: ropeOverrides used in Steps 8 & 10 ✓
- C5: preOrderState persisted via store ✓
- H2/L1/L2: stockStore.ts and supabaseClient.ts deleted ✓
- H6: React import added in Sidebar.tsx ✓
- M2: spacingOptions label changed to "mm" ✓

### NEW CRITICAL ISSUES FOUND IN THIS PASS

**NC1 — CRITICAL: `StockItemModal` calls `useStockMutations(() => {})` with a no-op reload**
`StockItemModal.tsx` line 18: `const { addItem, updateItem } = useStockMutations(() => {})` — passes an empty no-op reload function. After adding or editing an item, the parent `StockPage` does NOT reload; it passes `onClose={() => { setAddNew(false); reload(); }}` which calls the parent's `reload`. But inside the modal, the `addItem`/`updateItem` from the no-op instance also calls `reload()` — but that's the no-op. The real reload is called from `onClose` in `StockPage`. 
This is technically functional (parent reload fires on close), BUT the pattern is broken architecture — the mutations hook internally calls `reload()` at line 108 with the no-op, while the parent calls the real reload separately. If `onClose` isn't called (e.g., modal closed some other way), no reload fires. 

**NC2 — CRITICAL: `useNormistChecker` has a race condition causing WRONG BOM classification**
`useSupabaseItems.ts` lines 61-77: The `isNormist()` function checks `if (loaded && normistCodes.size > 0)`. If the Supabase query returns 0 NORMIST items (e.g., DB not yet seeded, or network error that sets `loaded=true` but `normistCodes.size=0`), it falls through to the **string prefix fallback** (`code.startsWith('NOR')` etc.). 

The real problem: `isNormist` is called synchronously DURING RENDER of Step8 (in the BOM generation code at line 110). At first render, `loaded=false` and `normistCodes.size=0` → fallback runs. BUT the fallback relies on the static `STOCK_ITEMS` array. BOM codes like `ETNA_ACC`, `BPONG-005-P2PWE`, `TELTONIKA_GSM`, `NORMIST_DANFOSS`, `snfg.006.0001`, `183022000`, `RACMET 182022000`, `ITALINOX` etc. are NOT in STOCK_ITEMS — so `STOCK_ITEMS.find(i => i.code === code)` returns undefined and it falls to the prefix check. The prefixes are: `NOR`, `NORMIST`, `NMC`, `NORMIST_PUMP`, `NORMIST_UV`, `NORMIST_30SS`. This means `NORMIST_DANFOSS` (Danfoss Drive, 954€) is being classified as NORMIST → price shown as `—` in BOM incorrectly!

**NC3 — CRITICAL: `useAutoSave` timer NOT cleaned up on unmount → potential memory leak + ghost save**
`useProjects.ts` line 89: `timerRef.current = setTimeout(() => save(snapshot), 2000)` — there is no cleanup via `useEffect` return. If the component unmounts (user logs out mid-debounce), the timer fires 2 seconds later, calling `save()` with a stale `currentUser` from the closure. The `currentUser` check inside `save` prevents the actual DB write, but `setSaveStatus` is still called on an unmounted component. No `useEffect` cleanup anywhere in `useAutoSave`.

**NC4 — CRITICAL: `getPipe10mmForSpacing` parameter is treated as mm in `calculations.ts` but function uses `spacingCm` as name**
`stockItems.ts` line 118: function signature is `getPipe10mmForSpacing(spacingCm: number)`. In `calculations.ts` line 48 it is called as `const pipe10mm = getPipe10mmForSpacing(zone.nozzleSpacing)`. BUT `zone.nozzleSpacing` is in **mm** (confirmed by types/index.ts line 81: `/** Stored in mm internally */`). The function threshold `if (spacingCm <= 200)` with a 200mm value correctly picks the 2000mm pipe. For 400mm spacing it returns the 4000mm pipe (since 400 > 300). 
**The results happen to be correct numerically** — the "cm" name is just misleading. But this confirms the M2 naming confusion noted in last audit. Not actually broken but a ticking time bomb for future maintenance.

**NC5 — HIGH: `bootstrapAdmin` in authStore has wrong profile check — can fail silently**
`authStore.ts` lines 86-90: After `signUp`, immediately calls `supabase.from('profiles').update({ role: 'admin', name }).eq('id', data.user.id)`. But the `handle_new_user` DB trigger runs asynchronously AFTER the signUp. The profile row might not exist yet when the update runs → the update affects 0 rows but returns no error. The `loadProfile` call then runs, which should read the profile created by the trigger. But if the trigger hasn't finished, `loadProfile` returns error → `loading` stays `true` → stuck loading screen.

**NC6 — HIGH: `deleteSavedProject` uses dynamic `import()` — no error shown to user if delete fails**
`projectStore.ts` lines 207-211: Uses dynamic `import('@/integrations/supabase/client')` inside a store action. The `console.error` on line 209 is the only output — the UI shows the project deleted (it's already removed from local state before the DB call). If Supabase delete fails (network issue, permissions), the project re-appears on next login with no user feedback.

---

### REMAINING ISSUES FROM PREVIOUS AUDIT (not yet fixed)

**H3 — HIGH: Hardcoded prices in BOM (Steps 8 & 10) bypass live stock database**
All BOM line prices are still hardcoded: nozzles (1.23), hangers (0.23), rope (0.15), CYSY cable (0.367), fittings (2.4), etc. When an admin updates a price in Sklad, BOM documents don't reflect it. This was previously identified and remains unfixed.

**H4 — HIGH: `useStockItems` seeds DB for ANY authenticated user, not just admins**
`useStockDB.ts` lines 44-64: Seeding runs for any logged-in user when DB is empty. Non-admin RLS policy blocks the inserts silently. The `upsert` calls fail with no feedback, and the function falls back to `setItems(STOCK_ITEMS)` which looks fine. But this means the DB is NEVER seeded if the first login is a non-admin user. Admins might not realize seeding failed.

**M1 — MEDIUM: Hardcoded Tailwind colors in Steps 3, 5, 6, 7, 8, 10**
All still present:
- `Step3_Zones.tsx`: `border-green-500`, `bg-green-50`, `text-green-700`, `border-gray-200`, `text-gray-600`, `bg-gray-50`, `text-gray-800`
- `Step5_PumpETNA.tsx`: `border-gray-100`, `text-gray-400`, `text-gray-800`, `text-gray-500`
- `Step6_Costs.tsx`: `bg-gray-50`, `text-gray-600`, `text-gray-800`, `text-gray-500`, `bg-blue-50`, `text-blue-700`, `border-blue-200`, `text-blue-800`, `text-blue-600`
- `Step7_Normist.tsx`: `text-gray-800`, `text-gray-500`, `bg-gray-50`
- `Step8_Documents.tsx`: `text-gray-600`, `bg-white`, `bg-gray-50`, `text-gray-800`, `text-gray-500`, `text-blue-700`, `bg-blue-100`, `text-blue-700`, `bg-green-50`, `text-green-700`, `border-green-200`, `border-green-700`
- `Step10_OrderForm.tsx`: `text-gray-500`, `bg-white`, `bg-gray-50`, `bg-green-50`, `text-green-800`, `text-gray-800`, `text-blue-700`, `text-green-700`, `bg-gray-800`, `border-green-300`, `text-gray-400`
- `Step4_PumpSelection.tsx`: `bg-red-50`, `border-red-200`, `border-l-red-500`, `text-red-700`, `text-red-600`
- `Step6_Costs.tsx`: also uses `text-gray-600` in the amber-500 colored instruction step numbers

**M3 — MEDIUM: `NORMIST_DANFOSS` misclassified** (see NC2 above — upgraded from M to Critical)

**L5 — LOW: Duplicate stock codes still in `stockItems.ts`**
- `NOR NMC25S303C-AD` (line 5) AND `NMC25S303C-AD` (line 90) — both D0.25 nozzles
- `NOR 0104003-KIT` (line 18) AND `0104003-kit` (line 19) — same Pressure Switch Kit
- `NORMIST HANGER 40cm` (line 16) AND `MVUZTLN400MMAKNS` (line 17) — same hanger
- `NORMIST 204091` (line 39) AND `204091` (line 20) — same Keller transmitter
- `NORMIST 0204013A` (line 40) AND `0204013A` (line 21) — same solenoid
- `KOH000000606` (line 41) AND `MVEMKCS2X1PVCW` (line 42) — same CYSY cable

**L6 — LOW: App title inconsistency** — "Greenhouse Calc" (LoginPage) vs "GreenHouse Calc" (Sidebar + App footer)

**L7 — LOW: Emoji headings** — `👥`, `📦`, `📋`, `📩`, `👤`, `👑` still present in `UsersPage.tsx`, `StockPage.tsx`, `ChangeLogPage.tsx`, `Step10_OrderForm.tsx` (`📋`). Design language is vector icons elsewhere.

**L8 — LOW: Emoji action buttons** — `🗑` in `Dashboard.tsx` (line 131), `StockPage.tsx` (line 138), `UsersPage.tsx` (line 193). `✏️` in `StockPage.tsx` (line 137). Should be Lucide icons.

**L9 — LOW: `Toaster` from `toaster.tsx` is mounted but uses `useToast` hook**
`main.tsx` imports and mounts `Toaster` from `@/components/ui/toaster`. However, no component in the entire codebase calls `useToast()` — the toaster is mounted but never triggered. `sonner`'s `<Toaster>` is also NOT mounted anywhere. The `sonner` package is installed and used as an import in `ui/sonner.tsx` but that component is never mounted.

**L11 — LOW: `generateQuoteNumber()` uses `Math.random()` — no uniqueness guarantee**
`calculations.ts` line 349: `PP-YY{1000-9999}` — with only 9000 possibilities per year, collision chance is ~1% after ~90 quotes (birthday paradox). Not critical but noteworthy.

**L12 — LOW: `inspectionFixed` and `designFixed` in `CostInputs` are never editable**
`Step6_Costs.tsx` lines 91-97: Both values are hardcoded display (200 €) and ignored in the `totalLabour` calculation (line 41 uses `costInputs.inspectionFixed` as part of the total — wait, checking... line 39: `costInputs.inspectionFixed + costInputs.designFixed` IS included in `totalLabour`). But in the BOM/Step8, these are replaced by a single hardcoded `add('SANFOG_PROJEKTO', '...', 1, 'ks', 400)` line which correctly combines them. **Actually fine**, but the UI hides the fact these are user-adjustable.

**L13 — LOW: `Step8_Documents.tsx` line 171: `text-gray-600` used inside a Card component**
Card subtitle uses raw Tailwind: `<p className="text-sm text-gray-600 mb-4">` — this is inside the `Step8` file at the card for NAZLI info. A semantic class should be used.

**L14 — LOW: `Step5_PumpETNA.tsx` imports `useItemsByGroup` which fetches ALL UV lamp items from DB without auth check**
`useItemsByGroup` (useSupabaseItems.ts line 6) doesn't check if the user is authenticated before querying. The Supabase RLS blocks unauthenticated reads, so it just silently returns static data. But after login, the hook re-fires once (because `group` stays constant). The UV items list is populated correctly. Not broken, but missing auth guard creates console warnings.

**L15 — LOW: `nozzleSpacingM` calculation uses `/100` but spacing is in mm (should be `/1000`)**
`calculations.ts` line 37: `const nozzleSpacingM = zone.nozzleSpacing / 100`. With nozzleSpacing in mm (e.g. 400mm), dividing by 100 gives 4.0 — but 400mm = 0.4m. The conversion **should be `/1000`**. This means nozzle spacing is calculated as 10× too large!
- With 400mm spacing (= 0.4m), the code calculates `nozzleSpacingM = 400/100 = 4.0m` not 0.4m
- `nozzlesPerNaveRaw = Math.floor(50 / 4.0) + 1 = 13` 
- With correct 0.4m spacing: `Math.floor(50 / 0.4) + 1 = 126`
**This is a MAJOR CALCULATION BUG** — the nozzle count is wrong by a factor of ~10!

Wait... let me check if there's something else going on. Looking at spacingOptions:
`const spacingOptions = [200, 250, 300, 350, 400, 450, 500].map((v) => ({ value: v, label: `${v} mm` }))` — so 400 is "400mm"

And in types: `/** Stored in mm internally */` for nozzleSpacing: `200 | 250 | 300 | 350 | 400 | 450 | 500`

But in calculations.ts line 37: `const nozzleSpacingM = zone.nozzleSpacing / 100;`

For spacing=400: nozzleSpacingM = 4.0m. This gives ~13 nozzles per 50m nave with 0.75m wall offset. That seems very few for a fog system.

BUT the previous audit explicitly said "M2: spacingOptions labels show wrong unit (cm vs mm)" and the fix was to change the LABEL to "mm" — but maybe the VALUES were actually intended to be cm all along?

Looking at `generateNozzleCombos` in calculations.ts line 382-383:
```
const spacingM = spacingCm / 100;
```
And line 369: `const COMBO_SPACINGS = [200, 250, 300, 350, 400, 450, 500] as const;`
The parameter is named `spacingCm` suggesting these values ARE in cm (200cm = 2m, 400cm = 4m). 

So the stored values are in **cm** not **mm**! The type comment on line 81 says "Stored in mm internally" but the actual calculations treat it as cm. The label was previously "cm" (which was actually correct!), and was "fixed" to say "mm" when the values are actually in cm.

This means:
1. The calculations are correct (values are cm, /100 = meters)
2. The type comment in `types/index.ts` says "Stored in mm internally" — WRONG
3. The M2 fix changed the label from "cm" to "mm" — this was the WRONG FIX. It should stay as "cm" or the values should be divided by 10 to make them actual mm.

**The M2 "fix" introduced incorrect labeling.** The correct label is "cm" or the values should be listed as 2000, 2500 etc. mm.

---

### PERFORMANCE

**P1 — `AutoSaveSubscriber` fires on EVERY store mutation, including active save status changes**
`App.tsx` depends array includes `store.zoneCalcs` which is recalculated constantly (every zone update triggers `setTimeout → recalcAllZones`). This means: user edits a zone → recalcAllZones fires → zoneCalcs changes → AutoSaveSubscriber's effect triggers again → debounce resets. Fine behavior, but `store.saveStatus` is NOT in the deps, yet `useProjectStore()` (full store subscription) re-renders this component on saveStatus changes. Then `store.saveStatus` changes during save ('idle'→'saving'→'saved'→'idle') cause the effect to fire 3-4 more times with stale snapshot. Each fires a new debounce. Minor but wasteful.

**P2 — `StockPage` filtered computation runs on every render**
`StockPage.tsx` lines 23-42: The `filtered` computation is an IIFE (not `useMemo`). It runs on every render including when unrelated state changes. With 92+ items and a sort, this is O(n log n) on every render. Should be `useMemo`.

**P3 — `useLoadProjects` uses `(supabase as any)` cast unnecessarily** 
Line 16: The cast is unnecessary since the `projects` table now exists in the schema. TypeScript types would work directly.

---

### SECURITY

**S1 — `UsersPage.tsx` line 106 hardcodes Supabase URL via `VITE_SUPABASE_PROJECT_ID`**
`https://${projectId}.supabase.co/functions/v1/delete-user` — the project ID is already in the client and in the .env. Using it to construct a URL to the edge function is acceptable but slightly fragile. Better to use `supabase.functions.invoke('delete-user', {...})` which handles URL construction internally and respects the client config.

**S2 — `bootstrapAdmin` sends no email confirmation, relies on Supabase auto-confirm**
If Supabase email confirmation is enabled (which is the default), the `signUp` returns a user but with `confirmed_at = null`. Then `loadProfile` is called immediately on the unconfirmed user. The profile trigger fires, but the user can't log in again until confirming email. No feedback to user about "check your email".

---

### UI/UX GAPS

**U1 — No feedback when `handleDeleteUser` edge function call fails**
`UsersPage.tsx` lines 114-117: `if (!res.ok) { const err = await res.json(); console.error('[UsersPage] Delete user error:', err); }` — only console.error, no toast or UI message. User sees the user reappear after `loadUsers()` with no explanation.

**U2 — `Step8_Documents.tsx` BOM preview table uses hardcoded `bg-white` for odd/even rows**
Line 208: `className={`border-t border-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}` — this will look broken in dark mode or custom theme scenarios. Uses hardcoded colors.

**U3 — `Step10_OrderForm.tsx` has no empty state**
If `processedLines.length === 0` (e.g., no zones configured), the table just renders empty headers. No feedback to user that they need to complete earlier steps.

**U4 — `Dashboard.tsx` `ProjectCard` — the "Pokračovať" button is an action button but the entire card is not clickable**
Only the button triggers `onOpen`. Common UX pattern expects the card itself to be clickable. Minor but noted.

**U5 — `ChangeLogPage.tsx` filter count badge shows stale counts**
Line 62: `(changelog.filter((e) => e.action === af).length)` — recalculates on every render with `useMemo` wrapping the main filter but NOT the count badges. The counts always reflect the unfiltered total regardless of search filter.

**U6 — `Sidebar.tsx`: "summary" view shows Projects nav item as active**
Line 52: `view === target || (target === 'dashboard' && view === 'summary')` — correct, summary shows Projects as active. Good.

**U7 — Mobile: Sidebar hover expansion doesn't work on touch devices**
CSS `hover:w-52` doesn't trigger on mobile (touch devices don't have hover). On mobile, the sidebar is permanently 56px with no way to expand it or see labels. No mobile navigation fallback (hamburger, etc.).

**U8 — `AutoSaveSubscriber` is mounted INSIDE the layout div**
`App.tsx` line 204: `<AutoSaveSubscriber view={view} />` is a child of the main flex layout div but renders null. Correct behavior, but semantically it should be at the top of AppInner's return before the layout markup.

---

### SUMMARY TABLE

| ID | Severity | Issue |
|----|----------|-------|
| NC1 | 🔴 NEW CRITICAL | StockItemModal uses no-op reload in useStockMutations |
| NC2 | 🔴 NEW CRITICAL | NORMIST_DANFOSS misclassified as NORMIST in BOM |
| NC3 | 🟠 NEW HIGH | useAutoSave timer not cleaned up on unmount |
| NC4 | 🔴 NEW CRITICAL | **M2 "fix" was WRONG** — spacing label was correctly "cm", changing to "mm" is misleading; values ARE cm |
| NC5 | 🟠 NEW HIGH | bootstrapAdmin: profile trigger race condition → potential stuck loading |
| NC6 | 🟠 NEW HIGH | deleteSavedProject DB failure silently lost, no user feedback |
| H3 | 🟠 HIGH | Hardcoded prices in BOM bypass live stock DB |
| H4 | 🟠 HIGH | Stock seeding runs for non-admin users, silently fails |
| M1 | 🟡 MEDIUM | Hardcoded Tailwind colors in Steps 3–8, 10 |
| S1 | 🟡 MEDIUM | UsersPage uses fetch() instead of supabase.functions.invoke() |
| S2 | 🟡 MEDIUM | bootstrapAdmin: no email confirmation UX feedback |
| P1 | 🟡 MEDIUM | AutoSaveSubscriber fires on saveStatus changes (wasteful) |
| P2 | 🟡 MEDIUM | StockPage filtered not memoized |
| U1 | 🟡 MEDIUM | Delete user failure shows no UI feedback |
| U7 | 🟡 MEDIUM | Sidebar hover doesn't work on mobile/touch |
| U3 | 🟡 MEDIUM | Step10 no empty state if no zones |
| L5 | 🟢 LOW | 6 duplicate stock items in stockItems.ts |
| L6 | 🟢 LOW | App title inconsistency "Greenhouse" vs "GreenHouse" |
| L7 | 🟢 LOW | Emoji headings in admin pages |
| L8 | 🟢 LOW | Emoji action buttons (🗑, ✏️) not Lucide icons |
| L9 | 🟢 LOW | Toaster mounted in main.tsx but never triggered in code |
| L11 | 🟢 LOW | generateQuoteNumber: collision risk after ~90 quotes |
| U2 | 🟢 LOW | BOM table hardcoded bg-white/bg-gray-50 for rows |
| U5 | 🟢 LOW | ChangeLog filter count badges always unfiltered |

