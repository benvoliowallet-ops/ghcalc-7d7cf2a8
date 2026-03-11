import { useState, useMemo } from 'react';
import { Pencil, Trash2, Package, Plus, ChevronUp, ChevronDown, ChevronsUpDown, X } from 'lucide-react';
import { useStockItems, useStockMutations } from '../../hooks/useStockDB';
import { useAuthStore } from '../../store/authStore';
import { useConfirm } from '../../hooks/useConfirm';
import { StockItemModal } from './StockItemModal';
import type { StockItem } from '../../types';

export function StockPage() {
  const { currentUser } = useAuthStore();
  const { items, loading, reload } = useStockItems();
  const { deleteItem } = useStockMutations(reload);
  const confirm = useConfirm();

  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState<'all' | 'ATTI' | 'NORMIST'>('all');
  const [editItem, setEditItem] = useState<StockItem | null>(null);
  const [addNew, setAddNew] = useState(false);
  const [sortBy, setSortBy] = useState<'code' | 'nameSk' | 'warehouse' | 'price'>('nameSk');
  const [sortAsc, setSortAsc] = useState(true);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let result = items.filter((item) => {
      const matchWarehouse = warehouseFilter === 'all' || item.warehouse === warehouseFilter;
      const matchSearch =
        !q ||
        item.code.toLowerCase().includes(q) ||
        item.nameSk.toLowerCase().includes(q) ||
        item.nameEn.toLowerCase().includes(q) ||
        item.warehouse.toLowerCase().includes(q);
      return matchWarehouse && matchSearch;
    });
    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'price') cmp = (a.price ?? 0) - (b.price ?? 0);
      else cmp = (a[sortBy] ?? '').localeCompare(b[sortBy] ?? '');
      return sortAsc ? cmp : -cmp;
    });
    return result;
  }, [items, search, warehouseFilter, sortBy, sortAsc]);

  const handleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortAsc(!sortAsc);
    else { setSortBy(col); setSortAsc(true); }
  };

  const handleDelete = async (code: string, item: StockItem) => {
    if (!currentUser) return;
    const ok = await confirm({
      title: `Vymazať položku „${item.nameSk}"?`,
      description: 'Táto akcia je nevratná.',
      confirmLabel: 'Vymazať',
      variant: 'destructive',
    });
    if (ok) await deleteItem(code, item);
  };

  const SortIcon = ({ col }: { col: typeof sortBy }) =>
    sortBy === col ? (
      sortAsc ? <ChevronUp className="w-3 h-3 ml-1 text-teal inline" /> : <ChevronDown className="w-3 h-3 ml-1 text-teal inline" />
    ) : (
      <ChevronsUpDown className="w-3 h-3 ml-1 text-border inline" />
    );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-foreground" />
            <h1 className="text-xl font-bold text-foreground uppercase tracking-wide">Skladové karty</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {items.length} položiek · zobrazených {filtered.length}
            {loading && <span className="ml-2 text-muted-foreground/50">· načítavam...</span>}
          </p>
        </div>
        <button
          onClick={() => setAddNew(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold transition-colors shadow-sm"
          style={{ borderRadius: 'var(--radius)' }}
        >
          <Plus className="w-4 h-4" /> Pridať položku
        </button>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Hľadať podľa kódu, názvu..."
          className="flex-1 min-w-[220px] px-3 py-2 border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
          style={{ borderRadius: 'var(--radius)' }}
        />
        <select
          value={warehouseFilter}
          onChange={(e) => setWarehouseFilter(e.target.value as typeof warehouseFilter)}
          className="px-3 py-2 border border-border bg-card text-foreground text-sm"
          style={{ borderRadius: 'var(--radius)' }}
        >
          <option value="all">Všetky sklady ({items.length})</option>
          <option value="ATTI">ATTI ({items.filter(i => i.warehouse === 'ATTI').length})</option>
          <option value="NORMIST">NORMIST ({items.filter(i => i.warehouse === 'NORMIST').length})</option>
        </select>
        {(search || warehouseFilter !== 'all') && (
          <button onClick={() => { setSearch(''); setWarehouseFilter('all'); }} className="flex items-center gap-1.5 px-3 py-2 border border-border text-sm text-muted-foreground hover:bg-muted transition-colors" style={{ borderRadius: 'var(--radius)' }}>
            <X className="w-3.5 h-3.5" /> Zrušiť filter
          </button>
        )}
      </div>

      <div className="bg-card border border-border overflow-hidden shadow-sm" style={{ borderRadius: 'var(--radius)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground cursor-pointer select-none hover:text-foreground" onClick={() => handleSort('code')}>Kód <SortIcon col="code" /></th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground cursor-pointer select-none hover:text-foreground" onClick={() => handleSort('nameSk')}>Názov (SK) <SortIcon col="nameSk" /></th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">Názov (EN)</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground cursor-pointer select-none hover:text-foreground" onClick={() => handleSort('warehouse')}>Sklad <SortIcon col="warehouse" /></th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground cursor-pointer select-none hover:text-foreground" onClick={() => handleSort('price')}>Cena € <SortIcon col="price" /></th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground w-20">Akcie</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, idx) => (
                <tr key={item.code} className={`border-b border-border hover:bg-primary/5 transition-colors ${idx % 2 === 1 ? 'bg-muted/40' : ''}`}>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground whitespace-nowrap">{item.code}</td>
                  <td className="px-4 py-2.5 text-foreground font-medium max-w-xs"><span className="line-clamp-2">{item.nameSk}</span></td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs hidden lg:table-cell max-w-xs"><span className="line-clamp-1">{item.nameEn}</span></td>
                  <td className="px-4 py-2.5">
                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium whitespace-nowrap">{item.warehouse}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-semibold text-foreground whitespace-nowrap">
                    {item.price != null ? item.price.toFixed(3) : '—'}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setEditItem(item)} className="p-1.5 hover:bg-primary/10 text-primary/60 hover:text-primary transition-colors" style={{ borderRadius: 'var(--radius)' }} title="Upraviť">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(item.code, item)} className="p-1.5 hover:bg-destructive/10 text-destructive/40 hover:text-destructive transition-colors" style={{ borderRadius: 'var(--radius)' }} title="Vymazať">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-16 text-center"><p className="text-muted-foreground text-sm">Žiadne položky nenájdené</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-4 py-2 bg-muted border-t border-border text-xs text-muted-foreground flex items-center justify-between">
            <span>Zobrazených {filtered.length} z {items.length} položiek</span>
            <span>Celková hodnota: <span className="font-semibold text-foreground">{filtered.reduce((s, i) => s + (i.price ?? 0), 0).toFixed(2)} €</span></span>
          </div>
        )}
      </div>

      {addNew && <StockItemModal mode="add" allItems={items} onClose={() => { setAddNew(false); reload(); }} />}
      {editItem && <StockItemModal mode="edit" item={editItem} allItems={items} onClose={() => { setEditItem(null); reload(); }} />}
    </div>
  );
}
