
## Monetizačná stratégia + 3 nové funkcie

### Monetizačná odpoveď

Najsilnejšia stratégia pre tvoj prípad:

```
DUAL LICENSE model (bežný v B2B softvéri)
─────────────────────────────────────────
1. IMPLEMENTAČNÝ POPLATOK (jednorazový)
   → Zákazník si "kúpi" právo používať softvér
   → Pokrýva tvoje vývojové náklady
   → Odporúčaná suma: €8 000 – €20 000
     (závisí od veľkosti zákazníka)

2. SaaS SUBSCRIPTION (mesačný/ročný)
   → Hostovanie, údržba, aktualizácie, podpora
   → Zákazník "nevlastní" infraštruktúru ani zdrojový kód
   → Odporúčaná suma: €150 – €400/mesiac
   → Fakturuj ako "Servisný poplatok – cloud hosting"

Zákazník nedovoluje ďalší predaj?
→ To je OK — predávaš MU licenciu na používanie.
  Zdrojový kód zostáva TVÔj. Ďalšiemu zákazníkovi
  predáš rovnaký softvér pod novou inštanciou.
→ Do zmluvy: "White-label licencia pre internú
  potrebu firmy XY. Softvér zostáva duševným
  vlastníctvom VORA."
```

---

### 3 funkcie na implementáciu

**1. PDF generovanie** — `@react-pdf/renderer` v prehliadači, ponuka s logom Sanfog, BOM tabuľka, výstupy bez cien pre zákazníka

**2. Zákaznícky portál** — unikátny link s auto-generovaným heslom, rovnaký dizajn ako LoginPage (navy, greenhouse SVG), zákazník vidí: základné info, zóny, BOM technický (kódy + qty, BEZ cien) — NEvidí: ceny, náklady, NORMIST detaily

**3. Komentáre k projektu** — interné poznámky tímu priamo pri projekte, autor + dátum + možnosť označiť ako vyriešené

---

### Plán implementácie

#### DB migrácia — 2 nové tabuľky

```sql
-- Zákaznícky portál
CREATE TABLE project_portals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  password_hash text NOT NULL,
  plain_password text NOT NULL, -- zobrazíme raz pri generovaní
  created_at timestamptz DEFAULT now(),
  created_by uuid NOT NULL,
  expires_at timestamptz -- optional
);

-- Komentáre
CREATE TABLE project_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  author_id uuid NOT NULL,
  author_name text NOT NULL,
  body text NOT NULL,
  resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
```

RLS: portály čítajú všetci autentikovaní (owner), komentáre len owner projektu + admin. Portál read je verejný (podľa project_id + heslo overujeme v edge funkcii).

---

#### Súbory — čo sa vytvorí / upraví

**Nové súbory:**
- `src/pages/Portal.tsx` — verejná stránka zákazníckeho portálu (route `/portal/:projectId`)
- `src/components/portal/PortalLoginForm.tsx` — formulár hesla (rovnaký dizajn ako LoginPage)
- `src/components/portal/PortalProjectView.tsx` — zobrazenie projektu bez cien
- `src/components/comments/ProjectComments.tsx` — panel komentárov
- `supabase/functions/verify-portal-password/index.ts` — edge funkcia pre overenie hesla
- `src/hooks/usePortal.ts` — hook pre generovanie / načítanie portálu
- `src/hooks/useComments.ts` — hook pre CRUD komentárov

**Upravené súbory:**
- `src/App.tsx` — pridanie route `/portal/:id`, render `<Portal />`
- `src/components/ProjectSummary.tsx` — tlačidlo "Zdieľať so zákazníkom" → generuje portál link + heslo
- `src/components/Dashboard.tsx` — indikátor ak projekt má aktívny portál
- `src/types/index.ts` — pridanie typov `ProjectPortal`, `ProjectComment`

**PDF:**
- Nainštaluje sa `@react-pdf/renderer`
- `src/components/pdf/ProjectPDF.tsx` — PDF dokument (ponuka + BOM bez cien)
- Tlačidlo v `ProjectSummary.tsx` — "Stiahnuť PDF" vedľa "Tlačiť"

---

#### Zákaznícky portál — UX flow

```
[ProjectSummary] klikne "Zdieľať so zákazníkom"
  → generuje 8-znakové heslo (náhodné)
  → uloží do project_portals (plain text zobrazený raz)
  → zobrazí modal: "Link: ghcalc.lovable.app/portal/UUID"
                   "Heslo: ABCD-1234"
  → zákazník otvorí link
  → vidí PortalLoginForm (rovnaký dizajn navy + greenhouse SVG)
  → zadá heslo → edge funkcia overí
  → PortalProjectView: info o projekte + technický BOM (qty, kódy, bez €)
```

#### Komentáre — UX

- Plávajúci panel v `ProjectSummary` aj počas wizard krokov (tlačidlo v headeri)
- Zoznam komentárov s avatarmi (initials), dátumom, možnosť označiť `resolved`
- Badge s počtom nerozriešených komentárov

---

### Technické poznámky

- Heslo portálu: ukladáme ako plain text (nie kritická bezpečnosť — interný B2B nástroj), ale overenie prebieha cez edge funkciu (nie priamo z klienta)
- PDF bez `window.print()` — skutočný stiahnuteľný PDF súbor
- Portál je **public route** — nevyžaduje Supabase session zákazníka
- Komentáre: realtime subscription (supabase_realtime) pre live updates
