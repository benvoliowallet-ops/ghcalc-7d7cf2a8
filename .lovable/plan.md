
## What's happening

The previous plan (nozzle ×2 fix) was approved but **not yet implemented** — `numHolders` doesn't exist anywhere in the codebase yet. So this request builds directly on top of the previous approved plan. Both fixes need to land together.

### Current state in `calculations.ts`

```
nozzlesPerNave  = Math.floor(effectiveLength / spacingM) + 1  ← = holders per nave
numNozzles      = nozzlesPerNave * N                           ← WRONG: should be holders×2
numPipes10mmPerNave = Math.ceil(nozzlesPerNave / 2)            ← WRONG: should equal nozzlesPerNave (= numHolders)
numFitting180   = Math.ceil(numNozzles / 2)                    ← currently = numHolders/2, stays same value
numNozzleHangers = numNozzles                                  ← WRONG: should = numHolders
```

In `generateNozzleCombos`:
```
numNozzles = nozzlesPerNave * N    ← = numHolders, should be numHolders×2
qActualMlH = numNozzles * qLpm * 60 * 1000  ← undercounts by 2×
```

### Changes

**`src/types/index.ts`** — add `numHolders: number` to `ZoneCalc`

**`src/utils/calculations.ts`** — `calcZone` block (lines 45–60):
```
// Before:
const numNozzles = nozzlesPerNave * N;             // was treating holders as nozzles
const numPipes10mmPerNave = Math.ceil(nozzlesPerNave / 2);  // wrong /2
const numFitting180 = Math.ceil(numNozzles / 2);
const numNozzleHangers = numNozzles;               // wrong

// After:
const numHolders = nozzlesPerNave * N;             // holders count
const numNozzles = numHolders * 2;                 // correct: 2 nozzles per holder
const numPipes10mmPerNave = nozzlesPerNave;        // 1 pipe segment per holder — remove /2
const numFitting180 = Math.ceil(numHolders / 2);   // same numeric value as before
const numNozzleHangers = numHolders;               // 1 hanger per holder, not per nozzle
```
Return object: add `numHolders` field.

**`src/utils/calculations.ts`** — `generateNozzleCombos` (lines 384–399):
```
// After:
const numHolders = nozzlesPerNave * N;
const numNozzles = numHolders * 2;                 // ×2
const qActualMlH = numNozzles * qLpm * 60 * 1000; // now correct (was half)
```
`spacingCm` stored in combo object is unchanged — it's already the user's holder-spacing input, displayed correctly as-is in the table.

**`src/components/steps/Step3_Zones.tsx`** — line 338:
- Change `{fmtN(c.qActualMlH)} ml/h` → `{fmtN(c.qActualMlH / 1000, 1)} l/h`
- Update column header from `ml/h` → `l/h`
- Line 275: rename label `"Rozostup trysiek"` → `"Rozostup medzi držiakmi trysiek"`

**`src/components/ProjectSummary.tsx`** — wherever `calc.numNozzles - calc.numFitting180` is used for single-nozzle-holder BOM qty, change to `calc.numHolders - calc.numFitting180`

**`src/components/steps/Step8_Documents.tsx`** — same fix: `numNozzles - numFitting180` → `numHolders - numFitting180`

**`src/components/pdf/ProjectPDF.tsx`** — same fix for single-holder BOM line qty

### Net result
| Field | Before | After |
|---|---|---|
| `numPipes10mmPerNave` | `ceil(holders/2)` | `holders` (1:1) |
| `numNozzles` | `holders` | `holders × 2` ✓ |
| `numHolders` | missing | `nozzlesPerNave × N` |
| `numNozzleHangers` | `holders` | `holders` (unchanged value, correct label) |
| Combo flow `qActualMlH` | half | correct (×2) |
| Combo flow unit | ml/h | l/h |
| Spacing label | "Rozostup trysiek" | "Rozostup medzi držiakmi trysiek" |

No CAD pipe length logic touched (as requested).
