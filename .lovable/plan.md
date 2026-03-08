
## Replace all remaining emojis with Lucide icons

### Files affected and what to change

**1. `src/App.tsx`** — Save/New buttons in project step strip
- `💾 Uložiť` → `<Save className="w-3.5 h-3.5" /> Uložiť` (Save icon)
- `↺ Nový` → `<RotateCcw className="w-3.5 h-3.5" /> Nový` (RotateCcw icon)
- `⟳` (spinning save indicator) → `<Loader2 className="w-3 h-3 animate-spin" />`
- `✓` (saved) → `<Check className="w-3 h-3" />`
- `⚠` (error) → `<AlertTriangle className="w-3 h-3" />`

**2. `src/components/Dashboard.tsx`**
- `📍 {project.projectAddress}` → `<MapPin className="w-3 h-3" /> {project.projectAddress}`
- `🕒 {formatDate(...)}` → `<Clock className="w-3 h-3" /> {formatDate(...)}`
- `📄 Prehľad projektu` → `<FileText className="w-3.5 h-3.5" /> Prehľad projektu`
- `▶ Pokračovať` → `<Play className="w-3.5 h-3.5" /> Pokračovať`

**3. `src/components/ProjectSummary.tsx`**
- `Hotovo ✓` badge → `Hotovo <Check className="w-3 h-3 inline" />`
- `📍 {project.projectAddress}` → `<MapPin className="w-3.5 h-3.5" /> address`
- `🖨 Tlačiť` (×3) → `<Printer className="w-3.5 h-3.5" /> Tlačiť`
- `📥 Export XLSX` (×3) → `<Download className="w-3.5 h-3.5" /> Export XLSX`
- `✏️ Otvoriť wizard` → `<Pencil className="w-3.5 h-3.5" /> Otvoriť wizard`

**4. `src/components/steps/Step2_GlobalParams.tsx`**
- `⚠ Vždy SS...` title text → `<AlertTriangle className="w-3.5 h-3.5 inline" /> Vždy SS...`
- `📊 Zhrnutie parametrov` card title → `Zhrnutie parametrov` (card already has section styling, just remove emoji)

**5. `src/components/steps/Step3_Zones.tsx`**
- Tab labels: `📋 3A–3D Parametre` → `<List className="w-3.5 h-3.5" /> 3A–3D Parametre`
- Tab labels: `✏️ 3G Výkres (CAD)` → `<PenLine className="w-3.5 h-3.5" /> 3G Výkres (CAD)`
- Tab labels: `📊 3E–3L Výsledky` → `<BarChart2 className="w-3.5 h-3.5" /> 3E–3L Výsledky`
- `↺ Vygenerovať zóny` button → `<RotateCcw className="w-3.5 h-3.5" /> Vygenerovať zóny`
- Empty state `📊` large icon → `<BarChart2 className="w-8 h-8 text-muted-foreground/40" />`
- Empty state `✏️` large icon → `<PenLine className="w-8 h-8 text-muted-foreground/40" />`
- Zone selector `✓` / `○` → `<Check className="w-3 h-3" />` / `<Circle className="w-3 h-3" />`

**6. `src/components/steps/Step5_PumpETNA.tsx`**
- `✓ Vybrané: {uvSystemCode}` → `<Check className="w-3 h-3 inline" /> Vybrané: ...`
- `⚠ FOGSYSTEM NORMIST` → `<AlertTriangle className="w-3.5 h-3.5 inline" /> FOGSYSTEM NORMIST`
- `⚠ Nad kapacitou` → `<AlertTriangle className="w-3 h-3 inline" /> Nad kapacitou`

**7. `src/components/steps/Step6_Costs.tsx`**
- `📊 Súhrn nákladov (krok 6)` card title → `Súhrn nákladov (krok 6)` (drop emoji, card title has own styling)

**8. `src/components/steps/Step9_PreOrderCheck.tsx`**
- `🔍 Kontrola 1...` card titles (×3) → `<Search className="w-3.5 h-3.5 inline" /> Kontrola 1...`
- `✅ Zhrnutie kontroly` card title → `<CheckCircle className="w-3.5 h-3.5 inline" /> Zhrnutie kontroly`
- `✓ Fixná sadzba...` → `<Check className="w-3 h-3 inline" /> Fixná sadzba...`
- Badge `✓ Skontrolované` / `⚠ Chýba` → `<Check className="w-3 h-3" />` / `<AlertTriangle className="w-3 h-3" />`
- `{etnaAccessoryCost} € ✓` → `{etnaAccessoryCost} € <Check className="w-3 h-3 inline" />`
- Rope total badge `m ✓` → `m <Check className="w-3 h-3 inline" />`

**9. `src/components/admin/ChangeLogPage.tsx`**
- `🔍 Hľadať...` placeholder → `Hľadať...` (just text in placeholder, no visible icon — simply remove the emoji from the placeholder string)
- `📋` empty state large icon → `<ClipboardList className="w-8 h-8 text-muted-foreground/40" />` (this component already imports ClipboardList!)

**10. `src/components/stock/StockPage.tsx`**
- `🔍 Hľadať...` placeholder → `Hľadať...` (just remove from placeholder string)
- `＋ Pridať položku` → `<Plus className="w-4 h-4" /> Pridať položku`
- Sort arrows `↑` / `↓` / `↕` → `<ChevronUp />` / `<ChevronDown />` / `<ChevronsUpDown />` (small, inline)

**11. `src/components/stock/StockItemModal.tsx`**
- `⚠️ {error}` → `<AlertTriangle className="w-3.5 h-3.5 inline mr-1" /> {error}`

**12. `src/components/cad/CADModule.tsx`**
- `🗑 Zmazať` → `<Trash2 className="w-3.5 h-3.5" /> Zmazať`
- `⚙` pump tool icon → `<Settings className="w-4 h-4" />` (rendered in the icon slot `t.icon` — this is a char in a `<span>`, just replace)
- `↩ Undo` → `<Undo2 className="w-3.5 h-3.5" /> Undo`
- `⊡ Fit to view` → `<Maximize2 className="w-3.5 h-3.5" /> Fit to view`
- `✕ Ukončiť` / `⛶ Celá obrazovka` → `<Minimize2 /> Ukončiť` / `<Maximize2 /> Celá obrazovka`

### Icon imports used across files
All from `lucide-react`: `Save`, `RotateCcw`, `Loader2`, `Check`, `AlertTriangle`, `MapPin`, `Clock`, `FileText`, `Play`, `Printer`, `Download`, `Pencil`, `List`, `PenLine`, `BarChart2`, `Search`, `CheckCircle`, `Plus`, `ChevronUp`, `ChevronDown`, `ChevronsUpDown`, `Trash2`, `Settings`, `Undo2`, `Maximize2`, `Minimize2`, `Circle`

### Notes
- Card titles that have emoji inline (e.g. `"📊 Zhrnutie"`) — the `Card` component renders title as a string, so either: (a) strip the emoji from the string, or (b) change Card to accept `ReactNode` title. Since several card titles need icons, the cleanest approach is to **strip emojis from card titles** and just use clean text (card variants already provide color/context). This avoids refactoring Card's type.
- For inline text like `✓ Vybrané: ...` and `⚠ FOGSYSTEM NORMIST` inside JSX, icons are wrapped in `<span className="inline-flex items-center gap-1">`.
- CAD toolbar icons (`t.icon`) — the toolbar renders each tool's icon as a char inside a `<span>`. For `⚙` (pump), replace with a `<Settings size={16} />`. Other CAD symbols (`~`, `·`, `↖`, `✋`, `—`, `⊕`, `◈`) are geometric/technical shorthand that are part of the CAD tool palette identity — these are borderline (not decorative emoji) so they can stay, except `⚙` which is a proper emoji.
