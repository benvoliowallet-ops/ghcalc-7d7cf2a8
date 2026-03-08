
## Full visual audit — findings & plan

### The core problem
There are **two completely different design languages** living in the same app:

1. **App shell** (header, footer, step layouts, dashboard) — uses Sanfog brand tokens: `navy`, `teal`, `orange`, `bg-card`, `text-foreground`. Clean, consistent.
2. **Inner pages** (StockPage, UsersPage, ChangeLogPage, FormField components, step cards) — use raw Tailwind `gray-*`, `green-*`, `blue-*`, `white`, `rounded-xl`, `rounded-lg`. Generic "Bootstrap gray" look with no brand identity.

This is the biggest issue. A customer opening the Sklad tab sees a completely different UI style.

### Issue list by area

**1. Footer — sticky bottom (explicit ask)**
- `App.tsx`: `<main>{renderContent()}</main>` + `<footer>` is just stacked — footer floats wherever the content ends
- Fix: wrap in `min-h-screen flex flex-col`, make `<main>` flex-grow

**2. Inner pages — color mismatch**
- `StockPage`, `UsersPage`, `ChangeLogPage`: white cards (`bg-white`, `rounded-xl`), `text-gray-800`, `border-gray-200`, green focus rings — these are completely off-brand
- Fix: replace with brand tokens — `bg-card`, `border-border`, `text-foreground`, `text-muted-foreground`, `focus:ring-teal` (or `ring-primary`), brand-radius

**3. FormField.tsx — the foundation of all steps**
- `Input`, `Select`, `Card`, `Button`, `Toggle` — all use hardcoded gray/green colors
- `Button` variant `primary` is `bg-green-700` — but the brand primary is teal (`#00adc6`)
- `Card` uses `bg-white border-gray-200 rounded-lg` — off-brand
- Fix: align to brand tokens throughout

**4. Step cards — visual inconsistency**
- Steps 1–10 use `<Card>` from FormField which renders in white/gray
- The StepLayout header is navy + teal — looks great
- But the card content below it is generic white boxes
- Fix: Card component already has the shape — just needs brand colors

**5. Navigation active state uses `bg-teal text-white`**
- This is actually correct and good — keep it

**6. Dashboard**
- Uses `bg-card border-border` — already consistent ✓
- Progress bar color is `hsl(var(--teal))` twice (including done state) — fine
- `text-teal` on quote number — correct brand token use ✓

**7. Tabs in UsersPage / ChangeLogPage**
- `bg-gray-100 rounded-xl p-1` pill tabs — look generic
- Should use navy/border style matching the rest of the shell

**8. Input focus color**
- `focus:ring-green-500` everywhere in FormField — should be `focus:ring-teal` or use CSS var
- Same in StockPage and ChangeLogPage filters

**9. Typography inconsistency**
- Inner pages use `text-xl font-bold text-gray-800` for H1
- Dashboard uses `text-2xl font-bold text-foreground uppercase tracking-wide`
- StepLayout uses `text-sm font-bold text-white tracking-widest uppercase`
- Should standardize page H1 style

**10. Modals / badges**
- Role badges in UsersPage: `bg-purple-50 text-purple-700`, `bg-blue-50 text-blue-700` — completely off-brand
- Stock group badge: `bg-green-50 text-green-700` — off-brand
- Fix: use brand-adjacent neutral colors or teal/orange

---

### Files to change

1. **`src/App.tsx`** — fix footer sticky: `div.min-h-screen.flex.flex-col`, `main.flex-grow`
2. **`src/components/ui/FormField.tsx`** — rebrand `Input`, `Select`, `Card`, `Button`, `Toggle`, `Badge`, `CalcRow` to brand tokens
3. **`src/components/stock/StockPage.tsx`** — replace gray/green classes with brand tokens
4. **`src/components/admin/UsersPage.tsx`** — replace gray/green classes with brand tokens, fix tabs
5. **`src/components/admin/ChangeLogPage.tsx`** — replace gray/green classes with brand tokens

### What stays the same
- Login page (already redesigned, looks great)
- App header (navy, teal, good)
- StepLayout header (navy, good)
- Dashboard cards (already on brand tokens)
- All business logic — zero logic changes

### CSS token reference
- White card bg → `bg-card` (white)
- Borders → `border-border` (light gray)
- Page bg → `bg-background` (light gray)
- Body text → `text-foreground` (navy)
- Secondary text → `text-muted-foreground`
- Accent/active → `text-teal` / `bg-teal`
- Focus → `focus:ring-teal`
- Brand radius → `style={{ borderRadius: 'var(--radius)' }}` or `rounded` (4px)
- Navy bg → `bg-secondary` or `bg-navy`

### Visual result
Before: Shell = Sanfog navy brand, inner pages = generic Bootstrap gray  
After: Entire app = one coherent brand language — navy header, light-gray page bg, white cards with brand radius, teal accents, orange for important actions
