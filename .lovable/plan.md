
## Analysis Summary

### Issue 1 — "psch." → "ks" in BOM (Step 8)
In `Step8_Documents.tsx` lines 30, 34, 35, 102, 103, 104, 105, 106 and in `Step10_OrderForm.tsx` lines 22, 26, 27, 95, 96, 97, 98, 99, unit `'psch.'` is used for lump-sum items (Balné, ETNA accessories, transport, inspection, PM, mounting material, customs). Change all occurrences of `'psch.'` to `'ks'` in both files.

### Issue 2 — Order Form NAZLI completeness check
`aggregatedNazliLines` in Step8 is built from `processedBomLines.filter(l => isNormist(l.code) && l.code !== 'NORMIST')`. 

Items with NORMIST supplier in Step8 BOM build:
- `0204013A` (Solenoid Valve Kit) ✓ — in isNormist
- `0104003-kit` (Pressure Switch Kit) ✓ — in isNormist  
- `204091` (Keller Pressure Transmitter) ✓ — in isNormist
- `4072000024` (Bypass ventil) — NOT in stockItems as NORMIST, but in Step8 BOM it goes to section 'Čerpadlo' (not marked NORMIST). In Step10 supplier is 'TECNOMEC'. Actually correct — not NORMIST.
- `60.0525.00` (Poistný ventil) — NOT NORMIST in stockItems, supplier 'TECNOMEC'. Correct — not NORMIST.
- Pump codes `NORMIST_PUMP_*` ✓ — prefix matches isNormist fallback
- Nozzle codes `NOR NMC*` — starts with 'NOR' ✓ matches fallback
- `NOR 301188` (Swivel) ✓ — starts with 'NOR'
- 10mm pipe codes like `NOR 0311018`, `NOR 311015`, etc. ✓  
- `NORMIST 0311002SS-180`, `NORMIST 0311008SS`, `NORMIST 0311001SS` ✓
- `MVUZTLN400MMAKNS` ✓ — in stockItems with supplier NORMIST
- `NORMIST 201142`, `NORMIST 201142M` ✓
- `NORMIST_DANFOSS` — starts with 'NORMIST' ✓

**Critical gap found**: In Step8 BOM the `add()` function is called with section but the `isNormist()` check is against code. The `aggregatedNazliLines` only captures items that pass `isNormist(l.code) && l.code !== 'NORMIST'`. It looks correct but let me check the `NORMIST_DANFOSS` code — it starts with 'NORMIST_' which matches the fallback `code.startsWith('NORMIST')`. However in Step10 `NORMIST_DANFOSS` is added with `supplier: 'DANFOSS'` — so it gets excluded from the aggregated NAZLI list in Step8 but appears in Step10. This is inconsistent.

**Also**: In Step10, pumps are added AFTER the solenoid/pressure switch/transmitter/bypass items (lines 70+). But the requirement says **pumps must be first**. Currently Step10 order is: Balné, NORMIST FOGSYSTEM, ETNA items, then pump accessories (solenoid, pressure switch, etc.), then per-zone items including pumps. Pumps are buried in zone loop. Need to move pump lines to the very top of the order form.

### Issue 3 — Step 9: Add rope lengths with waste + editable qty
Currently Step9 only has 2 cards (pump connector and ETNA accessories). Need to add a third card showing rope calculation per zone with:
- ropeRaw (calculated need), ropeLength (rounded to 500m spool), ropeWaste (= ropeLength - ropeRaw)
- Editable quantity override (default = calculated ropeLength)
- This override needs to be stored (local state in Step9) and eventually passed to Step8/10 BOM

This means Step9 needs a `ropeOverrides` state per zone (array of numbers). Since Step9 state is local (useState), the overrides should be persisted to the store so Step8/10 can use them. Need to add `ropeOverrides` to ProjectState/store.

### Issue 4 — Project overview after completing all 10 steps
A new "ProjectSummary" view accessible from the Dashboard when project.currentStep === 10. The Dashboard already has a button "📄 Otvoriť / Tlačiť" for done projects, currently it opens the wizard at step 10. Instead, for done projects we should show a project summary page with key data, and a separate button to "Open wizard". 

The summary should show:
- Project header (quote number, customer, address, date)
- Zone overview table (name, area, flow, nozzles, pump)
- Key totals (total area, total flow, ETNA capacity)
- BOM summary (total cost, NORMIST count vs Atti count)
- Rope lengths per zone with waste
- Action buttons: Print summary, Open wizard, Export XLSX

### Issue 5 — App name: "Greenhouse Projekt" → "GreenHouse Calc"
In `App.tsx` line 31 and footer line 182, change the name.

---

## Plan

### Files to change:

**1. `src/App.tsx`**
- Line 31: `"Greenhouse Projekt"` → `"GreenHouse Calc"`
- Line 182: footer version text

**2. `src/components/steps/Step8_Documents.tsx`**
- All `'psch.'` → `'ks'` (lines 30, 34, 35, 102, 103, 104, 105, 106)
- No logic change needed for NAZLI order form — the isNormist check is working correctly

**3. `src/components/steps/Step10_OrderForm.tsx`**
- All `'psch.'` → `'ks'`  
- Move pump lines to top: collect `totalPumpsByCode` first (before the zone loop), then emit pump `add()` calls right after the fixed items at top, before solenoid valves

**4. `src/store/projectStore.ts`**
- Add `ropeOverrides: number[]` to `ProjectState` interface usage
- Add `setRopeOverrides: (overrides: number[]) => void` action
- Initialize default as `[]`

**5. `src/types/index.ts`**
- Add `ropeOverrides: number[]` to `ProjectState`

**6. `src/components/steps/Step9_PreOrderCheck.tsx`**
- Add third card "🔍 Kontrola 3 – Dĺžky lana"
- Per zone: show ropeRaw (calculated), ropeLength (rounded to 500), ropeWaste, editable input defaulting to ropeLength
- On change, write to store `setRopeOverrides`

**7. `src/components/Dashboard.tsx`**
- Change "done" project button from opening wizard directly to opening summary view
- Add `onOpenSummary` callback prop

**8. `src/App.tsx`**  
- Add `view: 'summary'` to AppView type
- Pass `onOpenSummary` to Dashboard
- Render `<ProjectSummary>` for summary view

**9. New file: `src/components/ProjectSummary.tsx`**
- Full project overview component
- Project header section
- Zone table (name, area m², flow ml/h, nozzles, pump)
- Totals section
- Rope section per zone (raw / rounded / waste / override)
- Cost overview (NORMIST count, Atti total)
- Two buttons: "Otvoriť v Wizarde" (opens project view) and "Nový projekt"
