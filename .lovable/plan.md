
## Changes — `src/components/cad/CADModule.tsx` only

### 1. `handleKeyDown` — split Tab (cancel drawing) from Escape (fullscreen hold)

**Line 348–377**: Currently `if (e.key === 'Escape')` does two things:
1. `stopDrawing()` — cancel current drawing action
2. Start the 3-second ESC hold countdown to exit fullscreen

Split these into two independent blocks:

```
// NEW — Tab cancels current drawing action
if (e.key === 'Tab') {
  e.preventDefault();
  stopDrawing();
  return;
}

// KEEP — Escape only starts the fullscreen hold countdown (no stopDrawing)
if (e.key === 'Escape') {
  if (isFullscreen) {
    // ... same ESC hold countdown logic as before ...
  }
}
```

The `handleKeyUp` for `Escape` (lines 410–417) stays completely unchanged — it still re-requests fullscreen on early ESC release.

### 2. Tooltip text — lines 622 & 625

- Line 622: `<p>Esc = zrušiť akciu</p>` → `<p>Tab = zrušiť akciu</p>`
- Line 625: `{isFullscreen && <p className="text-orange-400">ESC 3s = ukončiť</p>}` — **keep unchanged** (this refers to ESC holding for fullscreen exit, which is correct)

### Files
| File | Lines |
|---|---|
| `src/components/cad/CADModule.tsx` | 348–377 (split key handler), 622 (tooltip) |

No other files touched.
