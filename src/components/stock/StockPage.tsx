import { useState, useMemo } from 'react';
import { Pencil, Trash2, Package } from 'lucide-react';
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
  const [groupFilter, setGroupFilter] = useState('all');
  const [editItem, setEditItem] = useState<StockItem | null>(null);
  const [addNew, setAddNew] = useState(false);
  const [sortBy, setSortBy] = useState<'code' | 'name' | 'group' | 'price'>('group');
  const [sortAsc, setSortAsc] = useState(true);

  const groups = Array.from(new Set(items.map((i) => i.group))).sort();

  const filtered = (() => {
    const q = search.toLowerCase();
    let result = items.filter((item) => {
      const matchGroup = groupFilter === 'all' || item.group === groupFilter;
      const matchSearch =
        !q ||
        item.code.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.additionalText.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q);
      return matchGroup && matchSearch;
    });
    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'price') cmp = a.price - b.price;
      else cmp = (a[sortBy] ?? '').localeCompare(b[sortBy] ?? '');
      return sortAsc ? cmp : -cmp;
    });
    return result;
  })();

  const handleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortAsc(!sortAsc);
    else { setSortBy(col); setSortAsc(true); }
  };

  const handleDelete = async (code: string, item: StockItem) => {
    if (!currentUser) return;
    const ok = await confirm({
      title: `Vymazať položku „${item.name}"?`,
      description: 'Táto akcia je nevratná.',
      confirmLabel: 'Vymazať',
      variant: 'destructive',
    });
    if (ok) await deleteItem(code, item);
  };

  const SortIcon = ({ col }: { col: typeof sortBy }) =>
    sortBy === col ? (
      <span className="ml-1 text-teal">{sortAsc ? '↑' : '↓'}</span>
    ) : (
      <span className="ml-1 text-border">↕</span>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground uppercase tracking-wide">📦 Skladové karty</h1>
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
          ＋ Pridať položku
        </button>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Hľadať podľa kódu, názvu, skupiny..."
          className="flex-1 min-w-[220px] px-3 py-2 border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
          style={{ borderRadius: 'var(--radius)' }}
        />
        <select
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
          className="px-3 py-2 border border-border bg-card text-foreground text-sm"
          style={{ borderRadius: 'var(--radius)' }}
        >
          <option value="all">Všetky skupiny ({items.length})</option>
          {groups.map((g) => (
            <option key={g} value={g}>{g} ({items.filter((i) => i.group === g).length})</option>
          ))}
        </select>
        {(search || groupFilter !== 'all') && (
          <button onClick={() => { setSearch(''); setGroupFilter('all'); }} className="px-3 py-2 border border-border text-sm text-muted-foreground hover:bg-muted transition-colors" style={{ borderRadius: 'var(--radius)' }}>
            ✕ Zrušiť filter
          </button>
        )}
      </div>

      <div className="bg-card border border-border overflow-hidden shadow-sm" style={{ borderRadius: 'var(--radius)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground cursor-pointer select-none hover:text-foreground" onClick={() => handleSort('code')}>Kód <SortIcon col="code" /></th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground cursor-pointer select-none hover:text-foreground" onClick={() => handleSort('name')}>Názov <SortIcon col="name" /></th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">Doplnkový text</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground cursor-pointer select-none hover:text-foreground" onClick={() => handleSort('group')}>Skupina <SortIcon col="group" /></th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground cursor-pointer select-none hover:text-foreground" onClick={() => handleSort('price')}>Cena € <SortIcon col="price" /></th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground w-20">Akcie</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, idx) => (
                <tr key={item.code} className={`border-b border-border hover:bg-primary/5 transition-colors ${idx % 2 === 1 ? 'bg-muted/40' : ''}`}>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground whitespace-nowrap">{item.code}</td>
                  <td className="px-4 py-2.5 text-foreground font-medium max-w-xs"><span className="line-clamp-2">{item.name}</span></td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs hidden lg:table-cell max-w-xs"><span className="line-clamp-1">{item.additionalText}</span></td>
                  <td className="px-4 py-2.5">
                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium whitespace-nowrap">{item.group}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-semibold text-foreground whitespace-nowrap">{item.price.toFixed(3)}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setEditItem(item)} className="p-1.5 hover:bg-primary/10 text-primary/60 hover:text-primary transition-colors" style={{ borderRadius: 'var(--radius)' }} title="Upraviť">✏️</button>
                      <button onClick={() => handleDelete(item.code, item)} className="p-1.5 hover:bg-destructive/10 text-destructive/40 hover:text-destructive transition-colors" style={{ borderRadius: 'var(--radius)' }} title="Vymazať">🗑</button>
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
            <span>Celková hodnota: <span className="font-semibold text-foreground">{filtered.reduce((s, i) => s + i.price, 0).toFixed(2)} €</span></span>
          </div>
        )}
      </div>

      {addNew && <StockItemModal mode="add" groups={groups} allItems={items} onClose={() => { setAddNew(false); reload(); }} />}
      {editItem && <StockItemModal mode="edit" item={editItem} groups={groups} allItems={items} onClose={() => { setEditItem(null); reload(); }} />}
    </div>
  );
}
