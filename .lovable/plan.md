## Plan — Three CAD UX improvements

### Overview of current code

In `CADModule.tsx`:

- **ESC**: `handleKeyDown` (line 302) calls `stopDrawing()` on `Escape` — no fullscreen exit logic here (browser's native ESC for fullscreen is separate and can't be easily intercepted)
- **Pan**: `handleMouseDown` (line 226) checks `e.button === 1` (middle mouse) → activates pan
- **Fullscreen zone switching**: `activeZoneIndex` is a read-only prop passed from `Step3_Zones.tsx`; there's no zone switcher UI inside `CADModule`

---

### Change 1 — ESC hold-to-exit fullscreen

**Problem**: Browser native `fullscreenchange` fires when ESC is pressed in fullscreen — we can't fully block the browser's own ESC behaviour. The correct approach:

- **Single ESC tap**: calls `stopDrawing()` (cancel current action) — unchanged
- **Hold ESC 3s to exit**: On `keydown` for `Escape`, start a 3-second timer + show a countdown overlay. On `keyup` for `Escape`, cancel the timer. After 3s, call `document.exitFullscreen()`.

Note: browsers will still exit fullscreen on ESC via their native handler. To work around this, we **request fullscreen again immediately** if ESC was released before 3s while in fullscreen. This is a known pattern. Alternatively we rely on `fullscreenchange` and re-request if the hold was incomplete.

Actually the cleanest reliable approach: track ESC hold with `keydown`/`keyup`. On `keydown Escape`:

1. Call `stopDrawing()` (cancel draw action)
2. If in fullscreen, start a 3-second progress countdown. After 3 seconds, allow exit (do nothing extra since browser already exited).
3. On `keyup Escape` before 3 seconds: re-request fullscreen (undo the browser's forced exit)

State needed:

- `escHoldProgress: number | null` (0..100 or null when not holding)
- `escHoldTimerRef: useRef<NodeJS.Timeout | null>` + `escHoldIntervalRef` for progress animation

**Overlay UI**: A small pill in the top-center of the canvas showing `"Podržte ESC pre ukončenie..."` + a progress bar that fills over 3 seconds.

### Change 2 — SPACE bar pan

Replace middle-mouse-button pan activation:

- Add `spaceHeld: boolean` state
- On `keydown Space`: set `spaceHeld = true`, set `prevTool = tool`, switch to pan mode visually (cursor changes)
- On `keyup Space`: set `spaceHeld = false`, restore `prevTool`
- In `handleMouseDown`: remove `e.button === 1` check; instead use `spaceHeld || tool === 'pan'` to activate panning
- Middle mouse wheel scroll for zoom stays unchanged (handled by `handleWheel` which only uses `deltaY`)

State needed:

- `spaceHeld: boolean`
- `prevToolBeforeSpace: Tool | null`

### Change 3 — Zone switcher in fullscreen

`activeZoneIndex` is currently a read-only prop. To allow zone switching inside the module:

- Change the prop to be `activeZoneIndex` + add `setActiveZone` from the store directly inside `CADModule` (already accessible via `useProjectStore`)
- Render a zone pill bar inside the canvas container (absolutely positioned at top-center) **only when `isFullscreen === true**`
- Each pill shows zone name + colored dot + completion checkmark (same style as in `Step3_Zones.tsx`)
- Clicking a pill calls `setActiveZone(i)` from the store

The local `activeZoneIndex` prop can be kept for compatibility with `Step3_Zones` (the parent still controls it when not fullscreen). Inside `CADModule`, use a local `localActiveZone` state that starts from the prop and syncs when prop changes:

```ts
const [localActiveZone, setLocalActiveZone] = useState(activeZoneIndex);
useEffect(() => { setLocalActiveZone(activeZoneIndex); }, [activeZoneIndex]);
```

When fullscreen, use `localActiveZone` for all canvas rendering + switch via the in-canvas picker. When not fullscreen, behaviour is identical to before.

---

### Files changed

`**src/components/cad/CADModule.tsx**` only — all three changes are self-contained within this file.

### Implementation details

```text
New state:
  spaceHeld: boolean = false
  prevToolBeforeSpace: Tool | null = null
  escHoldProgress: number | null = null   (null = not holding, 0..100 = animating)
  escHoldTimerRef: useRef<ReturnType<typeof setTimeout> | null>
  escHoldRafRef: useRef<number | null>  (for rAF-based progress)
  localActiveZone: number (synced to prop when not fullscreen)

handleKeyDown changes:
  - Space keydown → if not in input: set spaceHeld=true, save prevTool, no tool state change needed (isPanning controlled separately)
  - Space keyup → if spaceHeld: restore prevTool, set spaceHeld=false, stop any active panning
  - Escape keydown → stopDrawing() always; if isFullscreen: start 3s countdown
  - Escape keyup → if countdown running AND isFullscreen: cancel countdown, re-request fullscreen

handleMouseDown changes:
  - Change `e.button === 1 || tool === 'pan'` → `spaceHeld || tool === 'pan'`
  
SVG cursor style:
  - `isPanning ? 'grabbing' : (spaceHeld || tool === 'pan') ? 'grab' : ...`

ESC overlay (absolutely positioned in the canvas container, visible only when escHoldProgress !== null && isFullscreen):
  <div className="absolute top-3 left-1/2 -translate-x-1/2 ...">
    Podržte ESC pre ukončenie...
    <div style={{ width: `${escHoldProgress}%` }} className="h-1 bg-red-500 rounded transition-none" />
  </div>

Fullscreen zone picker (absolutely positioned at top-center of canvas, visible only when isFullscreen):
  <div className="absolute top-3 left-1/2 -translate-x-1/2 flex gap-1.5 bg-white/90 backdrop-blur px-2 py-1.5 rounded-xl shadow-lg z-10">
    {zones.map((zone, i) => <button onClick={() => setLocalActiveZone(i)} ... />)}
  </div>
  (same pill style as Step3_Zones zone tabs)
```

The pipe-length display in the left toolbar uses `activeZoneIndex` prop — it should use `localActiveZone` after this change.

### Additional implementation notes

**Space keydown — prevent repeat events:**

In the `keydown` handler for Space, add an early return if `e.repeat === true`:

```ts

if (e.code === 'Space' && !e.repeat) {

  // set spaceHeld = true, save prevTool

}

```

Without this guard, holding Space fires repeated `keydown` events every ~30ms in the browser, which would overwrite `prevToolBeforeSpace` with `'pan'` on the second event — causing the tool to not restore correctly on `keyup`.

**ESC fullscreen re-request — expected flicker:**

The approach of calling `document.requestFullscreen()` again on `keyup` (when hold was < 3s) will cause a brief visual flicker (screen exits and re-enters fullscreen). This is a known browser limitation — fullscreen exit on ESC cannot be fully intercepted. The flicker is acceptable UX for this use case.  
  
No other files need changing.