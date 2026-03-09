## What changes where

### Overview

The MAXIVAREM pressure vessel is currently hardcoded to 300L everywhere. It needs to be dynamically selected based on `etnaCapacity` (Q_total × 1.5 m³/h), with the same SS/Standard toggle logic already in place.

**Selection rule:**

```
etnaCapacity ≤ 15      → 300L  (MAXTRA_300_STANDARD / MAXTRA_300_SS)
15 < etnaCapacity ≤ 25 → 500L  (MAXTRA_500_STANDARD / MAXTRA_500_SS)
etnaCapacity > 25      → 750L  (MAXTRA_750_STANDARD / MAXTRA_750_SS)
```

---

### 1. New helper in `src/utils/calculations.ts`

Add a pure function (exported) that encapsulates the selection:

```ts
export function selectMaxivarem(etnaCapacityM3h: number, osmoticSS: boolean): {
  code: string;
  label: string;
  sizeL: 300 | 500 | 750;
} {
  const size = etnaCapacityM3h <= 15 ? 300 : etnaCapacityM3h <= 25 ? 500 : 750;
  const variant = osmoticSS ? 'SS' : 'STANDARD';
  const code = `MAXTRA_${size}_${variant}`;
  const label = `MAXIVAREM ${variant === 'SS' ? 'SS' : 'ŠTANDARD'} (${size}L)`;
  return { code, label, sizeL: size };
}
```

---

### 2. `src/data/stockItems.ts`

Add 4 new items (500L standard, 500L SS, 750L standard, 750L SS) with placeholder prices. The 300L items already exist.

```ts
{ code: 'MAXTRA_500_STANDARD', name: 'MAXIVAREM ŠTANDARD (500L)', group: 'Tlaková nádoba', price: 500.0, ... },
{ code: 'MAXTRA_500_SS',       name: 'MAXIVAREM SS (500L)',       group: 'Tlaková nádoba', price: 600.0, ... },
{ code: 'MAXTRA_750_STANDARD', name: 'MAXIVAREM ŠTANDARD (750L)', group: 'Tlaková nádoba', price: 700.0, ... },
{ code: 'MAXTRA_750_SS',       name: 'MAXIVAREM SS (750L)',       group: 'Tlaková nádoba', price: 850.0, ... },
```

Also insert these 4 rows into the Supabase `stock_items` table via a data migration.

---

### 3. `src/components/steps/Step5_PumpETNA.tsx`

Replace the hardcoded `maxivarem` string with a call to `selectMaxivarem`:

```ts
import { PUMP_TABLE, calcETNACapacity, selectMaxivarem, fmtN } from '../../utils/calculations';
...
const maxivaremInfo = selectMaxivarem(etnaCapacity, osmoticSS);
```

Update the display card to show `maxivaremInfo.label` and `maxivaremInfo.code` (with the size-tier note if > 300L).

---

### 4. `src/components/steps/Step8_Documents.tsx` (line 33)

Replace hardcoded 300L code with `selectMaxivarem`:

```ts
const maxivaremInfo = selectMaxivarem(etnaCapacity, osmoticSS);
add('ETNA', maxivaremInfo.code, `MAXIVAREM ${maxivaremInfo.sizeL}V ${osmoticSS ? 'SS' : 'ŠTANDARD'}`, 1, 'ks', /* price from stock */);
```

Prices should come from the stock lookup (`getStockPrice(maxivaremInfo.code)`) rather than hardcoded values, for all three sizes.

---

### 5. `src/components/steps/Step10_OrderForm.tsx` (line 25)

Same replacement as Step 8 — call `selectMaxivarem` and use the returned code/label.

---

### 6. `src/components/ProjectSummary.tsx` (line 60)

Same replacement.

---

### Files changed


| File                                        | Change                                        |
| ------------------------------------------- | --------------------------------------------- |
| `src/utils/calculations.ts`                 | Add `selectMaxivarem()` helper                |
| `src/data/stockItems.ts`                    | Add 4 new MAXIVAREM items (local static data) |
| Supabase `stock_items`                      | Insert 4 rows (data operation, no migration)  |
| `src/components/steps/Step5_PumpETNA.tsx`   | Use `selectMaxivarem` in display              |
| `src/components/steps/Step8_Documents.tsx`  | Use `selectMaxivarem` in BOM line             |
| `src/components/steps/Step10_OrderForm.tsx` | Use `selectMaxivarem` in order form line      |
| `src/components/ProjectSummary.tsx`         | Use `selectMaxivarem` in BOM line             |


No store/type changes needed — `etnaCapacity` is computed inline from `totalFlowMlH` in every component already.  
  
Note on price lookup: If a `getStockPrice(code)` utility does not yet exist, 

look up the price inline from the `stockItems` array:

  import { stockItems } from '../../data/stockItems';

  const maxivaremPrice = stockItems.find(i => i.code === maxivaremInfo.code)?.price ?? 0;

Use this pattern in Step8, Step10, and ProjectSummary wherever the MAXIVAREM price is needed.