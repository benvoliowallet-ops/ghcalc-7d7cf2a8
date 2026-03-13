
## Schema + Type Extension: 3 nové stĺpce v stock_items

### Čo sa mení (4 súbory)

**1. `supabase/migrations/20260313000000_add_stock_items_bom_columns.sql`** — NOVÝ
```sql
ALTER TABLE stock_items
  ADD COLUMN IF NOT EXISTS name_en TEXT,
  ADD COLUMN IF NOT EXISTS bom_condition TEXT,
  ADD COLUMN IF NOT EXISTS bom_qty_logic TEXT;

COMMENT ON COLUMN stock_items.name_en IS '...';
COMMENT ON COLUMN stock_items.bom_condition IS '...';
COMMENT ON COLUMN stock_items.bom_qty_logic IS '...';
```

**2. `src/integrations/supabase/types.ts`** — pridať do `stock_items` Row / Insert / Update:
```ts
name_en: string | null
bom_condition: string | null
bom_qty_logic: string | null
```

**3. `src/data/stockItems.ts`** — rozšíriť `StockItem` interface:
```ts
bomCondition?: string
bomQtyLogic?: string
```
(Poznámka: `nameEn` už existuje v interface, takže sa nepridáva znova.)

**4. `src/hooks/useStockDB.ts`** — 3 zmeny:
- Select string: `'code, name, name_en, additional_text, price, group, supplier, bom_condition, bom_qty_logic'`
- Mapping v hlavnom load: `nameEn: row.name_en ?? row.additional_text ?? ''`, + `bomCondition`, `bomQtyLogic`
- Rovnaká zmena v "Reload after sync" bloku (riadky 60–76)

### Čo sa NEMENÍ
- Žiadne UI zmeny
- Žiadne BOM logika zmeny
- Všetky existujúce riadky budú mať NULL v nových stĺpcoch — správne
