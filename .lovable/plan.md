
## CAD modul — oprava labelu zóny (clipPath)

### Jeden súbor: `src/components/cad/CADModule.tsx`

**3 zmeny:**

**1. `<defs>` blok (riadky 744–754)** — pridať clipPath pre každú zónu priamo za `labelShadow` filter. Keďže `<defs>` je statický (nemôžeme iterovať tam), clipPaths pridáme ako samostatný blok hneď po `</defs>` (pred `<rect ...fill="url(#grid)"/>`), alebo rozšírime `<defs>` o dynamický obsah:

```tsx
<defs>
  <pattern .../>
  <filter id="labelShadow" .../>
  {cad.zones.map(zone => (
    <clipPath key={zone.zoneIndex} id={`clip-zone-${zone.zoneIndex}`}>
      <rect
        x={zone.x + 4}
        y={zone.y + 4}
        width={zone.width - 8}
        height={zone.height - 8}
      />
    </clipPath>
  ))}
</defs>
```

**2. `labelSize` (riadok 764)** — zmeniť vzorec:
```ts
// z:
const labelSize = Math.max(12, Math.round(Math.min(zone.width, zone.height) * 0.65));
// na:
const labelSize = Math.max(14, Math.min(zone.width, zone.height) * 0.25);
```

**3. `<text>` element labelu (riadok 803–815)** — pridať `clipPath` atribút:
```tsx
clipPath={`url(#clip-zone-${zone.zoneIndex})`}
```

### Súhrn zmien

| Riadok | Zmena |
|--------|-------|
| 744–754 | Rozšíriť `<defs>` o dynamické `<clipPath>` pre každú zónu |
| 764 | Nový vzorec pre `labelSize` |
| 803–815 | Pridať `clipPath={...}` na `<text>` |
