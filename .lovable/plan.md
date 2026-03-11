
## Refaktoring K1: Jednotný BOM builder — src/utils/buildBom.ts

### Čo sa robí
Extrahujeme BOM logiku zo Step8_Documents.tsx (najkompletnejší zdroj) do nového súboru `src/utils/buildBom.ts`, potom aktualizujeme všetky tri spotrebitelia.

### Analýza rozdielov medzi súbormi

**Step8_Documents.tsx** (riadky 27–110) — **NAJKOMPLETNEJŠÍ**:
- Má `NORMIST 0311001SS` (numHolders - numFitting180) ✓
- Má `hydraulicHoseLength`, `hydraulicHoseConnectors` ✓
- Má `KDP000003519` + `AS109R` pre Snímač zóny ✓
- Má `ssFilter30`, `uvSystemCode`, `uvSystemNazli` ✓
- Má `dietsCost`, `accommodationCost`, `salesTripsCost` ✓
- Ceny: hardkódované 100 a 35 (nie cez getStockPrice)

**ProjectSummary.tsx** (riadky 56–144) — takmer identická, ale:
- Používa `getStockPrice('SANFOG_MONTAZ')` namiesto hardcode 100 ✓ — LEPŠIE
- Používa `getStockPrice('SANFOG_DIETA')` namiesto hardcode 35 ✓ — LEPŠIE

**Step10_OrderForm.tsx** (riadky 44–131) — NEKOMPLETNÝ:
- Chýba `NORMIST 0311001SS`
- Chýba hydraulic hose items
- Chýba Snímač items (KDP000003519, AS109R)
- Chýba ssFilter30, uvSystemCode conditional items
- Iná štruktúra (bez `section`, bez `name` ale `description`)

### Nový súbor: `src/utils/buildBom.ts`

**Typ vstupu** — `ProjectSnapshot` = `ProjectState` z `src/types/index.ts` plus `uvSystemNazli`:

```ts
// ProjectState má všetko okrem uvSystemNazli — pridáme ho
export interface BomSnapshot {
  project: Project;
  globalParams: GlobalParams;
  zones: ZoneParams[];
  zoneCalcs: ZoneCalc[];
  normistPrice: number;
  costInputs: CostInputs;
  uvSystemCode: string | null;
  ssFilter30: boolean;
  uvSystemNazli?: boolean;
  cad: CADDrawing;
  ropeOverrides: number[];
}
```

**Výstupný typ:**
```ts
export interface BomLine {
  section: string;
  code: string;
  name: string;
  qty: number;
  unit: string;
  price: number;
}
```

Toto je presne rovnaký shape aký používajú všetky tri súbory — žiadna breaking change.

**Ceny** — použijeme prístup z ProjectSummary (getStockPrice pre všetky sadzby, nie hardkódované čísla).

### Zmeny v troch súboroch

**Step8_Documents.tsx:**
- Odstrán: `bomLines`, `add()`, všetky `add(...)` volania (riadky 27–109)
- Zachovaj: `processedBomLines`, `attiLines`, `normistLines`, `aggregatedNazliLines`
- Pridaj import + `const bomLines = buildBomLines({...})`

**ProjectSummary.tsx:**
- Rovnaké — odstrán riadky 56–144
- Zachovaj: `processedBomLines`, `attiLines`, `aggregatedNazliLines`
- Pridaj import + `const bomLines = buildBomLines({...})`

**Step10_OrderForm.tsx:**
- Tu je iná situácia — Step10 má vlastnú `OrderLine` štruktúru a volá `add()` s `supplier` parametrom
- Po refaktoringu: `buildBomLines()` vráti všetky riadky, Step10 si ich transformuje do `OrderLine` formátu
- Zmena: nahradiť celú BOM build logiku (riadky 44–131) volaním `buildBomLines()`, potom mapovať na `OrderLine`

### Súhrn zmien

| Súbor | Operácia |
|-------|---------|
| `src/utils/buildBom.ts` | **NOVÝ** — extrahovaná BOM logika zo Step8 s opravami z ProjectSummary |
| `src/components/steps/Step8_Documents.tsx` | Odstrán add() + build, importuj buildBomLines |
| `src/components/ProjectSummary.tsx` | Odstrán add() + build, importuj buildBomLines |
| `src/components/steps/Step10_OrderForm.tsx` | Odstrán add() + build, importuj buildBomLines + transformácia |

### Čo sa NEzmení
- UI v žiadnom zo 3 súborov
- `processedBomLines`, `attiLines`, `normistLines`, `aggregatedNazliLines` logika zostáva lokálna
- `isNormist()` zostáva lokálne kde je
- Step10 `OrderLine` interface a render logika zostáva
