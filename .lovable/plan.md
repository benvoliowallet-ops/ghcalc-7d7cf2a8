
## Problém: Mojibake v `nameEn` poliach `stockItems.ts`

Súbor `stockItems.ts` obsahuje UTF-8 znaky (ako `¼`, `°`, `…`, `Ø`) ktoré boli omylom double-encoded — t.j. uložené ako Latin-1 reprezentácia ich UTF-8 bytov. Prehliadač ich zobrazí ako `Â¼`, `Âº`, `â¦`, `Ã`.

### Poškodené riadky (konkrétne `nameEn` hodnoty)

| Kód | Aktuálne (broken) | Správne |
|-----|-------------------|---------|
| `NOR EGE` | `1Â¼" EGE 7 Low Pressure Hose (7 BAR)` | `1¼" EGE 7 Low Pressure Hose (7 BAR)` |
| `NOR 0311002-180` | `Nickel plated 180Âº` | `Nickel plated 180°` |
| `NOR 204090` | `4â¦..20 mA` | `4…20 mA` |
| `NOR 204091` | `4â¦..20 mA` | `4…20 mA` |
| `NOR 0301005B` | `Ã25.5X19.5` | `Ø25.5X19.5` |
| `snfg.001.0021` | `25 mÂ³/h` | `25 m³/h` |
| Line 50: `ORFS214008049` | `1â³ hydraulic hose` | `1" hydraulic hose` |
| Line 250-253 RACMET | `7 cm Ã 65 cm` | `7 cm × 65 cm` |
| `snfg.004.002` nameEn | various `Ã` chars | fix accented chars |

### Čo sa zmení

**1 súbor: `src/data/stockItems.ts`**

Opravím iba poškodené `nameEn` hodnoty v NORMIST a ATTI sekciách. Presne tieto riadky:
- Line 262: `NOR EGE` — `1Â¼"` → `1¼"`
- Line 292: `NOR 204090` — `4â¦..20 mA` → `4…20 mA`
- Line 293: `NOR 204091` — `4â¦..20 mA` → `4…20 mA`
- Line 308: `NOR 0311002-180` — `180Âº` → `180°`
- Line 270: `NOR 0301005B` — `Ã25.5` → `Ø25.5`
- Line 99: `snfg.001.0021` — `25 mÂ³/h` → `25 m³/h`
- Plus ostatné ATTI riadky kde sa vyskytuje `â³` (inch symbol), `Ã` (×/Ø), `Â³` (³)

Keďže poškodenie je systematické (UTF-8 bytes read as Latin-1), použijem priamy search & replace konkrétnych escape sekvencií:
- `Â¼` → `¼`  
- `Âº` alebo `Â°` → `°`
- `â¦` → `…`
- `Ã` → `Ø` (kde je to priemer)
- `â³` → `"`
- `Â³` → `³`

Zmeny sa dotknú **iba `nameEn` a `nameSk` textov** — žiadne kódy, ceny ani logika sa nemenia. Order Form NAZLI po oprave zobrazí správne znaky.
