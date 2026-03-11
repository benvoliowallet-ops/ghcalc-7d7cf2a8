
## Zmeny v Kroku 3 — Darcy-Weisbach

### Čo treba urobiť

**Zmena 1: `src/utils/calculations.ts` — riadok 79**
- Zmeniť `const lambda = 0.03;` na `const lambda = 0.015;`
- (Poznámka: v zadaní je 0.020→0.015, ale skutočná hodnota v kóde je 0.03 — zmeníme na 0.015 podľa zadania)

**Zmena 2: `src/components/steps/Step3_Zones.tsx` — 2 miesta kde sa zobrazuje `pressureDrop`**

Riadok 172 (v tabuľke zón):
```tsx
// PRED:
<td className="p-3 text-right">{fmtN(calc.pressureDrop, 4)} bar</td>

// PO:
<td className="p-3 text-right">
  <span className={calc.pressureDrop > 20 ? 'text-red-600 font-semibold' : ''}>
    {fmtN(calc.pressureDrop, 4)} bar
    {calc.pressureDrop > 20 && <AlertTriangle className="inline w-3 h-3 ml-1 text-red-600" />}
  </span>
</td>
```

Riadok 303 (v karte 3H · Darcy-Weisbach):
```tsx
// Aktuálna hodnota je reťazec fmtN(calc.pressureDrop, 4) — pridáme vizuálnu indikáciu
// v rows array nie je možné priamo vložiť JSX, takže toto miesto ostáva ako text bez ikonky
// (ikonka bude len v tabuľke kde je priamy JSX render)
```

### Súbory na zmenu

| Súbor | Riadok | Zmena |
|-------|--------|-------|
| `src/utils/calculations.ts` | 79 | `0.03` → `0.015` |
| `src/components/steps/Step3_Zones.tsx` | 172 | Pridanie podmienečného červeného štýlu a `AlertTriangle` ikony |

`AlertTriangle` je už importovaný v Step3_Zones.tsx (používa sa v riadku 173).

### Celkovo: 2 súbory, 3 riadky
