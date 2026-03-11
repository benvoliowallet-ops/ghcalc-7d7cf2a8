
## Nová funkcia: Export BOM do Oberon

### Čo sa postaví

1. **`public/oberon_template.xlsx`** — binárny súbor dekódovaný z base64 (public asset)
2. **`src/utils/exportOberon.ts`** — funkcia `exportToOberon(rows, projectName)` ktorá načíta šablónu, zapíše kódy do stĺpca A a množstvá do stĺpca E od riadku 2, stiahne súbor
3. **`src/utils/prepareBomForOberon.ts`** — helper funkcia ktorá zoskupí `attiLines` podľa kódu (súčet qty) a vráti `OberonRow[]`
4. Pridanie tlačidla **"Export do Oberon"** na:
   - `Step8_Documents.tsx` — vedľa "Export XLSX" v karte "8B – BOM pre Attiho (OBERON)"
   - `ProjectSummary.tsx` — vedľa "XLSX" v karte "Objednávka pre Attiho (OBERON)"
   - `Step10_OrderForm.tsx` — vedľa existujúcich tlačidiel

### Dáta pre export

Vstupom sú **iba ATTI položky** (`attiLines` resp. ATTI-filtrované riadky zo Step10):
- Kód: `line.code` cez `migrateStockCode()` (canonický kód)
- Množstvo: `line.qty`, agregované podľa kódu naprieč všetkými sekciami

### Kľúčové technické detaily

**Template loading:**
```ts
const response = await fetch('/oberon_template.xlsx');
const arrayBuffer = await response.arrayBuffer();
const wb = XLSX.read(arrayBuffer, { type: 'array' });
```

**Zápis len do stĺpcov A (index 0) a E (index 4):**
```ts
ws[XLSX.utils.encode_cell({ r: rowNum - 1, c: 0 })] = { t: 's', v: row.code };
ws[XLSX.utils.encode_cell({ r: rowNum - 1, c: 4 })] = { t: 'n', v: row.quantity };
```

**Uloženie s zachovaním šablóny:**
```ts
XLSX.writeFile(wb, filename, { bookType: 'xlsx', type: 'binary', cellStyles: true });
```

**Dekódovanie base64 šablóny** — použiť `code--write` s `atob()` nie je možné priamo, takže šablónu uložíme cez fetch-ready base64 data URI — v kóde pri `exportToOberon` načítame `/oberon_template.xlsx` zo servera. Súbor musíme zapísať do `public/` ako binárny obsah.

Keďže Lovable `code--write` pracuje s textovými súbormi, použijeme alternatívny prístup: zakódujeme base64 string priamo do `exportOberon.ts` a dekódujeme ho v runtime cez `Uint8Array`:

```ts
const base64 = `UEsDB...`; // celý base64 string
const binary = atob(base64);
const bytes = new Uint8Array(binary.length);
for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
const wb = XLSX.read(bytes, { type: 'array' });
```

Toto eliminuje potrebu `fetch('/oberon_template.xlsx')` a HTTP requesty — šablóna je embedded priamo v kóde. Zároveň zaručuje funkčnosť bez ohľadu na server konfiguráciu.

### Súbory na zmenu

| Súbor | Akcia |
|-------|-------|
| `src/utils/exportOberon.ts` | Vytvorenie — embedded base64 šablóna + `exportToOberon()` |
| `src/components/steps/Step8_Documents.tsx` | Pridanie tlačidla "Oberon" do karty 8B |
| `src/components/ProjectSummary.tsx` | Pridanie tlačidla "Oberon" do karty Objednávka pre Attiho |
| `src/components/steps/Step10_OrderForm.tsx` | Pridanie tlačidla "Oberon" vedľa Export XLSX |

### Poznámka k `prepareBomForOberon`

Funkcia sa umiestni priamo do `exportOberon.ts` (nie separátny súbor) pre jednoduchosť:
```ts
export function prepareBomForOberon(lines: { code: string; qty: number }[]): OberonRow[] {
  const totals = new Map<string, number>();
  lines.forEach(l => {
    if (l.qty <= 0) return;
    const code = migrateStockCode(l.code);
    totals.set(code, (totals.get(code) ?? 0) + l.qty);
  });
  return Array.from(totals.entries()).map(([code, quantity]) => ({ code, quantity }));
}
```

### Celkovo: 4 súbory, ~80 riadkov kódu
