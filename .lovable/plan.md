
## Draggable AI Chat Button — vertikálne presúvanie

### Čo treba spraviť

Floating tlačidlo AI asistenta (momentálne fixné `bottom-20 right-4`) dostane možnosť ťahať hore/dole. Chat panel sa otvorí vždy pri pôvodnej / defaultnej pozícii (bottom-20) a po zatvorení chatu sa tlačidlo vráti na pôvodnú pozíciu.

### Implementácia

**Logika v `src/components/VoraAIChat.tsx`:**

1. **State pre pozíciu**: `bottomOffset` — číselná hodnota v px, default = `80` (= `bottom-20` = 5rem = 80px)
2. **DEFAULT_BOTTOM** = `80` — konštanta pre "pôvodné miesto"
3. **Drag handling** — `onMouseDown` / `onTouchStart` na tlačidle, sledujeme `clientY` delta:
   - `mousemove` / `touchmove` → aktualizuj `bottomOffset`
   - `mouseup` / `touchend` → ukonči drag
   - Obmedzenie: `min = 16px`, `max = window.innerHeight - 80px`
4. **Rozlíšenie drag vs. click**: ak pohyb < 5px → považuje sa za click (toggle open), inak je to drag
5. **Auto-reset**: keď `open` sa zmení na `true` (otvorenie chatu) → animovane vráti `bottomOffset` na `DEFAULT_BOTTOM`

**Vizuál:**
- Na hover tlačidla zobrazíme malú `⠿` drag ikonu (6 bodiek) v ľavej/hornej časti tlačidla ako hint
- Cursor `cursor-grab` počas hover, `cursor-grabbing` počas drag
- Chat panel sleduje `bottomOffset` (= `bottom: bottomOffset + 80px` t.j. tlačidlo + gap)

### Technické detaily

```text
Tlačidlo: style={{ bottom: bottomOffset, right: 16 }}
Chat panel: style={{ bottom: bottomOffset + 80, right: 16, maxHeight: '520px' }}

onMouseDown → zaznač startY, isDragging=false
onMouseMove → ak |delta| > 5px, isDragging=true, prepočítaj bottomOffset
onMouseUp → ak !isDragging → toggle open
             ak isDragging → koniec drag (NEntoggle)

useEffect([open]) → ak open===true → bottomOffset = DEFAULT_BOTTOM (smooth transition cez CSS)
```

Zmena len v jednom súbore: **`src/components/VoraAIChat.tsx`**
