## Full Audit — Hardcoded Prices vs stockItems Single Source of Truth

### The Problem

Every `add(...)` call in Step8, ProjectSummary, and Step10 has a hardcoded price as its last argument. None of these look up prices from `stockItems`. Additionally, several items have legacy codes that don't exist in `stockItems` (e.g. `ITALINOX`, `SVX_SS_NEREZ`, `RACMET 182022000`, `ETNA_ACC`, `MVVMVGG1.2FG1.2FAK`, `MVEMKCS2X1PVCW`, `snfg.006.0001`, `TELTONIKA_GSM`, `SNFG.TLK.001`, `ETNA_VODA`, `ETNA_MONTAZ`, `Gripple Plus Medium`, `MVUZTLN400MMAKNS`). The helper `getStockPrice(code)` already exists in `stockItems.ts` and returns `stockItems.find(i => i.code === code)?.price ?? 0`.

Also: `getPipe10mmForSpacing()` in `stockItems.ts` hardcodes prices (6.40, 7.36, 8.32, 10.24) instead of looking them up.

`selectMaxivarem()` in `calculations.ts` has a hardcoded `PRICES` table.

### Complete audit findings

**File: `src/utils/calculations.ts**`

- `selectMaxivarem()` lines 222–230: `PRICES` table with 6 hardcoded prices for MAXIVAREM variants. Codes `MAXTRA_300_STANDARD`, `MAXTRA_300_SS`, etc. do NOT exist in stockItems — these are synthesized codes. → Prices stay in calculations.ts for now (no stockItems entries exist). Mark as acceptable for now.
- `getPipe10mmForSpacing()` in `stockItems.ts` (lines 344–347): hardcodes prices 6.40, 7.36, 8.32, 10.24. These correspond to NOR 0311016/17/18/19 codes which DO exist in stockItems. → Fix to lookup.

**File: `src/components/steps/Step8_Documents.tsx` (identical pattern in `ProjectSummary.tsx`)**

Every `add()` call has hardcoded price. The pattern needs to be replaced with:

```ts
const p = (code: string) => STOCK_ITEMS.find(s => s.code === migrateStockCode(code))?.price ?? 0;
```

Codes that exist in stockItems (price should come from there):

- `SNFG.00001 → update price in stockItems.ts to 350.0, then replace hardcoded 350 in BOM with getStockPrice('SNFG.00001')`
- `snfg.001.0021` → 1900.0 (hardcoded 2800/3200) 
- `4072000024` → 76.43 ✓ 
- `60.0525.00` → 29.25 ✓
- `BPONG-005-P2PWE` → 4.57 ✓
- `snfg.05.0002` → 37.3284 (hardcoded 37.328) ≈ same
- `snfg.05.0014` → 39.6876 (hardcoded 34.47 — discrepancy!)
- `EKR000001481` → 0.48 ✓
- `ESV000001630` → 0.3571 (hardcoded 0.38)
- `snfg.004.0017` → 2.68 ✓
- `snfg.004.00016` → 32.3784 (hardcoded 21.38 — discrepancy!)
- `KDP000003519` → 0.352 ✓
- `AS109R` → 70.1 (hardcoded 70.31)
- `183022000` → 2.76 (hardcoded 2.836 — discrepancy!)
- `SVX 201143` → 0.099 (hardcoded 0.099) ✓

Codes with legacy/wrong codes (not in stockItems):

- `ITALINOX` → not in stockItems (should be `10217-7`, price 3.0)
- `RACMET 182022000` → not in stockItems (should be `182022000`, price in stockItems is 17.0352)
- `SVX_SS_NEREZ` → not in stockItems (should be `SVX 84070703`, price 0.396) 
- `MVUZTLN400MMAKNS` → not in stockItems (but `MVVMRD10X15X500AKNS` is; different item)
- `Gripple Plus Medium` → not in stockItems (should be `14149`, price 1.1073)
- `MVVMVGG1.2FG1.2FAK` → not in stockItems (snfg.004.002 is needle valve but different)
- `MVEMKCS2X1PVCW` → not in stockItems (closest: `KOH000000606`)
- `TELTONIKA_GSM` → not in stockItems (should be `91412039`, price 92.67)
- `snfg.006.0001` → not in stockItems (closest: `snfg.06.0001`, price 36.7408)
- `SNFG.TLK.001` → not in stockItems
- `ETNA_ACC`, `ETNA_VODA`, `ETNA_MONTAZ` → not in stockItems
- `NORMIST_DANFOSS` → maps via LEGACY_CODE_MAP to `DNFS22KW`, price 954 ✓

NORMIST items (price zeroed out by isNormist() anyway):

- `NOR 301188`, `NORMIST 0311002SS-180` etc. → NORMIST, price is irrelevant

### The fix approach

**Step 1: Add a `getStockPrice` helper that uses migrateStockCode** — already exists as `getStockPrice(code)` but doesn't run migration. Update it:

```ts
export function getStockPrice(code: string): number {
  const resolved = migrateStockCode(code);
  return STOCK_ITEMS.find(i => i.code === resolved)?.price ?? 0;
}
```

**Step 2: Fix `getPipe10mmForSpacing**` — replace hardcoded prices with `getStockPrice(code)`.

**Step 3: Add missing stock codes to LEGACY_CODE_MAP** for items where the BOM code differs from stockItems code:

- `'ITALINOX'` → `'10217-7'`
- `'RACMET 182022000' → no mapping, price becomes 0. The code 182022000 in stockItems is a different item (VT T-kus P22F AK, 17.0352€) and must not be used as a substitute.`
- `'SVX_SS_NEREZ'` → `'SVX 84070703'`
- `'snfg.006.0001'` → `'snfg.06.0001'`
- `'Gripple Plus Medium'` → `'14149'`  
Add also: `'TELTONIKA_GSM'` → `'91412039'` (Teltonika TRB140, price 92.67)

**Step 4: Replace all hardcoded prices in `Step8_Documents.tsx`, `ProjectSummary.tsx`, and `Step10_OrderForm.tsx**` with `getStockPrice(code)` calls.

For codes that genuinely have no stockItems entry (`ETNA_ACC`, `ETNA_VODA`, `ETNA_MONTAZ`, `SNFG.TLK.001`, `MVVMVGG1.2FG1.2FAK`, `MVEMKCS2X1PVCW`, `MVUZTLN400MMAKNS`, `TELTONIKA_GSM`), the price will be 0 — per the user's stated rule "if not found → price = 0".

For `snfg.001.0021` (ETNA pump): stockItems has price 1900. The BOM currently uses 2800/3200 depending on osmoticSS mode. The SS variant is not separately coded in stockItems. The stockItems price (1900) will be used and the SS premium will be dropped since there's no SS entry. Accept this as-is per the rule.

For `SNFG.00001` (Balné): keep the hardcoded price 350 — this is the customer-facing billing charge, not the item unit cost. Do NOT replace with stockItems price (5.9765).

### Files to change

1. `**src/data/stockItems.ts**`
  - Update `LEGACY_CODE_MAP` (+5 new entries)
  - Fix `getPipe10mmForSpacing()` to use `getStockPrice(code)`
  - Update `getStockPrice()` to run `migrateStockCode` first
2. `**src/components/steps/Step8_Documents.tsx**`
  - Import `getStockPrice, migrateStockCode` from stockItems
  - Replace every hardcoded price in `add()` calls with `getStockPrice(code)`
3. `**src/components/ProjectSummary.tsx**`
  - Same as Step8 (identical BOM builder code)
4. `**src/components/steps/Step10_OrderForm.tsx**`
  - Same treatment — replace all hardcoded prices with `getStockPrice(code)`
  - Also fix bracket prices: `b.direction === 'racmet' ? 13.58 : 11.66` → use `getStockPrice(b.code)`
5. `**src/utils/calculations.ts**`
  - `selectMaxivarem()` PRICES table — these MAXTRA_ codes are synthetic and not in stockItems. Leave as-is (no matching entries to look up).
  - `getTransportCost()` and `getPMCost()` — these correspond to `SANFOG_PREPRAVA_SK/CZ/HU` and `SANFOG_PM_*` codes in stockItems. Update to use `getStockPrice`.

### Important note on `SNFG.00001` price discrepancy

stockItems has `SNFG.00001` at price 5.9765 (item unit cost). The BOM hardcodes 350 (the billing charge). These are semantically different. After the fix, the BOM will show 5.9765 from stockItems. The user should be aware of this — but per the rule "price must come from stockItems", that's the correct behavior.

### Not changing

- `PortalProjectView.tsx` and `ProjectPDF.tsx` — these don't show prices, they only show codes/names/quantities. No price columns in their `add()` calls. No fix needed.  
  
CORE PRINCIPLE — No hardcoded prices anywhere:
  After this change, zero files in the codebase may contain a hardcoded price for any stock item. Every price must be read live from stockItems via getStockPrice(code) at calculation time. This means: if a price is updated in stockItems.ts, the change must automatically propagate to all BOM calculations, summaries, and exports without any other file needing to be touched.
  Update SNFG.00001 (Balné) price in stockItems.ts from 5.9765 to 350.0 — this is the correct customer-facing billing charge. After this change there are no exceptions.