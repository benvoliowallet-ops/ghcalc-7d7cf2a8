import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useStockMutations } from '../../hooks/useStockDB';
import { useAuthStore } from '../../store/authStore';
import type { StockItem } from '../../types';

interface Props {
  mode: 'add' | 'edit';
  item?: StockItem;
  allItems: StockItem[];
  onClose: () => void;
}

export function StockItemModal({ mode, item, allItems, onClose }: Props) {
  const { currentUser } = useAuthStore();
  const { addItem, updateItem } = useStockMutations(onClose);

  const [code, setCode] = useState(item?.code ?? '');
  const [nameSk, setNameSk] = useState(item?.nameSk ?? '');
  const [nameEn, setNameEn] = useState(item?.nameEn ?? '');
  const [unit, setUnit] = useState(item?.unit ?? 'pcs');
  const [unitSk, setUnitSk] = useState(item?.unitSk ?? 'ks');
  const [price, setPrice] = useState(item?.price?.toString() ?? '');
  const [warehouse, setWarehouse] = useState<'ATTI' | 'NORMIST'>(item?.warehouse ?? 'ATTI');
  const [bomCondition, setBomCondition] = useState(item?.bomCondition ?? '');
  const [bomQtyLogic, setBomQtyLogic] = useState(item?.bomQtyLogic ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setError('');

    const trimmedCode = code.trim();
    const priceNum = price.trim() === '' ? null : parseFloat(price);

    if (!trimmedCode) return setError('Kód je povinný');
    if (priceNum !== null && (isNaN(priceNum) || priceNum < 0)) return setError('Zadajte platnú cenu (≥ 0)');
    if (!nameSk.trim()) return setError('Slovenský názov je povinný');

    setSaving(true);

    if (mode === 'add') {
      if (allItems.some((i) => i.code === trimmedCode)) {
        setSaving(false);
        return setError('Položka s týmto kódom už existuje');
      }
      const result = await addItem({
        code: trimmedCode,
        nameSk: nameSk.trim(),
        nameEn: nameEn.trim(),
        unit: unit.trim() || 'pcs',
        unitSk: unitSk.trim() || 'ks',
        price: priceNum,
        warehouse,
        bomCondition: bomCondition.trim() || undefined,
        bomQtyLogic: bomQtyLogic.trim() || undefined,
      });
      if (!result.ok) { setSaving(false); return setError(result.error ?? 'Chyba'); }
    } else {
      const result = await updateItem(
        item!.code,
        { nameSk: nameSk.trim(), nameEn: nameEn.trim(), unit: unit.trim(), unitSk: unitSk.trim(), price: priceNum, warehouse, bomCondition: bomCondition.trim() || undefined, bomQtyLogic: bomQtyLogic.trim() || undefined },
        item!
      );
      if (!result.ok) { setSaving(false); return setError(result.error ?? 'Chyba'); }
    }

    setSaving(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg border border-border">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">
            {mode === 'add' ? '＋ Pridať položku' : 'Upraviť položku'}
          </h2>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Kód *</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={mode === 'edit'}
                required
                placeholder="ORFS214008049"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring disabled:bg-muted disabled:text-muted-foreground"
              />
              {mode === 'edit' && <p className="text-xs text-muted-foreground mt-1">Kód sa nedá zmeniť</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Sklad *</label>
              <select
                value={warehouse}
                onChange={(e) => setWarehouse(e.target.value as 'ATTI' | 'NORMIST')}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="ATTI">ATTI</option>
                <option value="NORMIST">NORMIST</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Názov (SK) *</label>
            <input value={nameSk} onChange={(e) => setNameSk(e.target.value)} required placeholder="Hydraulická hadica DN25" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Názov (EN)</label>
            <input value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="Hydraulic hose DN25" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Jednotka</label>
              <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="pcs" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Jednotka (SK)</label>
              <input value={unitSk} onChange={(e) => setUnitSk(e.target.value)} placeholder="ks" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Cena (€) — prázdne = neznáma</label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} step="0.001" min="0" placeholder="0.000" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>

          {currentUser?.role === 'admin' && (
            <>
              <div className="border-t border-border pt-4">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">BOM metadata</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">BOM podmienka <span className="font-normal">(bom_condition)</span></label>
                    <input
                      value={bomCondition}
                      onChange={(e) => setBomCondition(e.target.value)}
                      placeholder='napr. "vždy", "ak UV systém", "ak prietok ≤ 25 m³/h"'
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">BOM množstvo <span className="font-normal">(bom_qty_logic)</span></label>
                    <input
                      value={bomQtyLogic}
                      onChange={(e) => setBomQtyLogic(e.target.value)}
                      placeholder='napr. "1 ks vždy", "numNozzles na zónu", "celkové dni montáže"'
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {error && (
            <div className="px-3 py-2 bg-destructive/10 border border-destructive/30 rounded-lg text-xs text-destructive flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">Zrušiť</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold transition-colors disabled:opacity-60">
              {saving ? 'Ukladám...' : mode === 'add' ? 'Pridať položku' : 'Uložiť zmeny'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
