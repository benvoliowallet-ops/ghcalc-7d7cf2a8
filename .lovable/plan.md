## Understanding the current logic

In `detectConcurrentPipes` (`calculations.ts` lines 308–345), for each sweep-line interval with `count` concurrent pipes:

- **H segments (RACMET)**: calls `bracketPipeCount(count)` → maps to 2/4/6 → picks one code → accumulates qty
- **V segments (kratovnica/trellis)**: same pattern

`bracketPipeCount` rounds up to nearest tier (≤2→2, ≤4→4, else→6), `getTrellisBracketCode`/`getRacmetBracketCode` pick the single code.

**Problem**: This always picks a single bracket size. For N=8 pipes it picks the "6" bracket once — but it should use 6+2 (two bracket items). The user wants a greedy decomposition that produces multiple BOM lines per interval.

Also: kratovnica now has a 1-pipe variant (`snfg.05.0004`) that isn't exposed — `bracketPipeCount` has no case for 1. And `snfg.05.0008` (RACMET 2-pipe) already exists in `stockItems.ts` (line 55), so no DB addition needed.

## The fix

### 1. New helper: `decomposeBrackets`

```ts
// Greedy largest-first decomposition
// trellis variants: [{pipes:6,code:'snfg.05.0018'},{pipes:4,code:'snfg.05.0006'},{pipes:2,code:'snfg.05.0005'},{pipes:1,code:'snfg.05.0004'}]
// racmet variants:  [{pipes:6,code:'snfg.05.0012'},{pipes:4,code:'snfg.05.0010'},{pipes:2,code:'snfg.05.0008'}]
// Returns: Map<code, { qty, name, slots, direction }>

function decomposeBrackets(
  n: number,
  type: 'trellis' | 'racmet'
): { code: string; pipeSlots: number }[]
```

Algorithm:

- Define sorted variants descending (6, 4, 2, [1 for trellis])
- `remaining = n`
- For each variant (largest first): while `remaining >= variant.pipes` → add 1 bracket of this size, `remaining -= variant.pipes`
- If `remaining > 0` after loop (only possible for racmet with odd remainder, e.g. 1 left): add 1 of smallest available variant (2-pipe) to cover it

Examples:

- 8 RACMET: 6+2 → `[{snfg.05.0012,1},{snfg.05.0008,1}]`
- 7 RACMET: 6 fits, rem=1 → can't cover with 2 exactly, but rule says "overshoot is OK" → 6+2
- 9 RACMET: 6+2+2 (rem=3 after 6, 2+2 > 3 but nearest: actually: 6, rem=3, largest fitting=2, add 2→rem=1, add 2→rem=-1) → `[{snfg.05.0012,1},{snfg.05.0008,2}]`
- 7 kratovnica: 6+1 → `[{snfg.05.0018,1},{snfg.05.0004,1}]`
- 5 kratovnica: 4+1 → `[{snfg.05.0006,1},{snfg.05.0004,1}]`

### 2. Update `detectConcurrentPipes`

Replace `bracketPipeCount` + `getRacmetBracketCode`/`getTrellisBracketCode` calls with `decomposeBrackets`. For each sweep-line interval:

```ts
// Instead of: one code + one qty
// Do:
const pieces = decomposeBrackets(iv.count, 'racmet'); // or 'trellis'
const numBracketsNeeded = Math.ceil(lenM / spacing); // spacing=2.5 for racmet, 2.66 for trellis
for (const piece of pieces) {
  accBOM(piece.code, numBracketsNeeded * piece.qty, piece.slots, dir, name);
}
```

Wait — `numBracketsNeeded` is the number of bracket *positions* along the pipe length. Each position needs one complete set of brackets to hold all concurrent pipes. So for 8 concurrent pipes at 10 positions: we need 10 sets of [6+2] = 10×snfg.05.0012 + 10×snfg.05.0008.

So: `decompose(8,'racmet')` returns `[{code:'snfg.05.0012',qty:1},{code:'snfg.05.0008',qty:1}]` — then multiply each `qty` by `numBracketsNeeded`.

### 3. Update `BracketBOMLine` type

Remove `slots: 2 | 4 | 6` constraint (now optional or generalize) — actually slots is used in CAD visualization. Keep it but make the decomposed pieces carry appropriate slots. Since the decomposed pieces may be various sizes, update `slots` to reflect the piece's actual pipe count.

### 4. Files changed

`**src/utils/calculations.ts**`:

- Add `TRELLIS_VARIANTS` and `RACMET_VARIANTS` constants
- Add `decomposeBrackets(n, type)` helper returning `{code, pipeSlots, name}[]`
- Refactor `detectConcurrentPipes` inner accumulation loop to use `decomposeBrackets`
- Remove/keep `bracketPipeCount`, `getTrellisBracketCode`, `getRacmetBracketCode` (still used by CAD visualization for the concurrent badge display — keep them)

`**src/types/index.ts**`:

- Relax `slots: 2 | 4 | 6` to `slots: 1 | 2 | 4 | 6` in `BracketBOMLine`

No changes needed to `ProjectSummary.tsx`, `Step8_Documents.tsx`, or `ProjectPDF.tsx` — they just iterate `bracketBOM` which will now have more lines automatically.

No DB migration needed — `snfg.05.0008` already exists in `stockItems.ts` line 55.

### Algorithm detail (edge cases)

```ts
function decomposeBrackets(n: number, type: 'trellis' | 'racmet') {
  const variants =
    type === 'trellis'
      ? [{pipes:6,code:'snfg.05.0018'},{pipes:4,code:'snfg.05.0006'},{pipes:2,code:'snfg.05.0005'},{pipes:1,code:'snfg.05.0004'}]
      : [{pipes:6,code:'snfg.05.0012'},{pipes:4,code:'snfg.05.0010'},{pipes:2,code:'snfg.05.0008'}];

  const result: {code:string; pipes:number; count:number}[] = [];
  let rem = n;
  
  for (const v of variants) {
    if (rem <= 0) break;
    const qty = Math.floor(rem / v.pipes);
    if (qty > 0) {
      result.push({code: v.code, pipes: v.pipes, count: qty});
      rem -= qty * v.pipes;
    }
  }
  
  // If remainder > 0 (racmet can't cover with even sizes), use smallest variant (2) to overshoot
  if (rem > 0) {
    const smallest = variants[variants.length - 1];
    const existing = result.find(r => r.code === smallest.code);
    if (existing) existing.count += 1;
    else result.push({code: smallest.code, pipes: smallest.pipes, count: 1});
  }
  
  return result;
}
```

Example traces:

- 7 RACMET: `rem=7`, floor(7/6)=1→rem=1, floor(1/4)=0, floor(1/2)=0 → rem=1>0 → add 1×snfg.05.0008 → `[{0012,1},{0008,1}]` ✓
- 9 RACMET: `rem=9`, floor(9/6)=1→rem=3, floor(3/4)=0, floor(3/2)=1→rem=1 → rem=1>0 → add 1×snfg.05.0008 (existing count becomes 2) → `[{0012,1},{0008,2}]` ✓
- 7 kratovnica: `rem=7`, floor(7/6)=1→rem=1, floor(1/4)=0, floor(1/2)=0, floor(1/1)=1→rem=0 → `[{0018,1},{0004,1}]` ✓
- 5 kratovnica: `rem=5`, floor(5/6)=0, floor(5/4)=1→rem=1, floor(1/2)=0, floor(1/1)=1→rem=0 → `[{0006,1},{0004,1}]` ✓

### In `detectConcurrentPipes`

```ts
// H group (RACMET):
const numBrackets = Math.ceil(lenM / 2.5);
for (const piece of decomposeBrackets(iv.count, 'racmet')) {
  const name = `Zabetónovaný držiak RACMET ${piece.pipes} vedení`;
  accBOM(piece.code, numBrackets * piece.count, piece.pipes as 1|2|4|6, 'racmet', name);
}

// V group (trellis):
const numBrackets = Math.ceil(lenM / 2.66);
for (const piece of decomposeBrackets(iv.count, 'trellis')) {
  const name = `Drziak kratovnica ${piece.pipes} vedení`;
  accBOM(piece.code, numBrackets * piece.count, piece.pipes as 1|2|4|6, 'trellis', name);
}
```

The `accBOM` function signature doesn't need to change, only `slots` type in `BracketBOMLine`.  
  
Also insert the following item into the warehouse database (Supabase stock_items table) 

if it does not already exist:

code: snfg.05.0008

name: "Zabetónovaný držiak s RACMET profilom, 7cmX65cm - pre dve trubky"

group: "Zabetónovaný držiak"