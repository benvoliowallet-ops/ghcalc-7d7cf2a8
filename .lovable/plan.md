
## Prečo to tak je — a ako to opraviť

### Dôvod súčasného stavu

Aplikácia používa tzv. **"view state" navigáciu** — namiesto URL adries sa navigácia riadi stavom React komponentu (`useState<AppView>`). Keď klikneš na "Úlohy" v sidebar, zmení sa iba JavaScript premenná `view = 'tasks'`, URL v prehliadači ostane na `/` a stránka sa nezmení. Je to technicky funkčné, ale má viacero nevýhod:

- Nelze zdieľať odkaz na konkrétnu sekciu (napr. `/tasks`)
- Refresh stránky vždy hodí na dashboard
- Nelze sa vrátiť tlačidlom "Späť" v prehliadači
- Notifikačné e-maily nemôžu obsahovať klikateľný odkaz priamo na úlohu

---

### Riešenie — migrácia na URL routing

Namiesto `setView('tasks')` bude každá sekcia mať vlastnú URL. React Router je **už nainštalovaný** v projekte (`BrowserRouter`, `Routes`, `Route` sa používajú pre `/portal/:projectId`), takže ide len o rozšírenie existujúcej konfigurácie.

**Nové URL schéma:**

```text
/                        →  Dashboard (zoznam projektov)
/tasks                   →  Úlohy
/stock                   →  Sklad
/changelog               →  Changelog
/users                   →  Správa používateľov (admin)
/projects/:id            →  Projekt (wizard, kroky 1–10)
/projects/:id/summary    →  Súhrn projektu
/portal/:projectId       →  Zákaznícky portál (existuje)
```

---

### Čo treba zmeniť

**1. `src/App.tsx`**
- Odstrániť `useState<AppView>` a `renderContent()` switch
- Každá "view" sa stane samostatnou `<Route>` komponentou
- `AppInner` zostane ako wrapper pre auth + sidebar — renderuje `<Outlet>` pre child routes
- `handleOpenProject(id)` → `navigate('/projects/' + id)`
- `handleOpenSummary(id)` → `navigate('/projects/' + id + '/summary')`

**2. `src/components/Sidebar.tsx`**
- Nahradiť `setView(target)` za `navigate('/tasks')`, `navigate('/')` atď.
- Použiť `useLocation()` namiesto `view` prop pre aktívny stav
- Odstrániť `view` a `setView` props (sidebar sa stane self-contained)

**3. `src/pages/Tasks.tsx`** a ostatné pages — žiadne zmeny, ostávajú ako sú

**4. `src/components/ProjectSummary.tsx`** — `onBack` → `navigate(-1)` alebo `navigate('/')`

**5. `AutoSaveSubscriber`** — namiesto `view === 'project'` použiť `useMatch('/projects/:id')`

**6. Notifikačný email** — po tomto refaktore bude možné pridať priamy odkaz napr. `https://ghcalc.vora.sk/tasks` do emailu.

---

### Rozsah zmien

- Primárne 2 súbory: `App.tsx` + `Sidebar.tsx`
- Menšie úpravy v `ProjectSummary.tsx` (`onBack` prop)
- Žiadne zmeny v databáze, edge functions ani UI komponentoch

Funkčnosť aplikácie ostane **identická** — len pribudnú funkčné URL adresy a bude fungovať tlačidlo Späť v prehliadači.
