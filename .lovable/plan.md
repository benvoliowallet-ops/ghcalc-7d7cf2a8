
## What changes

The two-field (nights × techs × 40€) accommodation calculation is replaced by a single direct numeric input `accommodationCost: number` in the store. The two old fields (`accommodationNights`, `accommodationTechs`) are removed since they are only used to derive the cost.

All consumers already read `accommodationCost` by computing `accommodationNights * accommodationTechs * 40`. After the change they will read the raw stored value instead, so the math stays identical everywhere else.

### Files

**`src/types/index.ts`**
- In `CostInputs`: replace `accommodationNights: number` and `accommodationTechs: number` with `accommodationCost: number`

**`src/store/projectStore.ts`**
- In `defaultCostInputs`: replace `accommodationNights: 0, accommodationTechs: 0` with `accommodationCost: 0`

**`src/components/steps/Step6_Costs.tsx`**
- Remove `const accommodationCost = costInputs.accommodationNights * costInputs.accommodationTechs * 40;` — instead read `costInputs.accommodationCost` directly
- Replace the two-field grid (nights + techs) with a single `<Input label="Ubytovanie [€]" type="number" min={0} value={costInputs.accommodationCost} onChange={...} />`
- `totalLabour` formula stays the same (it already adds `accommodationCost`)

**`src/components/steps/Step8_Documents.tsx`** (line 97)
- Replace `const accommodationCost = costInputs.accommodationNights * costInputs.accommodationTechs * 40;` with `const accommodationCost = costInputs.accommodationCost;`
- Line 102: BOM add call stays unchanged (adds line with cost, qty 1)

**`src/components/ProjectSummary.tsx`** (line 125)
- Same one-line fix: `const accommodationCost = costInputs.accommodationCost;`
- BOM add call on line 130 updated to: `if (accommodationCost > 0) add('Montáž', 'SANFOG_UBYT', 'Ubytovanie', 1, 'ks', accommodationCost);`

No DB migration needed — the snapshot stored in Supabase is jsonb and will pick up the new field naturally. Old snapshots that still have `accommodationNights`/`accommodationTechs` and lack `accommodationCost` will default to 0 via the store's fallback (same as other optional fields).
