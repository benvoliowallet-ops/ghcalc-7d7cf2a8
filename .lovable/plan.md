
## CAD modul — 4 úpravy

### Zmena 1 — Väčší label zóny (riadok 733)
Aktuálny kód: `Math.min(20, Math.max(12, Math.round(zone.height / 5)))`
Nový kód: `Math.round(Math.min(zone.width, zone.height) * 0.65)`
- Pridám `Math.max(12, Math.min(zone.width, zone.height) * 0.65)` aby mal minimálne 12px

---

### Zmena 2 — Generovať zóny = kompletný reset (Step3_Zones.tsx, riadok 85)
Aktuálne `initCADZones()` resetuje iba pozície zón, ale ponecháva `segments` a `symbols`.

Pridáme volanie `setCADData([], [])` pred `initCADZones()`:
```ts
const handleInitCADZones = async () => {
  if (cad.segments.length > 0 || cad.zones.length > 0) {
    const ok = await confirm({ ... });
    if (!ok) return;
  }
  setCADData([], []); // ← vymaže všetky čiary a symboly
  initCADZones();
};
```
Treba importovať `setCADData` zo store.

---

### Zmena 3 — Kliknutie na čiaru v akomkoľvek móde ju vyberie
Aktuálne: `selectElement` kontroluje `if (tool === 'select')` — funguje len v select móde.

Zmena: pri kliknutí na čiaru v PIPE alebo CABLE móde (nie drawing) — alebo kedykoľvek — ju zvýrazniť. Najjednoduchší prístup: umožniť výber segmentu v **akomkoľvek nástroji** (okrem aktívneho kreslenia). Zmeníme `selectElement` aby nevyžadoval `tool === 'select'`:

```ts
const selectElement = (id: string, type: SelectedType, e: React.MouseEvent) => {
  e.stopPropagation();
  // Allow selection in any tool when not actively drawing
  if (!drawing.isDrawing) {
    setSelectedId(id === selectedId ? null : id);
    setSelectedType(id === selectedId ? null : type);
  }
};
```

A visible segment click `cursor` zmeniť na `pointer` vždy (nie len v select mode).

---

### Zmena 4 — Redo (Ctrl+Y)
Aktuálne: `history` stack pre undo existuje, ale redo neexistuje.

Pridáme `redoStack` state:
```ts
const [redoStack, setRedoStack] = useState<HistoryEntry[]>([]);
```

**`pushHistory`** — pri každej novej akcii vyčisti redo stack:
```ts
const pushHistory = useCallback(() => {
  setHistory((h) => [...h.slice(-29), { segments: [...cad.segments], symbols: [...cad.symbols] }]);
  setRedoStack([]); // nová akcia maže redo históriu
}, [cad.segments, cad.symbols]);
```

**Undo (Ctrl+Z)** — aktuálna pozícia sa pushne do redoStack:
```ts
if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
  const prev = history[history.length - 1];
  if (prev) {
    setRedoStack(r => [...r, { segments: [...cad.segments], symbols: [...cad.symbols] }]);
    setHistory(h => h.slice(0, -1));
    setCADData(prev.segments, prev.symbols);
  }
}
```

**Redo (Ctrl+Y alebo Ctrl+Shift+Z)**:
```ts
if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
  const next = redoStack[redoStack.length - 1];
  if (next) {
    setHistory(h => [...h, { segments: [...cad.segments], symbols: [...cad.symbols] }]);
    setRedoStack(r => r.slice(0, -1));
    setCADData(next.segments, next.symbols);
  }
}
```

Aktualizovať aj Undo tlačidlo v toolbare — prípadne pridať Redo tlačidlo.

---

### Súbory na zmenu

| Súbor | Zmeny |
|-------|-------|
| `src/components/cad/CADModule.tsx` | Zmeny 1, 3, 4 — label size, selectElement, redoStack |
| `src/components/steps/Step3_Zones.tsx` | Zmena 2 — kompletný reset pred initCADZones |

### Celkovo: 2 súbory, ~20 riadkov
