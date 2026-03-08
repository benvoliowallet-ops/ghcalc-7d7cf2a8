
## Plan: Document Generation in ProjectSummary

### What the user wants
In the Project Summary view (shown after completing the wizard), add two document generation actions:
1. **Order Form pre NAZLI** — prints/exports the aggregated list of NORMIST items for NOR ELEKTRONIK Istanbul
2. **Objednávka pre Attiho** — prints/exports the full BOM excluding NORMIST items (Atti/OBERON lines)

### Where the logic already lives
All the BOM computation, `printOrderNazli`, `printBOM`, `exportNazliXLSX`, `exportAttiBOMXLSX` already exist in `Step8_Documents.tsx`. The same logic uses:
- `useNormistChecker()` hook to split lines into NORMIST vs Atti
- `detectConcurrentPipes`, `calcETNACapacity`, `getTransportCost`, `getPMCost`, all from `calculations.ts`
- `getPipe10mmForSpacing` from `stockItems.ts`
- All project store state

### Approach
Extract the BOM-building logic and print/export functions from `Step8_Documents.tsx` into `ProjectSummary.tsx` (by copy-adapting, since the component is a standalone page). Add two new action buttons in the existing header button row.

### Changes — single file only

**`src/components/ProjectSummary.tsx`:**
1. Import `useNormistChecker` from `../../hooks/useSupabaseItems`
2. Import all needed calculations utilities (`NOZZLE_BY_ORIFICE`, `detectConcurrentPipes`, `getTransportCost`, `getPMCost`, `PUMP_TABLE`, `fmtN`, `fmtE`)
3. Import `getPipe10mmForSpacing` from `../../data/stockItems`
4. Import `* as XLSX` (already present)
5. Pull additional store fields: `uvSystemCode`, `ssFilter30`, `cad`, `costInputs`, `etnaConfig`, `preOrderState`
6. Add the same BOM-building `add()` / `lines` logic from Step8
7. Add `printOrderNazli()`, `printBOM()`, `exportNazliXLSX()`, `exportAttiBOMXLSX()` functions (matching Step8 exactly)
8. Add two new buttons in the header actions area: **"Order NAZLI"** and **"BOM pre Attiho"**

The buttons will be placed in the existing header flex row alongside "Tlačiť", "Export XLSX", "Otvoriť wizard". They'll use the same white/teal style as the existing buttons.

No new files, no DB changes, no migrations needed.
