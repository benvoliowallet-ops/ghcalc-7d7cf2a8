
## Summary of all changes

### 1. Left sidebar (Pipedrive-style, icon → hover shows text)
Replace the current top horizontal nav with a vertical sidebar:
- Collapsed to **56px** (icons only), expands to **200px** on hover via CSS `group-hover` transition
- Icons: `lucide-react` — `FolderOpen`, `Package`, `ScrollText`, `Users`, `Plus` — monochrome `text-white/60` → active `text-white`
- Active item: teal left-border + teal background tint
- Top of sidebar: Sanfog logo icon (small) → full logo text on hover
- Bottom of sidebar: username + **orange "Odhlásiť sa" text** (replaces door emoji)
- "Nový projekt" as a special item at the bottom of the nav list
- The sidebar is `fixed` left, content has `ml-14` (icon width) — no JS state needed, pure CSS hover

### 2. Content area restructure
Remove the current `<header>` wrapper. The app layout becomes:
```text
<div class="flex h-screen">
  <Sidebar /> (fixed, w-14 → hover w-52)
  <div class="flex flex-col flex-1 ml-14">
    [step tabs strip — only when view=project]
    <main class="flex-1 overflow-auto">
    <footer (slim)>
  </div>
</div>
```
The step tabs (currently in the header) move to a thin navy strip at the very top of the content area when in project view. Project info (quote number, save status) goes there too.

### 3. Replace all `window.confirm()` — 9 locations
Create a reusable `ConfirmDialog` component using the existing `@radix-ui/react-alert-dialog`. Implement a global hook `useConfirm()` with a context so any component can call `await confirm("message")` returning a Promise<boolean>.

**Locations to fix:**
- `App.tsx`: `handleNewProject` + logout button (2 places)
- `Dashboard.tsx`: delete project card (1)
- `StockPage.tsx`: delete stock item (1)
- `Step3_Zones.tsx`: CAD reset + copy zone (2)
- `UsersPage.tsx`: revoke invitation + delete user (2)

**New files:**
- `src/components/ui/ConfirmDialog.tsx` — the AlertDialog UI
- `src/hooks/useConfirm.ts` — context + hook

**Pattern used:**
```tsx
// In any component:
const confirm = useConfirm();
const ok = await confirm({ title: 'Vymazať projekt?', description: 'Táto akcia je nevratná.' });
if (ok) doTheThing();
```

### 4. Logout button
Change the `🚪` button to orange text **"Odhlásiť sa"** in the sidebar footer section. It will be visible only when hovering the sidebar (with the `group-hover:opacity-100` pattern), but always accessible via the icon hint.

### 5. Greenhouse vector SVG icon
Replace the `🌿` emoji (line 154 in `Dashboard.tsx`) with an inline SVG of a simple greenhouse outline — a rectangle with a peaked/arched roof, single color `text-teal`. Clean, professional, brand-consistent.

### 6. Stock in Supabase
Already implemented via `useStockDB.ts` and `StockPage.tsx` — **no changes needed**.

---

### Files to create
1. `src/components/ui/ConfirmDialog.tsx`
2. `src/hooks/useConfirm.ts`
3. `src/components/Sidebar.tsx`

### Files to modify
1. `src/App.tsx` — new layout structure, use ConfirmDialog, wrap with ConfirmProvider
2. `src/components/Dashboard.tsx` — ConfirmDialog + greenhouse SVG icon
3. `src/components/stock/StockPage.tsx` — ConfirmDialog
4. `src/components/steps/Step3_Zones.tsx` — ConfirmDialog (2 places)
5. `src/components/admin/UsersPage.tsx` — ConfirmDialog

### What stays the same
- All business logic, step calculations, Supabase integration
- `StockPage` DB wiring (already working)
- All other step components (Step1–Step10)
- CSS tokens, theme, brand colors
