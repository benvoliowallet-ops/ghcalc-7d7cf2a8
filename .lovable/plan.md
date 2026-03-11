
## Plan — Stock import Part 3/3

### What the 3 kroky actually touch

**KROK A** — 1 file, surgical insert
Insert 68 NORMIST items between line 244 (comment) and line 245 (`];`) in `src/data/stockItems.ts`.

**KROK B — Analysis finding**
There is **no snapshot loader that looks up saved BOM codes**. The BOM is always recalculated from `projectStore` state (zones, zoneCalcs, globalParams etc.), never from stored code lists. `migrateStockCode` is already defined. The real need is: `useNormistChecker` → when DB is empty, it falls back to `STOCK_ITEMS.filter(i => i.warehouse === 'NORMIST')`, which will now return the 68 new NORMIST items once KROK A is done. The prefix fallback (`NOR `, `NORMIST `) already covers the hardcoded legacy codes still used in Step8/Step10/ProjectSummary BOM generators (e.g. `'NORMIST 0311002SS-180'`, `'NORMIST 201142'`). No code changes needed beyond KROK A for migration to work.

**KROK C — Analysis finding**
ATTI-only pricing is **already implemented** in all 3 places:
- `Step8_Documents.tsx` line 113: `attiLines = processedBomLines.filter(l => !isNormist(l.code))` — totals use `attiLines`
- `ProjectSummary.tsx` line 144: same pattern, `attiLines` used for all exports and BOM total
- `Step10_OrderForm.tsx` line 105: `processedLines` zeroes out `supplier === 'NORMIST'` rows, `grandTotal` excludes them

**However**: Step10 determines NORMIST by `supplier === 'NORMIST'` field in the hardcoded `add()` calls — not by stockItems lookup. The new NORMIST codes added in KROK A won't automatically affect Step10's grandTotal since Step10 doesn't use `isNormist()`. This is acceptable and consistent with current design (Step10 uses explicit supplier strings).

### Files to change

| File | Action |
|------|--------|
| `src/data/stockItems.ts` | Insert 68 NORMIST items before `];` (line 245) |

### Operation
Replace line 244–245:
```
  // --- NORMIST POLOŽKY PRÍDU V ČASTI 3/3 ---
];
```
with the comment + 68 NORMIST entries + `];`.

No other files need changes. The `useNormistChecker` static fallback will automatically pick up all 68 new NORMIST items from the updated `STOCK_ITEMS` array. The `migrateStockCode` function already handles legacy-to-new code mapping for codes stored in older project snapshots.

### Total: 1 file, ~75 lines added
