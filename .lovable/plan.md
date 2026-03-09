
## What needs to change

### New state: `uvSystemNazli: boolean`

A new boolean field alongside `uvSystemCode` and `ssFilter30` in the project store and `ProjectState` type. Default: `false`. Persisted automatically as part of the project `snapshot` in Supabase (no schema migration needed — snapshot is a jsonb blob).

### Files to edit

**`src/types/index.ts`**
- Add `uvSystemNazli: boolean` to `ProjectState` interface (alongside `uvSystemCode`, `ssFilter30`)

**`src/store/projectStore.ts`**
- Add `setUVSystemNazli: (v: boolean) => void` to the `ProjectStore` interface
- Add `uvSystemNazli: false` to initial state and reset state
- Add `uvSystemNazli: s.uvSystemNazli` to `captureSnapshot()`
- Add `setUVSystemNazli: (v) => set({ uvSystemNazli: v })` action

**`src/components/steps/Step5_PumpETNA.tsx`**
- Destructure `uvSystemNazli` and `setUVSystemNazli` from the store
- Add a `<Toggle>` component in the same area as the existing `ssFilter30` toggle:
  ```tsx
  <Toggle
    checked={uvSystemNazli}
    onChange={setUVSystemNazli}
    label="UV Systém"
  />
  ```
  Place it after the existing UV code dropdown and before/alongside the SS Filter toggle.

**`src/components/steps/Step8_Documents.tsx`**
- Destructure `uvSystemNazli` from the store
- Add a NAZLI-only UV System entry directly to `aggregatedNazliLines` by adding it inside the function that builds `aggregatedNazliLines`, OR by appending directly after:
  ```ts
  // After aggregatedNazliLines is built:
  if (uvSystemNazli) {
    aggregatedNazliLines.push({ code: 'UV_SYSTEM', name: 'UV System', qty: 1, unit: 'ks' });
  }
  ```
  This ensures it appears in the NAZLI print/export but NOT in `bomLines` (Attiho BOM).

**`src/App.tsx`**
- Add `uvSystemNazli: store.uvSystemNazli` to the snapshot dependency array for auto-save triggering

**`src/components/ProjectSummary.tsx`** (if it also renders NAZLI lines — let me verify it does)
- Looking at the file: it also has `aggregatedNazliLines` built the same way, so same fix applies there too.

### What does NOT change
- No DB schema migration needed (snapshot is jsonb, new field is added transparently)
- `uvSystemCode` (existing UV lamp dropdown) stays as-is — separate feature
- Step 8B (BOM for Attiho / `attiLines`) is not touched
- Step 10 (Order Form for Attiho) is also not touched (that's Attiho's form)

### Summary of changes
| File | Change |
|---|---|
| `src/types/index.ts` | Add `uvSystemNazli: boolean` to `ProjectState` |
| `src/store/projectStore.ts` | Add state field, action, snapshot capture |
| `src/components/steps/Step5_PumpETNA.tsx` | Add `<Toggle>` for UV Systém |
| `src/components/steps/Step8_Documents.tsx` | Append UV System line to NAZLI output when toggle is on |
| `src/components/ProjectSummary.tsx` | Same NAZLI line append |
| `src/App.tsx` | Add `uvSystemNazli` to snapshot dependency |
