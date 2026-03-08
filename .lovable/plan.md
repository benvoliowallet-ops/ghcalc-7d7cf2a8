
## Plán — kliknutie na logo/text otvára Projekty

### Problém
Logo (obrázok) a text „Greenhouse Calc" v hlavičke Sidebarsu nemajú žiadnu interaktivitu.

### Riešenie
Zabaliť logo + text do jedného `<button>` (alebo `<div>` s `onClick`) ktorý zavolá `setView('dashboard')`.

### Zmena v `src/components/Sidebar.tsx`

Riadky 37–47 — `<div className="flex items-center h-14 ...">` nahradiť `<button>` s `onClick={() => setView('dashboard')}`:

```text
Pred:
<div className="flex items-center h-14 px-3.5 border-b ...">
  <img ... />
  <span ...>Greenhouse Calc</span>
</div>

Po:
<button onClick={() => setView('dashboard')} className="flex items-center h-14 px-3.5 border-b ... hover:opacity-80 transition-opacity cursor-pointer w-full text-left" title="Projekty">
  <img ... />
  <span ...>Greenhouse Calc</span>
</button>
```

Jedna zmena, jeden súbor.
