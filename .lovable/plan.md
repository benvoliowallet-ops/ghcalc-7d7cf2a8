## Add bom_condition + bom_qty_logic fields to StockItemModal

### What changes (2 files only)

**1. `src/components/stock/StockItemModal.tsx**`

- Add 2 new state vars: `bomCondition` (init from `item?.bomCondition ?? ''`) and `bomQtyLogic` (init from `item?.bomQtyLogic ?? ''`)
- After the price field, add a separator + two optional text inputs — visible only when `currentUser?.role === 'admin'` (they already are admin to open this modal, but the guard keeps it explicit and hides from non-admins if modal ever gets reused)
- In the `add` branch: pass `bomCondition` and `bomQtyLogic` to `addItem`
- In the `edit` branch: pass `bomCondition` and `bomQtyLogic` to `updateItem`

Fields layout:

```
[ BOM podmienka (bom_condition)  — full width ]
[ BOM množstvo (bom_qty_logic)   — full width ]
```

Both are plain `<input type="text">`, optional, with placeholder examples matching the column comments.

**2. `src/hooks/useStockDB.ts**`

- In `addItem`: add `name_en: item.nameEn`, `bom_condition: item.bomCondition ?? null`, `bom_qty_logic: item.bomQtyLogic ?? null` to the insert payload
- In `updateItem`: add `name_en: changes.nameEn`, `bom_condition: changes.bomCondition ?? null`, `bom_qty_logic: changes.bomQtyLogic ?? null` to the update payload

### What does NOT change

- No migration (columns already exist from last step)
- No type changes (StockItem already has `bomCondition?` and `bomQtyLogic?`)
- No BOM logic, no other UI files  
  
In `useStockDB.ts`, keep the existing `additional_text: item.nameEn` in both `addItem` and `updateItem` payloads — only ADD `name_en`, `bom_condition`, `bom_qty_logic` alongside it, do not replace or remove `additional_text`.