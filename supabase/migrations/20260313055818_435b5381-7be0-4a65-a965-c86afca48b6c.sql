ALTER TABLE stock_items
  ADD COLUMN IF NOT EXISTS name_en TEXT,
  ADD COLUMN IF NOT EXISTS bom_condition TEXT,
  ADD COLUMN IF NOT EXISTS bom_qty_logic TEXT;

COMMENT ON COLUMN stock_items.name_en IS 'English name of the item (shown in UI when EN toggle is active)';
COMMENT ON COLUMN stock_items.bom_condition IS 'Human-readable condition for when this item is included in BOM (e.g. "always", "if UV system", "if flow <= 25 m3/h")';
COMMENT ON COLUMN stock_items.bom_qty_logic IS 'Human-readable quantity logic (e.g. "1 pc always", "numNozzles per zone", "total install days")';