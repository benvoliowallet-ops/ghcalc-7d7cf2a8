
## Plan — Remaining hardcoded prices

### Remaining violations found

**`src/components/ProjectSummary.tsx`**
- Line 43: `roughCost` uses `+ 350 +` (hardcoded) → use `getStockPrice('SNFG.00001')`
- Lines 123–124: bracket price `b.direction === 'racmet' ? 13.58 : 11.66` → use `getStockPrice(b.code)`
- Line 133: `SANFOG_MONTAZ` price hardcoded as `100` → `getStockPrice('SANFOG_MONTAZ')`
- Line 134: `SANFOG_DIETA` price hardcoded as `35` → `getStockPrice('SANFOG_DIETA')`
- Line 136: `SANFOG_DOPRAVA` price hardcoded as `150` → `getStockPrice('SANFOG_DOPRAVA')`
- Line 141: `SANFOG_COLNICA` hardcoded as `1400` → `getStockPrice('SANFOG_COLNICA')`
- `transpCost` and `pmCost` come from `getTransportCost()`/`getPMCost()` in calculations.ts — fixed below

**`src/utils/calculations.ts`**
- `getTransportCost(country)` returns hardcoded `750` or `450` — should use `getStockPrice('SANFOG_PREPRAVA_HU'/'SK')`
- `getPMCost(area)` returns hardcoded `300`/`600`/`900` — should use `getStockPrice('SANFOG_PM_2Ha'/'4Ha'/'6Ha')`

Fixing `calculations.ts` automatically fixes `transpCost`/`pmCost` in **Step8**, **Step10**, **Step6_Costs**, and **ProjectSummary** simultaneously — no changes needed in those files for the transport/PM lines.

### Files to change

| File | Lines | Change |
|------|-------|--------|
| `src/utils/calculations.ts` | 233–241 | `getTransportCost` and `getPMCost` use `getStockPrice` from stockItems |
| `src/components/ProjectSummary.tsx` | 43 | roughCost uses `getStockPrice('SNFG.00001')` |
| `src/components/ProjectSummary.tsx` | 123–124 | brackets use `getStockPrice(b.code)` |
| `src/components/ProjectSummary.tsx` | 133–136, 141 | SANFOG_MONTAZ/DIETA/DOPRAVA/COLNICA use `getStockPrice` |

### Import needed in calculations.ts

```ts
import { getStockPrice } from '../data/stockItems';
```

### Logic

```ts
// calculations.ts
export function getTransportCost(country: 'SK' | 'CZ' | 'HU'): number {
  if (country === 'HU') return getStockPrice('SANFOG_PREPRAVA_HU');
  if (country === 'CZ') return getStockPrice('SANFOG_PREPRAVA_CZ');
  return getStockPrice('SANFOG_PREPRAVA_SK');
}

export function getPMCost(area: number): number {
  if (area <= 2) return getStockPrice('SANFOG_PM_2Ha');
  if (area <= 4) return getStockPrice('SANFOG_PM_4Ha');
  return getStockPrice('SANFOG_PM_6Ha');
}
```

### Total: 2 files, ~10 line changes
