
## Oprava exportOberon.ts — poškodená šablóna

### Problém
Súbor `src/utils/exportOberon.ts` obsahuje base64 šablónu rozdelenú do poľa `T`, pričom väčšina prvkov sú samé nuly (`AAAA...`). Toto nie je platný XLSX súbor — `atob()` síce prebehne, ale `XLSX.read()` zlyhá alebo vráti prázdny workbook bez `Data` sheetu.

### Riešenie — 1 súbor

**`src/utils/exportOberon.ts`** — kompletné prepísanie:

| Zmena | Popis |
|-------|-------|
| `const T = [...]` | Nahradí sa jedným `OBERON_TEMPLATE_B64` stringom s kompletnou platnou base64 šablónou |
| `loadTemplate()` | Zjednodušená — priamo dekóduje `OBERON_TEMPLATE_B64` |
| `prepareBomForOberon()` | Rozšírená o podporu `line.quantity` aj `line.qty` (backward compat) |
| `exportToOberon()` | Odstráni sa fallback cez `fetch('/oberon_template.xlsx')` — šablóna je vždy v kóde; opraví sa off-by-one (riadky začínajú od 0-indexed r=1, teda row 2 v Exceli) |

### Žiadne iné súbory
Volania `exportToOberon()` a `prepareBomForOberon()` zostanú kompatibilné — rozhranie `OberonRow` sa nemení.
