
## Plan — Stock import Part 2/3

### What to do

Replace only the `stockItems` array in `src/data/stockItems.ts` (lines 40–142) with the new 202-item ATTI array provided by the user.

**Preserve unchanged:**
- Lines 1–39: `StockItem` interface + `LEGACY_CODE_MAP` + `migrateStockCode`
- Lines 143–176: `STOCK_ITEMS` alias + `NOZZLE_BY_ORIFICE` + `NOZZLE_FLOW_BY_ORIFICE` + helper functions

**Change:**
- Lines 40–142: Replace the comment + old 100-item array with the new comment + 202-item ATTI array ending with `// --- NORMIST POLOŽKY PRÍDU V ČASTI 3/3 ---` and leaving the array open (no closing `];`).

The array remains open at the bottom — Part 3 will complete it with NORMIST items and close the `];`.

No other files need changes — interface and all field names stay identical.

### Single file, single operation
- File: `src/data/stockItems.ts`
- Replace lines 40–142 (the array declaration + all 100 entries + closing `];`) with the new 202-entry open array.
