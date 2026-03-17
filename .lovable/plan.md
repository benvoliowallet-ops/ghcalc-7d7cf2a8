
## Problém: Časová zóna v aplikácii

### Čo sa deje

Databáza ukladá časy v UTC (ISO string napr. `2025-03-17T14:30:00Z`). Aplikácia zobrazuje časy pomocou `format(new Date(...))` z `date-fns` alebo `toLocaleDateString/toLocaleString` — tieto funkcie **používajú lokálnu časovú zónu prehliadača/servera**. 

Problem: **Deno edge function** beží na serveroch Supabase kde lokálna TZ je UTC, nie CET/CEST. Preto `formatDeadline` a `formatDateTime` v emailoch zobrazujú čas v UTC (napr. 13:00 namiesto 14:00 v lete).

**React frontend**: `format(new Date(...))` používa TZ prehliadača — ak user má prehliadač nastavený na `Europe/Bratislava`, funguje správne. Ale je lepšie to urobiť explicitne a spoľahlivo.

### Rozsah zmien

**1. Edge function** (`send-task-notification/index.ts`) — KRITICKÉ
- `formatDeadline()` a `formatDateTime()` — pridať `timeZone: 'Europe/Bratislava'` do `toLocaleDateString/toLocaleTimeString`
- `formatDateTime(new Date().toISOString())` pri "Čas dokončenia" — rovnako

**2. Frontend** (`src/components/tasks/TaskDetailModal.tsx`) — OPRAVIŤ
- Nainštalovať `date-fns-tz` (package `date-fns-tz` je kompatibilný s existujúcim `date-fns@3`)
- `format(new Date(c.created_at), 'dd.MM. HH:mm')` → `formatInTimeZone(new Date(c.created_at), 'Europe/Bratislava', 'dd.MM. HH:mm')`
- Všetky `format(new Date(activeTask.deadline/created_at/completed_at), ...)` → `formatInTimeZone`

**3. Frontend** (`src/components/tasks/TaskRow.tsx`) — OPRAVIŤ
- `format(deadlineDate, 'dd.MM.yyyy')` → `formatInTimeZone(deadlineDate, 'Europe/Bratislava', 'dd.MM.yyyy')`
- `isOverdue` v `useTasks.ts` — porovnáva `new Date(task.deadline) < new Date()` — toto je správne (UTC porovnanie), nie treba meniť

**4. Frontend ostatné** (`Dashboard.tsx`, `ChangeLogPage.tsx`, `PortalProjectView.tsx`) — OPRAVIŤ
- Použiť `{ timeZone: 'Europe/Bratislava' }` v `toLocaleDateString/toLocaleString` volaniach — je to jednoduchý parameter navyše

**5. `NewTaskModal` / `TaskDetailModal` deadline input** — OPRAVIŤ
- `datetime-local` input zobrazuje lokálnu TZ prehliadača
- Keď user zadá deadline, `new Date(e.target.value).toISOString()` správne konvertuje na UTC — **toto je správne**, nemenime

### Plán implementácie

**Krok 1:** Pridať `date-fns-tz` do `package.json` (kompatibilné s `date-fns@3`)

**Krok 2:** Vytvoriť helper súbor `src/lib/dateUtils.ts` s funkciou `formatSK(date, formatStr)` — wrapper okolo `formatInTimeZone` s pevnou TZ `Europe/Bratislava`. Centralizovaný prístup — ak sa TZ zmení, mení sa na jednom mieste.

**Krok 3:** Upraviť `TaskDetailModal.tsx` a `TaskRow.tsx` — nahradiť `format(new Date(...), ...)` za `formatSK(...)` 

**Krok 4:** Upraviť `Dashboard.tsx` a `ChangeLogPage.tsx` — pridať `timeZone: 'Europe/Bratislava'` do existujúcich `toLocaleString` volaní (bez importu date-fns-tz, len natívny JS parameter)

**Krok 5:** Upraviť edge function `send-task-notification/index.ts` — pridať `timeZone: 'Europe/Bratislava'` do `formatDeadline()` a `formatDateTime()`. Táto zmena je kritická pre email notifikácie.

### Prečo `Europe/Bratislava` nie `Europe/Prague`

Obe sú CET/CEST a identické pre DST pravidlá. `Europe/Bratislava` je správne IANA meno pre Slovensko. DST sa prepína automaticky podľa IANA TZ databázy (posledná nedeľa marca / posledná nedeľa októbra) — žiadna manuálna logika nie je potrebná.

### Súbory na zmenu
- `package.json` — pridať `date-fns-tz`
- `src/lib/dateUtils.ts` — nový helper
- `src/components/tasks/TaskRow.tsx`
- `src/components/tasks/TaskDetailModal.tsx`
- `src/components/Dashboard.tsx`
- `src/components/admin/ChangeLogPage.tsx`
- `supabase/functions/send-task-notification/index.ts`
