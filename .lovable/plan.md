
## Upozornenie na výkon čerpadla — Krok 3

### Kde

V `ZoneParamsTab` vo `src/components/steps/Step3_Zones.tsx`, priamo pod existujúcim blokom "Plocha zóny" (riadky 229–232), ktorý zobrazuje vypočítanú plochu.

### Výpočet

Prietok pre danú zónu v LPM sa vypočíta z parametrov dostupných priamo v `ZoneParamsTab`:

```ts
const WALL_OFFSET_M = 0.75;
const effectiveLength = Math.max(0, zone.length - 2 * WALL_OFFSET_M);
const spacingM = zone.nozzleSpacing / 100;
const nozzlesPerNaveRaw = effectiveLength > 0 && spacingM > 0
  ? Math.floor(effectiveLength / spacingM) + 1 : 0;
// zaokrúhliť na párne (rovnako ako calcZone)
const nozzlesPerNave = nozzlesPerNaveRaw % 2 === 0 ? nozzlesPerNaveRaw : nozzlesPerNaveRaw + 1;
const totalNozzles = nozzlesPerNave * zone.numNaves * 2; // 2 trysky/držiak
const flowLpm = totalNozzles * zone.nozzleFlow; // nozzleFlow je v l/min
```

Ak `flowLpm > 100`, zobrazíme červené upozornenie.

### Zmena — 1 súbor, ~10 riadkov

**`src/components/steps/Step3_Zones.tsx`** — v `ZoneParamsTab`, za blokom s plochou (line ~232):

```tsx
{flowLpm > 100 && (
  <div className="mt-2 flex items-start gap-2 p-3 bg-red-50 border border-red-300 rounded-lg">
    <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
    <p className="text-sm text-red-700">
      ⚠️ Požadovaný prietok <strong>{flowLpm.toFixed(1)} LPM</strong> prekračuje maximálny výkon čerpadla (100 LPM). Zvážte rozdelenie zóny na viacero okruhov.
    </p>
  </div>
)}
```

`AlertTriangle` je už importovaný (riadok 2).

### Súbory na zmenu

| Súbor | Zmena |
|-------|-------|
| `src/components/steps/Step3_Zones.tsx` | +výpočet `flowLpm`, +podmienený banner (~10 riadkov) |
