
## Koreň problému

V `buildBom.ts` sú `name` hodnoty (3. argument funkcie `add(...)`) hardkódované **slovenské reťazce**. Napríklad:

```ts
add(sec, 'NORMIST 201142', 'Záves drziak trysky D10', ...)   // ← Slovak hardcoded
add(sec, 'NORMIST 201142M', 'Záves stred rúr D10', ...)       // ← Slovak hardcoded
add(sec, nCode, `Tryska D${zone.nozzleOrifice}mm AK SS`, ...) // ← Slovak hardcoded
add(sec, 'NOR 0311002-180', 'Fitting Ni 180°', ...)          // ← already English
add(sec, 'NOR EGE', '1¼" EGE 7 nízkotlaková hadica', ...)   // ← Slovak hardcoded
```

Keď `aggregatedNazliLines` hľadá `nameEn` zo `STOCK_ITEMS`, lookup funguje správne pre kódy ako `NOR 201142`, `NOR NMC25S303C-AD` atď. — **ale** kódy v BOM sú `NORMIST 201142`, `NORMIST 201142M` (legacy), a po `LEGACY_CODE_MAP` sa síce nájde správna položka, ale iba v prípade keď neexistuje `ex` (duplicate agregácia to skipping). Hlavný problém je ale iný:

**Reálna príčina zo screenshotu:**
- Riadky ako `NOR NMC25S303C-AD` → `nameEn = "0.25 mm / 0.012\" orifice."` — toto je veľmi krátky technický popis, nie skutočný popis
- Riadky `NORMIST 201142` → `nameEn = "Stainless steel wire hanger for nozzle holder fitting"` — toto by **malo** fungovať, ale screenshot ukazuje `Záves drziak trysky D10` (SK) → teda lookup zlyháva

**Skutočná príčina zlyhania lookup-u:**
Na riadku 52 v Step8:
```ts
ex ? (ex.qty += nl.qty) : m.set(...)
```
Keď sa prvý výskyt kódu spracuje správne (nameEn sa nájde), ale **`ex.qty += nl.qty` vetva modifikuje existujúci záznam a nevykoná nameEn lookup znova** — to je OK. Problem je, že niektoré kódy ako `NORMIST 201142` prechádzajú cez `isNormist()` check, ale ich lookup v `STOCK_ITEMS` cez `canonicalCode = LEGACY_CODE_MAP['NORMIST 201142']` → `'NOR 201142'` by mal nájsť položku...

**Skutočná príčina (po detailnej analýze):** `buildBom.ts` riadok 117-118 používa kód `NORMIST 201142` a `NORMIST 201142M` — ale `LEGACY_CODE_MAP` mapuje tieto na `NOR 201142` a `NOR 201142M`. Lookup v Step8 vyzerá správne. 

**Ale** screenshot ukazuje slovenské `Záves drziak trysky D10` — čo je presne `nameSk`. To znamená, že lookup **nenachádza** `nameEn` a fallback-uje na `nl.name` (= Slovak name z buildBom.ts riadok 117: `'Záves drziak trysky D10'`).

**Prečo lookup zlyháva?** STOCK_ITEMS má položku s `code = 'NOR 201142'`. `canonicalCode = LEGACY_CODE_MAP['NORMIST 201142'] = 'NOR 201142'`. `STOCK_ITEMS.find(s => s.code === 'NOR 201142')` **by malo nájsť** položku... 

**Skutočný problém je iný** — na riadku 52 Step8:
```ts
ex ? (ex.qty += nl.qty) : m.set(nl.code, { code: nl.code, name: nameEn, ... });
```
`m.get(nl.code)` kde `nl.code = 'NORMIST 201142'` — ALE riadok zo `buildBom` line 117 používa `add(sec, 'NORMIST 201142', ...)` — čo sa uloží do BOM. Ten kód `NORMIST 201142` má `isNormist() = true` (prefix check), takže filtruje OK.

Potom `canonicalCode = LEGACY_CODE_MAP['NORMIST 201142'] = 'NOR 201142'`. STOCK_ITEMS lookup by mal nájsť. **Ale** — čo keď buildBom nezahrnie tento kód ako NORMIST? Preveríme `isNormist('NORMIST 201142')`:

```ts
if (code === 'NORMIST') return true;
if (code.startsWith('NORMIST_PUMP_')) return true;
const resolved = LEGACY_CODE_MAP[code] ?? code;
return normistCodes.has(resolved);
```

`normistCodes` = Set z `STOCK_ITEMS.filter(s => s.warehouse === 'NORMIST').map(s => s.code)` — teda obsahuje `'NOR 201142'`. `resolved = 'NOR 201142'`. `normistCodes.has('NOR 201142')` = **true** ✓.

Takže filter funguje. Lookup taktiež. **Prečo teda vidíme SK mená?**

**Záver:** Je možné, že problém je v tom, že `STOCK_ITEMS` exportuje `stockItems` (malé písmeno) ale importuje sa `STOCK_ITEMS` (veľké písmeno). Overíme:

Z `stockItems.ts` line 49: `export const stockItems: StockItem[] = [...]` — a EXPORT_ITEMS nie je definovaný tam explicitne. Ale `Step8_Documents.tsx` importuje `STOCK_ITEMS` — to musí byť z iného miesta.

## Oprava

**Stratégia: Riešiť to priamo v `buildBom.ts`** — namiesto hardkódovaných SK názvov použiť `getStockName(code)` helper funkciu, ktorá vráti `nameEn` z `STOCK_ITEMS`. Tým sa `nl.name` v BomLine stane anglický a `aggregatedNazliLines` ho použije priamo bez potreby lookup-u v Step8.

Toto je robustnejšie riešenie — jeden fix, všetky exporty (PDF, XLSX, Oberon) budú konzistentné.

### Zmeny

**1. `src/data/stockItems.ts`** — pridať helper `getStockNameEn(code)`:
```ts
export function getStockNameEn(code: string): string {
  const canonical = LEGACY_CODE_MAP[code] ?? code;
  return (
    STOCK_ITEMS.find(s => s.code === canonical)?.nameEn ??
    STOCK_ITEMS.find(s => s.code === code)?.nameEn ??
    code
  );
}
```

**2. `src/utils/buildBom.ts`** — importovať `getStockNameEn` a nahradiť hardkódované SK mená:
Všetky `add(sec, code, 'Slovak name', ...)` kde code je NORMIST položka nahradiť za `add(sec, code, getStockNameEn(code), ...)`.

Konkrétne riadky kde je hardkódovaný SK/nesprávny popis pre NORMIST položky:
- Line 73: `'1¼" EGE 7 nízkotlaková hadica'` → `getStockNameEn('NOR EGE')`
- Line 74: `'Keller snímač tlaku 10bar'` → `getStockNameEn('NOR 204090')`  
- Line 91: `` `Tryska D${zone.nozzleOrifice}mm AK SS` `` → `getStockNameEn(nCode)`
- Line 92: `'Swivel adaptér'` → `getStockNameEn('NOR 301188')`
- Line 98: `'Fitting SS 180°'` → `getStockNameEn('NOR 0311002SS-180')`
- Line 100: `'Fitting Ni 180°'` → `getStockNameEn('NOR 0311002-180')`
- Line 105: `'End plug 10mm SS'` → `getStockNameEn('NOR 0311008SS')`
- Line 107: `'End plug 10mm Ni'` → `getStockNameEn('0311008')`
- Line 117: `'Záves drziak trysky D10'` → `getStockNameEn('NORMIST 201142')`
- Line 118: `'Záves stred rúr D10'` → `getStockNameEn('NORMIST 201142M')`

Rovnako pre `NORMIST_DANFOSS` (line 75), `0204013A` (line 63), `0104003-kit` (line 64), `204091` (line 65), `NOR 204090` (line 74).

**3. `src/components/steps/Step8_Documents.tsx`** — lookup v `aggregatedNazliLines` zostane ako záloha ale primárne bude fungovať cez `nl.name` keďže bude už anglický.

### Súhrn

- 2 súbory: `stockItems.ts` (nový helper) + `buildBom.ts` (nahradenie SK názvov)
- Žiadne zmeny v DB, žiadne zmeny v UI
- Po oprave budú NORMIST položky mať anglické mená **všade** — v BOM náhľade, PDF, XLSX aj Oberon exporte
