
## Plan: Use English names in NAZLI Order Form

### Problem
`aggregatedNazliLines` is built from `BomLine.name` which contains Slovak names (from `buildBomLines`). The NAZLI print and XLSX export both use `nl.name` — so they show Slovak descriptions.

### Solution
In `Step8_Documents.tsx`, when building `aggregatedNazliLines`, look up `nameEn` from `STOCK_ITEMS` for each line and store it as the display name. Fall back to `nl.name` if no English name found.

### Changes — one file only: `src/components/steps/Step8_Documents.tsx`

**1. `aggregatedNazliLines` (lines 44–53)** — add English name lookup:
```ts
const aggregatedNazliLines = (() => {
  const m = new Map<string, { code: string; name: string; qty: number; unit: string }>();
  processedBomLines.filter((l) => isNormist(l.code) && l.code !== 'NORMIST').forEach((nl) => {
    const ex = m.get(nl.code);
    const nameEn = STOCK_ITEMS.find(s => s.code === nl.code)?.nameEn ?? nl.name;  // ← NEW
    ex ? (ex.qty += nl.qty) : m.set(nl.code, { code: nl.code, name: nameEn, qty: nl.qty, unit: nl.unit });
  });
  const lines = Array.from(m.values());
  if (uvSystemNazli) lines.push({ code: 'UV_SYSTEM', name: 'UV System', qty: 1, unit: 'ks' });
  return lines;
})();
```

That's the only change needed. The `printOrderNazli` and `exportNazliXLSX` functions already use `nl.name` — so they will automatically display English names after this fix.

### Note on LEGACY_CODE_MAP
Some NORMIST codes in BOM use legacy aliases (e.g. `NORMIST 0311008` → `0311008`). The lookup `STOCK_ITEMS.find(s => s.code === nl.code)` will work correctly because `buildBomLines` already uses the canonical code names that match entries in `STOCK_ITEMS`.
