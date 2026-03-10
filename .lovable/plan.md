## Problem

Pan calls `setViewBox(...)` inside `handleMouseMove` on every mouse event → React re-renders the entire SVG tree hundreds of times per second → flicker.

## Exact Changes — `src/components/cad/CADModule.tsx` only

### Step 1 — Add a `viewBoxRef` ref to hold the live pan state (line ~69)

Add two new refs alongside the existing ones:

```ts
const viewBoxRef = useRef({ x: 0, y: 0, w: 1200, h: 700 });
const panStartRef = useRef<{ mx: number; my: number; vx: number; vy: number } | null>(null);
```

Keep `const [viewBox, setViewBox] = useState(...)` unchanged — it still drives React renders for zoom/fitToView/mouseUp.

### Step 2 — `handleMouseDown` (line 263–266): replace `setPanStart` with `panStartRef`

```ts
// BEFORE:
setPanStart({ mx: rawPt.x, my: rawPt.y, vx: viewBox.x, vy: viewBox.y });

// AFTER:
panStartRef.current = { mx: rawPt.x, my: rawPt.y, vx: viewBox.x, vy: viewBox.y };
setIsPanning(true);  // keep — changes cursor
```

Remove `setPanStart(...)` call. Keep `setIsPanning(true)` for cursor style.

Also keep `viewBox` in the deps array of `handleMouseDown` (used to snapshot `vx/vy` at pan start via `viewBoxRef.current`). Actually switch to reading from `viewBoxRef.current` instead of `viewBox` directly so `viewBox` can be removed from deps:

```ts
panStartRef.current = { mx: rawPt.x, my: rawPt.y, vx: viewBoxRef.current.x, vy: viewBoxRef.current.y };
```

### Step 3 — `handleMouseMove` pan branch (lines 174–179): DOM setAttribute, no setState

```ts
// BEFORE:
if (isPanning && panStart) {
  const dx = rawPt.x - panStart.mx;
  const dy = rawPt.y - panStart.my;
  setViewBox((v) => ({ ...v, x: panStart.vx - dx, y: panStart.vy - dy }));
  return;
}

// AFTER:
if (isPanning && panStartRef.current) {
  const ps = panStartRef.current;
  const dx = rawPt.x - ps.mx;
  const dy = rawPt.y - ps.my;
  const nx = ps.vx - dx;
  const ny = ps.vy - dy;
  viewBoxRef.current = { ...viewBoxRef.current, x: nx, y: ny };
  if (svgRef.current) {
    svgRef.current.setAttribute('viewBox', `${nx} ${ny} ${viewBoxRef.current.w} ${viewBoxRef.current.h}`);
  }
  return;
}
```

No `setViewBox` during pan drag → zero React re-renders during pan.

### Step 4 — `handleMouseUp` (lines 311–316): sync ref → state once

```ts
const handleMouseUp = useCallback(() => {
  if (isPanning) {
    // Sync final pan position back to React state (single re-render)
    setViewBox({ ...viewBoxRef.current });
  }
  setIsPanning(false);
  panStartRef.current = null;
  setDraggingZone(null);
  setGuideLines([]);
}, [isPanning]);
```

### Step 5 — Keep `viewBoxRef` in sync when React state changes (zoom/fitToView)

`setViewBox` is still used by `handleWheel` and `fitToView`. After each such call, `viewBoxRef` must be updated. The cleanest way: add a `useEffect` that mirrors state → ref:

```ts
useEffect(() => {
  viewBoxRef.current = viewBox;
}, [viewBox]);
```

This also ensures `handleMouseDown` reads the correct `vx/vy` after a zoom.

### Step 6 — Clean up removed `panStart` state

- Remove `const [panStart, setPanStart] = useState<...>(null)` (line 71)
- Remove `setPanStart` from `handleMouseUp` (already replaced above)
- Update `handleMouseMove` deps: remove `panStart`, remove `viewBox` (no longer needed there)
- Update `handleMouseDown` deps: remove `viewBox` (now reads from `viewBoxRef.current`)

### Grid rect (line 708)

`<rect x={viewBox.x - 1000} ...>` — this still reads `viewBox` (React state). During pan, this lags until mouseUp. But the grid is rendered via `fill="url(#grid)"` pattern which is viewport-relative anyway — the grid pattern moves correctly because the SVG `viewBox` attribute is updated directly. The grid `<rect>` position only matters to ensure it covers the visible area. A large fixed coverage like `x="-10000" y="-10000" width="20000" height="20000"` would eliminate the need to ever update it. Change this rect to use fixed large coordinates instead of `viewBox`-based ones:

```tsx
<rect x={-10000} y={-10000} width={20000} height={20000} fill="url(#grid)" />
```

This avoids the last remaining `viewBox`-dependency in the SVG body that would cause issues during pan. Make sure svgRef is attached to the <svg> element: 

<svg ref={svgRef} ...>

If svgRef doesn't exist yet, add: const svgRef = useRef<SVGSVGElement>(null)

## Summary of lines to touch


| Lines                      | Change                                                              |
| -------------------------- | ------------------------------------------------------------------- |
| 51–60 (refs section)       | Add `viewBoxRef` and `panStartRef` refs                             |
| 71                         | Remove `panStart` state                                             |
| 174–179                    | Replace `setViewBox` with DOM `setAttribute` + `viewBoxRef` update  |
| 263–266                    | Replace `setPanStart` with `panStartRef.current = ...`              |
| 311–316                    | Add one-time `setViewBox(viewBoxRef.current)` on mouseUp            |
| ~446 (after useState decl) | Add `useEffect(() => { viewBoxRef.current = viewBox; }, [viewBox])` |
| 708                        | Replace `viewBox.x/y/w/h` in grid rect with fixed large coords      |
| `handleMouseMove` deps     | Remove `panStart`                                                   |
| `handleMouseDown` deps     | Remove `viewBox`                                                    |
