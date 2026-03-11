
## Upozornenie pri prekročení 100 LPM — Krok 2

### Kde a čo

**Súbor: `src/components/steps/Step2_GlobalParams.tsx`**

Krok 2 zobrazuje globálne parametre. Zo store načítame aj `zones[]` (každá má `length`, `width`, `numNaves`). Výpočet prietoku per-zóna:

```
flowLpm = fogCapacity [ml/hod/m²] × area [m²] / 60 000
```
→ prevod: ml/hod → l/min: vydeliť 60 (hod→min) × 1000 (ml→l) = 60 000

### Zmeny

**1. Rozšíriť destructuring** — pridať `zones` do `useProjectStore()`:
```ts
const { globalParams, updateGlobalParams, zones } = useProjectStore();
```

**2. Vypočítať upozornenia** — priamo v komponente:
```ts
const MAX_PUMP_LPM = 100;
const zoneWarnings = zones.map((z, i) => {
  const area = z.length * z.width * z.numNaves;
  const flowLpm = (globalParams.fogCapacity * area) / 60000;
  return flowLpm > MAX_PUMP_LPM ? { index: i, name: z.name, flowLpm } : null;
}).filter(Boolean);
```

**3. Zobraziť banner** — pridať pod kartu "Základné parametre" (alebo na koniec gridu):
```tsx
{zoneWarnings.length > 0 && (
  <div className="md:col-span-2 bg-red-50 border border-red-300 rounded-lg p-4 flex gap-3">
    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
    <div>
      <p className="font-semibold text-red-700 text-sm mb-1">Upozornenie — výkon čerpadla</p>
      {zoneWarnings.map(w => (
        <p key={w.index} className="text-red-600 text-sm">
          {w.name}: požadovaný prietok {w.flowLpm.toFixed(1)} LPM prekračuje maximálny výkon čerpadla (100 LPM). Rozdeľte zónu na viacero okruhov.
        </p>
      ))}
    </div>
  </div>
)}
```

Banner sa zobrazí iba ak aspoň jedna zóna prekračuje 100 LPM. Krok 2 má `zones` v store k dispozícii (nastavia sa v Kroku 3), takže ak zóna ešte nemá zadané rozmery (defaultne 50×8×1 = 400 m², 150 ml/hod → 1 LPM), upozornenie sa nezobrazí.

### Súbory na zmenu

| Súbor | Zmeny |
|-------|-------|
| `src/components/steps/Step2_GlobalParams.tsx` | Pridanie `zones` zo store, výpočet `zoneWarnings`, červený banner v JSX |

### Celkovo: 1 súbor, ~20 riadkov
