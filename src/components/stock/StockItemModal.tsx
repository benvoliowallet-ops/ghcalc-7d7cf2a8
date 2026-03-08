import { useState } from 'react';
import { useStockMutations } from '../../hooks/useStockDB';
import { useAuthStore } from '../../store/authStore';
import type { StockItem } from '../../types';

interface Props {
  mode: 'add' | 'edit';
  item?: StockItem;
  groups: string[];
  allItems: StockItem[];
  onClose: () => void;
}

export function StockItemModal({ mode, item, groups, allItems, onClose }: Props) {
  const { currentUser } = useAuthStore();

  // NC1 FIX: pass onClose as the reload callback so parent list refreshes after mutation
  const { addItem, updateItem } = useStockMutations(onClose);

  const [code, setCode] = useState(item?.code ?? '');
  const [name, setName] = useState(item?.name ?? '');
  const [additionalText, setAdditionalText] = useState(item?.additionalText ?? '');
  const [price, setPrice] = useState(item?.price?.toString() ?? '');
  const [group, setGroup] = useState(item?.group ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setError('');

    const trimmedCode = code.trim();
    const priceNum = parseFloat(price);

    if (!trimmedCode) return setError('Kód je povinný');
    if (isNaN(priceNum) || priceNum < 0) return setError('Zadajte platnú cenu (≥ 0)');
    if (!name.trim()) return setError('Názov je povinný');
    if (!group.trim()) return setError('Skupina je povinná');

    setSaving(true);

    if (mode === 'add') {
      if (allItems.some((i) => i.code === trimmedCode)) {
        setSaving(false);
        return setError('Položka s týmto kódom už existuje');
      }
      const result = await addItem({
        code: trimmedCode,
        name: name.trim(),
        additionalText: additionalText.trim(),
        price: priceNum,
        group: group.trim(),
      });
      if (!result.ok) { setSaving(false); return setError(result.error ?? 'Chyba'); }
    } else {
      const result = await updateItem(
        item!.code,
        { name: name.trim(), additionalText: additionalText.trim(), price: priceNum, group: group.trim() },
        item!
      );
      if (!result.ok) { setSaving(false); return setError(result.error ?? 'Chyba'); }
    }

    setSaving(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg border border-border">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">
            {mode === 'add' ? '＋ Pridať položku' : '✏️ Upraviť položku'}
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
                placeholder="NOR 0311018"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring disabled:bg-muted disabled:text-muted-foreground"
              />
              {mode === 'edit' && <p className="text-xs text-muted-foreground mt-1">Kód sa nedá zmeniť</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Skupina *</label>
              <input
                list="modal-groups-list"
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                required
                placeholder="napr. Trysky"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <datalist id="modal-groups-list">
                {groups.map((g) => <option key={g} value={g} />)}
              </datalist>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Názov *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Rura D10x1.5-3000 AK" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Doplnkový text</label>
            <input value={additionalText} onChange={(e) => setAdditionalText(e.target.value)} placeholder="Voliteľný popis" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Cena (€) *</label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required step="0.001" min="0" placeholder="0.000" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>

          {error && (
            <div className="px-3 py-2 bg-destructive/10 border border-destructive/30 rounded-lg text-xs text-destructive">⚠️ {error}</div>
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
