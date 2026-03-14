
## What the user wants

Remove the UV system `<select>` dropdown (lines 84–101 in Step5_PumpETNA.tsx) and keep only the "UV Systém" toggle. The dropdown currently lets users pick a specific UV lamp code from the database — this is no longer needed.

## Impact check

- `uvSystemCode` (the dropdown value) is used in `buildBom.ts` line 76: `if (uvSystemCode) add(...)` — this will become unused after removal.
- `uvSystemNazli` (the toggle) is the yes/no flag — this stays.
- `setUVSystemCode` and `useItemsByGroup` hook will become unused imports/destructures.

## Plan

**Single file change: `src/components/steps/Step5_PumpETNA.tsx`**

1. Remove `uvSystemCode` and `setUVSystemCode` from the store destructure (lines 13, 16)
2. Remove the `useItemsByGroup` import (line 6) and its usage (line 32: `const uvItems = ...`)
3. Remove the `Check` icon import (no longer needed for the "Vybrané" confirmation text)
4. Remove the entire dropdown block (lines 83–101): the `<div>` with the `<select>` and the confirmation `<p>`
5. Keep the two toggles: "UV Systém" (`uvSystemNazli`) and 'SS Filter 30" Unit' (`ssFilter30`) — these stay exactly as is

No changes to the store, buildBom, or any other file needed — `uvSystemCode` was an optional enhancement that can simply be left as `null` (its default value).
