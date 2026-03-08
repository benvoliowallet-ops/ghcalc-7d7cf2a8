import { useState, useEffect, useMemo } from 'react';
import { useStockStore } from '../../store/stockStore';
import { useAuthStore } from '../../store/authStore';
import { StockItemModal } from './StockItemModal';
import type { StockItem } from '../../types';

export function StockPage() {
  const { items, ensureInit, deleteItem } = useStockStore();
  const { currentUser } = useAuthStore();

  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');
  const [editItem, setEditItem] = useState<StockItem | null>(null);
  const [addNew, setAddNew] = useState(false);
  const [sortBy, setSortBy] = useState<'code' | 'name' | 'group' | 'price'>('group');
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    ensureInit();
  }, [ensureInit]);

  const groups = useMemo(() => {
    return Array.from(new Set(items.map((i) => i.group))).sort();
  }, [items]);

  const filtered = useMemo(() => {
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
  }, [items, search, groupFilter, sortBy, sortAsc]);

  const handleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortAsc(!sortAsc);
    else { setSortBy(col); setSortAsc(true); }
  };

  const handleDelete = (code: string, name: string) => {
    if (!currentUser) return;
    if (window.confirm(`Vymazať položku „${name}"?\nTáto akcia je nevratná.`)) {
      deleteItem(code, currentUser.id, currentUser.name);
    }
  };

  const SortIcon = ({ col }: { col: typeof sortBy }) =>
    sortBy === col ? (
      <span className="ml-1 text-green-600">{sortAsc ? '↑' : '↓'}</span>
    ) : (
      <span className="ml-1 text-gray-300">↕</span>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">

      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">📦 Skladové karty</h1>
          <p className="text-sm text-gray-500">
            {items.length} položiek · zobrazených {filtered.length}
          </p>
        </div>
        <button
          onClick={() => setAddNew(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors shadow-sm"
        >
          ＋ Pridať položku
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Hľadať podľa kódu, názvu, skupiny..."
          className="flex-1 min-w-[220px] px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <select
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="all">Všetky skupiny ({items.length})</option>
          {groups.map((g) => {
            const count = items.filter((i) => i.group === g).length;
            return (
              <option key={g} value={g}>
                {g} ({count})
              </option>
            );
          })}
        </select>
        {(search || groupFilter !== 'all') && (
          <button
            onClick={() => { setSearch(''); setGroupFilter('all'); }}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
          >
            ✕ Zrušiť filter
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th
                  className="text-left px-4 py-3 text-xs font-semibold text-gray-600 cursor-pointer select-none hover:text-gray-800"
                  onClick={() => handleSort('code')}
                >
                  Kód <SortIcon col="code" />
                </th>
                <th
                  className="text-left px-4 py-3 text-xs font-semibold text-gray-600 cursor-pointer select-none hover:text-gray-800"
                  onClick={() => handleSort('name')}
                >
                  Názov <SortIcon col="name" />
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 hidden lg:table-cell">
                  Doplnkový text
                </th>
                <th
                  className="text-left px-4 py-3 text-xs font-semibold text-gray-600 cursor-pointer select-none hover:text-gray-800"
                  onClick={() => handleSort('group')}
                >
                  Skupina <SortIcon col="group" />
                </th>
                <th
                  className="text-right px-4 py-3 text-xs font-semibold text-gray-600 cursor-pointer select-none hover:text-gray-800"
                  onClick={() => handleSort('price')}
                >
                  Cena € <SortIcon col="price" />
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 w-20">
                  Akcie
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, idx) => (
                <tr
                  key={item.code}
                  className={`border-b border-gray-100 hover:bg-green-50/40 transition-colors ${
                    idx % 2 === 1 ? 'bg-gray-50/40' : ''
                  }`}
                >
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-500 whitespace-nowrap">
                    {item.code}
                  </td>
                  <td className="px-4 py-2.5 text-gray-800 font-medium max-w-xs">
                    <span className="line-clamp-2">{item.name}</span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-400 text-xs hidden lg:table-cell max-w-xs">
                    <span className="line-clamp-1">{item.additionalText}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-medium whitespace-nowrap">
                      {item.group}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-semibold text-gray-700 whitespace-nowrap">
                    {item.price.toFixed(3)}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setEditItem(item)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-400 hover:text-blue-600 transition-colors"
                        title="Upraviť"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(item.code, item.name)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-300 hover:text-red-500 transition-colors"
                        title="Vymazať"
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <p className="text-gray-400 text-sm">Žiadne položky nenájdené</p>
                    {(search || groupFilter !== 'all') && (
                      <p className="text-gray-300 text-xs mt-1">
                        Skúste zmeniť filter alebo hľadaný výraz
                      </p>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer row */}
        {filtered.length > 0 && (
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-400 flex items-center justify-between">
            <span>
              Zobrazených {filtered.length} z {items.length} položiek
            </span>
            <span>
              Celková hodnota:{' '}
              <span className="font-semibold text-gray-600">
                {filtered.reduce((s, i) => s + i.price, 0).toFixed(2)} €
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Modals */}
      {addNew && (
        <StockItemModal
          mode="add"
          groups={groups}
          onClose={() => setAddNew(false)}
        />
      )}
      {editItem && (
        <StockItemModal
          mode="edit"
          item={editItem}
          groups={groups}
          onClose={() => setEditItem(null)}
        />
      )}
    </div>
  );
}
