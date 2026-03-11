
## Funkcia: Dokončiť projekt + história úprav

### Prehľad zmien

7 súborov + 1 DB migrácia

---

### DB migrácia

```sql
-- 1. Add status column to projects
ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'in_progress';

-- 2. Create project_changes table
CREATE TABLE public.project_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  changed_at timestamptz DEFAULT now(),
  changed_by uuid,   -- soft ref to auth.users
  changed_by_email text NOT NULL DEFAULT '',
  reason text NOT NULL
);

ALTER TABLE public.project_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view project changes"
  ON public.project_changes FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can insert project changes"
  ON public.project_changes FOR INSERT
  WITH CHECK (auth.uid() = changed_by);
```

---

### Zmeny v súboroch

**1. `src/types/index.ts`**
- Pridať `status?: 'in_progress' | 'completed'` do `SavedProject`
- Pridať nový interface `ProjectChangeEntry { id, projectId, changedAt, changedBy, changedByEmail, reason }`

**2. `src/hooks/useProjects.ts`** — `useLoadProjects`
- Načítať `status` column z DB pri `select(...)`, mapovať do `SavedProject`

**3. `src/hooks/useProjectChanges.ts`** (nový hook)
```ts
// useProjectChanges(projectId) — load changes for a project
// useAllProjectChanges() — load all changes (for ChangeLogPage tab)
// markProjectCompleted(projectId) — UPDATE projects SET status='completed'
// reopenProject(projectId, reason) — UPDATE status='in_progress' + INSERT project_changes
```

**4. `src/components/steps/Step10_OrderForm.tsx`**
- Pridať tlačidlo "Dokončiť projekt" (zelené, vedľa export tlačidiel)
- Po kliknutí: potvrdiť → `markProjectCompleted(project.id)` → reload savedProjects / aktualizovať badge

**5. `src/components/Dashboard.tsx`**
- `ProjectCard`: zmeniť logiku `done` — namiesto `currentStep === 10` použiť `project.status === 'completed'`
- Zelený odznak "Dokončený" (namiesto aktuálneho `Hotovo`)
- Pridať tlačidlo "Upraviť" vedľa "Pokračovať/Prehľad" pre completed projekty
- Po kliknutí "Upraviť": modálne okno s povinným textovým poľom "Dôvod úpravy" → `reopenProject()` → otvor wizard
- Zobraziť sekciu "História úprav" na karte projektu (ak existujú záznamy) — query `project_changes` per project

**6. `src/components/admin/ChangeLogPage.tsx`**
- Pridať tab "Zmeny projektov" (vedľa Všetky/Pridané/Upravené/Vymazané)
- V tomto tabe: tabuľka záznamov z `project_changes` (projekt, dátum, kto, dôvod)
- Rovnaké search pole filtruje aj tento tab

**7. `src/hooks/useProjects.ts`** (rozšírenie `useProjectSaver`)
- `useProjectSaver` a `useLoadProjects` — nezasahovať do status pri auto-save (len pri upsert nezapisovať `status` ak je `completed`)

---

### Detaily implementácie

**Status flow:**
- Nový projekt → `status = 'in_progress'` (DB default)
- Klik "Dokončiť projekt" v Kroku 10 → `UPDATE projects SET status='completed'` (priamo cez supabase client, nie cez autoSave)
- Opätovné otvorenie wizardu cez `loadProject()` → **nezmení** status (wizard neprepisuje DB status)
- Klik "Upraviť" na dashboarde → INSERT do `project_changes` + UPDATE status na `in_progress`
- `useProjectSaver` (autoSave) → upsert **nesmie** prepisovať status (pridáme podmienku: ak `status === 'completed'` v DB, autoSave zachová status)

**Riešenie autoSave vs status:**
V `useProjectSaver`, pri upsert, nebudeme posielať `status` field — DB si zachová aktuálnu hodnotu. Tým sa status neprepíše automatickým ukladaním.

**Dashboard karta:**
- Completed badge: zelený `bg-green-100 text-green-700 border-green-300`
- Tlačidlo "Upraviť": secondary button, zobrazí sa len keď `project.status === 'completed'`
- "História úprav" sekcia: `useEffect` pre každú kartu alebo lazy load pri expand (jednoduchší prístup: načítame changes pre projekt keď je karta viditeľná — alebo eagerly fetch all changes a filter by projectId)

**ChangeLogPage tab:**
- Nový `type MainTab = 'stock' | 'projects'` state
- Tab "Zmeny projektov" — volá `useAllProjectChanges()` hook
- Existujúce tabuľky Všetky/Pridané/Upravené/Vymazané ostanú pod tabom "Skladové karty"

---

### Zhrnutie súborov

| Súbor | Zmeny |
|-------|-------|
| DB migrácia | ADD status column, CREATE project_changes table + RLS |
| `src/types/index.ts` | +status v SavedProject, +ProjectChangeEntry |
| `src/hooks/useProjects.ts` | načítať status, neoprepísať pri autoSave |
| `src/hooks/useProjectChanges.ts` | nový hook (completed/reopen/load changes) |
| `src/components/steps/Step10_OrderForm.tsx` | tlačidlo "Dokončiť projekt" |
| `src/components/Dashboard.tsx` | badge, tlačidlo Upraviť, modál, história úprav |
| `src/components/admin/ChangeLogPage.tsx` | nový tab "Zmeny projektov" |
