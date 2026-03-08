import { useState, useMemo } from 'react';
import { useStockStore } from '../../store/stockStore';

type ActionFilter = 'all' | 'create' | 'update' | 'delete';

const ACTION_META: Record<string, { label: string; color: string; icon: string }> = {
  create: { label: 'Pridané', color: 'bg-green-50 text-green-700', icon: '＋' },
  update: { label: 'Upravené', color: 'bg-blue-50 text-blue-700', icon: '✏️' },
  delete: { label: 'Vymazané', color: 'bg-red-50 text-red-700', icon: '🗑' },
};

export function ChangeLogPage() {
  const { changelog } = useStockStore();
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<ActionFilter>('all');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return changelog.filter((entry) => {
      const matchAction = actionFilter === 'all' || entry.action === actionFilter;
      const matchSearch =
        !q ||
        entry.itemCode.toLowerCase().includes(q) ||
        entry.itemName.toLowerCase().includes(q) ||
        entry.userName.toLowerCase().includes(q);
      return matchAction && matchSearch;
    });
  }, [changelog, search, actionFilter]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800">📋 Log zmien</h1>
        <p className="text-sm text-gray-500">
          História úprav skladových kariet · {changelog.length} záznamov celkom
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Hľadať podľa kódu, názvu, používateľa..."
          className="flex-1 min-w-[220px] px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {(['all', 'create', 'update', 'delete'] as ActionFilter[]).map((af) => (
            <button
              key={af}
              onClick={() => setActionFilter(af)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                actionFilter === af
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {af === 'all' ? 'Všetky' : ACTION_META[af].label}
              {af !== 'all' && (
                <span className="ml-1 text-gray-400">
                  ({changelog.filter((e) => e.action === af).length})
                </span>
              )}
            </button>
          ))}
        </div>
        {(search || actionFilter !== 'all') && (
          <button
            onClick={() => { setSearch(''); setActionFilter('all'); }}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
          >
            ✕ Zrušiť filter
          </button>
        )}
      </div>

      {/* Table */}
      {changelog.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-gray-500 font-medium">Zatiaľ žiadne zmeny</p>
          <p className="text-gray-300 text-sm mt-1">
            Každá zmena skladovej položky (pridanie, úprava, zmazanie) sa zobrazí tu
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-sm">Žiadne záznamy pre zvolený filter</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Dátum a čas</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Používateľ</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Akcia</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Kód</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Názov</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Skupina</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600">Zmena ceny</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry, idx) => {
                  const meta = ACTION_META[entry.action];

                  let priceCell: React.ReactNode = null;
                  if (entry.action === 'create' && entry.after?.price !== undefined) {
                    priceCell = <span className="text-green-600 font-mono">+{entry.after.price.toFixed(3)} €</span>;
                  } else if (entry.action === 'delete' && entry.before?.price !== undefined) {
                    priceCell = <span className="text-red-400 font-mono line-through">{entry.before.price.toFixed(3)} €</span>;
                  } else if (entry.action === 'update' && entry.before?.price !== undefined && entry.after?.price !== undefined) {
                    const diff = entry.after.price - entry.before.price;
                    if (Math.abs(diff) > 0.0005) {
                      priceCell = (
                        <span className={`font-mono ${diff > 0 ? 'text-red-500' : 'text-green-600'}`}>
                          {entry.before.price.toFixed(3)} → {entry.after.price.toFixed(3)}
                          <span className="ml-1 text-xs">({diff > 0 ? '+' : ''}{diff.toFixed(3)})</span>
                        </span>
                      );
                    } else {
                      priceCell = <span className="text-gray-300 text-xs">bez zmeny</span>;
                    }
                  }

                  const group = entry.after?.group ?? entry.before?.group ?? '';

                  return (
                    <tr
                      key={entry.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? 'bg-gray-50/30' : ''}`}
                    >
                      <td className="px-4 py-2.5 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(entry.timestamp).toLocaleString('sk-SK', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-2.5 text-gray-700 font-medium text-xs whitespace-nowrap">{entry.userName}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${meta.color}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{entry.itemCode}</td>
                      <td className="px-4 py-2.5 text-gray-700 max-w-xs"><span className="line-clamp-1">{entry.itemName}</span></td>
                      <td className="px-4 py-2.5">
                        {group && <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">{group}</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs whitespace-nowrap">{priceCell}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
            Zobrazených {filtered.length} z {changelog.length} záznamov
          </div>
        </div>
      )}
    </div>
  );
}
