## Analysis

**Step9_PreOrderCheck.tsx** — Card 3 (Dĺžky lana), lines 111–159:

- Current `odpad` is computed as `calc.ropeWaste` (fixed, from `zoneCalcs`), shown as a static `Badge`
- `ropeRaw = calc.ropeLength - calc.ropeWaste` (actual need)
- `override = ropeOverrides[i] ?? ropeRounded` (editable per zone)
- `Celkom lano` at line 153–158: sum of all `ropeOverrides`

**What needs to change — Change 1: Live odpad recalculation**

- When the user changes the input, recompute `liveOdpad = override - ropeRaw` on the fly
- If `liveOdpad < 0`: show value in red with a warning icon
- The `ropeRaw` value is already available inside the render loop as `calc.ropeLength - calc.ropeWaste`
- This is purely a display change — no store change needed, just derive `liveOdpad` inline from `override` and `ropeRaw`

**Change 2: Round-up button + spool info line**

- Add below the `Celkom lano` total row:
  - A `<Button>` labeled "↑ Zaokrúhliť celok nahor na 500 m"
  - Controlled by local `useState<number | null>(null)` — `roundedTotal`
  - On click: `roundedTotal = Math.ceil(total / 500) * 500`
  - If `total % 500 === 0`: show "✓ Celok je presný násobok 500 m" (green badge, no button needed or button still clickable)
  - Info line: "Odporúčané objednávkové množstvo: X m (Y × cievka 500 m)"
  - Display only — does NOT write to `ropeOverrides`

**BOM / Export inclusion (Step 8 & Step 10)**

- The `ropeOverrides` already flow into Step8 and Step10 at the per-zone level (`ropeQty = ropeOverrides[i] ?? calc.ropeLength`) — the individual zone quantities are correct already
- For the round-up: need to store `roundedTotal` in Zustand so Step8/Step10 can read it
  - OR: re-derive in Step8/Step10 from `ropeOverrides.reduce(...)` and `Math.ceil(total/500)*500`
  - Best approach: add `ropeRoundedTotal: number | null` to `preOrderState` (persisted in jsonb automatically). When user clicks the button in Step9, store it. Step8/Step10 read it and add a summary BOM line like: `add('Lano celkom', 'ROPE_ROUNDED', 'Lano – zaokrúhlené na cievky 500m', roundedTotal, 'm', 0.15)`
  - Actually, looking at how Step8 builds BOM: it already adds rope per zone from `ropeOverrides[i]`. The rounded total is a display note only — the request says "should also appear in the final BOM / export". This means a summary line in the export, not changing per-zone lines.
  - Simplest: compute it inline in Step8/Step10 from `ropeOverrides`, no extra store needed. `const totalRope = ropeOverrides.reduce(...)`, `const roundedTotalRope = Math.ceil(totalRope / 500) * 500`. Add a summary BOM comment line OR just show it in the print header.

Actually re-reading: "The rounded total and number of spools should also appear in the final BOM / export" — means it should show up as a note/row. I'll add it as an informational line to the BOM export (print + XLSX). No store change needed — just derive it in Step8/Step10.

## Plan

### Only `src/components/steps/Step9_PreOrderCheck.tsx` changes for the UI

**Change 1 — Live odpad in zone rows:**

- Replace the static `Badge` showing `waste` (from `calc.ropeWaste`) with a dynamically computed badge
- `const liveOdpad = override - ropeRaw` (where `ropeRaw = calc.ropeLength - calc.ropeWaste`)
- `Badge variant={liveOdpad < 0 ? 'red' : liveOdpad > 100 ? 'amber' : 'green'}`
- Show the live odpad value (not the old static `calc.ropeWaste`)

**Change 2 — Round-up button below totals:**

- Add `const [roundedTotal, setRoundedTotal] = useState<number | null>(null)` at top of component
- Import `useState` from react
- Below the `Celkom lano` total div, add:
  ```tsx
  <Button variant="secondary" size="sm" onClick={...}>↑ Zaokrúhliť celok nahor na 500 m</Button>
  {roundedTotal !== null && (
    total % 500 === 0
      ? <p class="..."><CheckCircle /> Celok je presný násobok 500 m</p>
      : <p class="...">Odporúčané objednávkové množstvo: {fmtN(roundedTotal,0)} m ({roundedTotal/500} × cievka 500 m)</p>
  )}
  ```
- Import `Button` from FormField

### `src/components/steps/Step8_Documents.tsx` — add rope summary note to print/XLSX

In `printBOM()` and `exportAttiBOMXLSX()`, after all rope lines are written, add a note row:

```
Lano celkom (zaokrúhlené): X m = Y × cievka 500m
```

No new store field. Compute: `const totalRopeRaw = ropeOverrides.reduce(...)`, `const ropeCeiled = Math.ceil(totalRopeRaw/500)*500`, `const spools = ropeCeiled/500`.

Same in `Step10_OrderForm.tsx` — add a note line after the rope totals in the print/XLSX export.

### Files


| File                                           | Change                                                  |
| ---------------------------------------------- | ------------------------------------------------------- |
| `src/components/steps/Step9_PreOrderCheck.tsx` | Live odpad display + round-up button with spool display |
| `src/components/steps/Step8_Documents.tsx`     | Add rope summary note to BOM print/XLSX                 |
| `src/components/steps/Step10_OrderForm.tsx`    | Add rope summary note to order form print/XLSX          |


No store/type changes needed.

---

### Detail: Step9 zones loop (lines 118–150)

Replace:

```tsx
const waste = calc.ropeWaste;
// ...
<Badge variant={waste > 100 ? 'amber' : 'green'}>
  odpad {fmtN(waste, 0)} m
</Badge>
```

With:

```tsx
const liveOdpad = override - ropeRaw;
// ...
<Badge variant={liveOdpad < 0 ? 'red' : liveOdpad > 100 ? 'amber' : 'green'}>
  {liveOdpad < 0 && <AlertTriangle className="w-3 h-3" />}
  odpad {fmtN(liveOdpad, 0)} m
</Badge>
```

### Detail: Step9 totals section (lines 152–158)

Replace the total-only block with:

```tsx
{/* Total */}
<div className="mt-3 pt-3 border-t ...">
  <span>Celkom lano</span>
  <span>{fmtN(total, 0)} m</span>
</div>
{/* Round-up button */}
<div className="mt-3 space-y-2">
  <Button variant="secondary" size="sm" onClick={() => setRoundedTotal(Math.ceil(total/500)*500)}>
    ↑ Zaokrúhliť celok nahor na 500 m
  </Button>
  {roundedTotal !== null && (
    total % 500 === 0
    ? <div class="green badge row">✓ Celok je presný násobok 500 m</div>
    : <div class="info row">Odporúčané objednávkové množstvo: {fmtN(roundedTotal,0)} m ({roundedTotal/500} × cievka 500 m)</div>
  )}
</div>
```

### Detail: Step8 + Step10 rope note

In `printBOM()` in Step8 (line ~139), add before `</body>`:

```
<p><strong>Lano celkom (zaokrúhlené nahor na 500m):</strong> X m = Y × cievka 500 m</p>
```

In `exportAttiBOMXLSX()`, append an extra row after all bomLines:

```
{ Sekcia: 'Lano', Kód: 'INFO', Popis: `Lano zaokrúhlené: ${ropeCeiled} m = ${spools} × cievka 500m`, Qty: ropeCeiled, MJ: 'm', ... }
```

Same in Step10 `printOrder()` and `exportOrderXLSX()`.  
  
Reset roundedTotal to null whenever any zone rope input changes:

In the onChange handler of each zone's rope input field, after updating 

ropeOverrides, also call setRoundedTotal(null).

This ensures the info line is never stale after a value edit.