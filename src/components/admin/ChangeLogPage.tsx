import { useState, useMemo } from 'react';
import { ClipboardList, Folder } from 'lucide-react';
import { useChangeLog } from '../../hooks/useStockDB';
import { useAllProjectChanges } from '../../hooks/useProjectChanges';
import type { ChangeLogEntry } from '../../types';

type ActionFilter = 'all' | 'create' | 'update' | 'delete';
type MainTab = 'stock' | 'projects';

const ACTION_META: Record<string, { label: string; className: string }> = {
  create: { label: 'Pridané', className: 'bg-primary/10 text-primary' },
  update: { label: 'Upravené', className: 'bg-orange/10 text-orange' },
  delete: { label: 'Vymazané', className: 'bg-destructive/10 text-destructive' },
};

export function ChangeLogPage() {
  const changelog = useChangeLog();
  const { changes: projectChanges } = useAllProjectChanges();
  const [mainTab, setMainTab] = useState<MainTab>('stock');
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

  const filteredProjectChanges = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return projectChanges;
    return projectChanges.filter(
      (c) =>
        c.quoteNumber.toLowerCase().includes(q) ||
        c.customerName.toLowerCase().includes(q) ||
        c.changedByEmail.toLowerCase().includes(q) ||
        c.reason.toLowerCase().includes(q)
    );
  }, [projectChanges, search]);

  // U5 FIX: memoize per-action counts so they reflect total (not filtered) entries
  const actionCounts = useMemo(() => ({
    create: changelog.filter((e) => e.action === 'create').length,
    update: changelog.filter((e) => e.action === 'update').length,
    delete: changelog.filter((e) => e.action === 'delete').length,
  }), [changelog]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <ClipboardList className="w-5 h-5 text-foreground" />
          <h1 className="text-xl font-bold text-foreground uppercase tracking-wide">Log zmien</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          História úprav · {changelog.length} skladových záznamov · {projectChanges.length} zmien projektov
        </p>
      </div>

      {/* Main tab switcher */}
      <div className="flex gap-1 bg-muted border border-border p-1 mb-4 w-fit" style={{ borderRadius: 'var(--radius)' }}>
        <button
          onClick={() => setMainTab('stock')}
          className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold transition-colors"
          style={{
            borderRadius: 'var(--radius)',
            backgroundColor: mainTab === 'stock' ? 'hsl(var(--card))' : 'transparent',
            color: mainTab === 'stock' ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
          }}>
          <ClipboardList className="w-3.5 h-3.5" />
          Skladové karty
          <span className="ml-0.5 opacity-50 text-xs">({changelog.length})</span>
        </button>
        <button
          onClick={() => setMainTab('projects')}
          className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold transition-colors"
          style={{
            borderRadius: 'var(--radius)',
            backgroundColor: mainTab === 'projects' ? 'hsl(var(--card))' : 'transparent',
            color: mainTab === 'projects' ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
          }}>
          <Folder className="w-3.5 h-3.5" />
          Zmeny projektov
          <span className="ml-0.5 opacity-50 text-xs">({projectChanges.length})</span>
        </button>
      </div>

      {/* Search + action filter row */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={mainTab === 'stock' ? 'Hľadať podľa kódu, názvu, používateľa…' : 'Hľadať podľa projektu, emailu, dôvodu…'}
          className="flex-1 min-w-[220px] px-3 py-2 border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
          style={{ borderRadius: 'var(--radius)' }}
        />
        {mainTab === 'stock' && (
          <div className="flex gap-1 bg-muted border border-border p-1" style={{ borderRadius: 'var(--radius)' }}>
            {(['all', 'create', 'update', 'delete'] as ActionFilter[]).map((af) => (
              <button
                key={af}
                onClick={() => setActionFilter(af)}
                className="px-3 py-1.5 text-xs font-semibold transition-colors"
                style={{
                  borderRadius: 'var(--radius)',
                  backgroundColor: actionFilter === af ? 'hsl(var(--card))' : 'transparent',
                  color: actionFilter === af ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                }}>
                {af === 'all' ? 'Všetky' : ACTION_META[af].label}
                {af !== 'all' && (
                  <span className="ml-1 opacity-50">({actionCounts[af as keyof typeof actionCounts]})</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── STOCK TAB ── */}
      {mainTab === 'stock' && (
        <>
          {changelog.length === 0 ? (
            <div className="bg-card border border-border p-16 text-center" style={{ borderRadius: 'var(--radius)' }}>
              <ClipboardList className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">Zatiaľ žiadne zmeny</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-card border border-border p-12 text-center" style={{ borderRadius: 'var(--radius)' }}>
              <p className="text-muted-foreground text-sm">Žiadne záznamy pre zvolený filter</p>
            </div>
          ) : (
            <div className="bg-card border border-border overflow-hidden shadow-sm" style={{ borderRadius: 'var(--radius)' }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted border-b border-border">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Dátum a čas</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Používateľ</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Akcia</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Kód</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Názov</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Zmena ceny</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((entry, idx) => {
                      const meta = ACTION_META[entry.action];

                      let priceCell: React.ReactNode = null;
                      if (entry.action === 'create' && entry.after?.price !== undefined) {
                        priceCell = <span className="text-primary font-mono">+{Number(entry.after.price).toFixed(3)} €</span>;
                      } else if (entry.action === 'delete' && entry.before?.price !== undefined) {
                        priceCell = <span className="text-destructive/60 font-mono line-through">{Number(entry.before.price).toFixed(3)} €</span>;
                      } else if (entry.action === 'update' && entry.before?.price !== undefined && entry.after?.price !== undefined) {
                        const diff = Number(entry.after.price) - Number(entry.before.price);
                        if (Math.abs(diff) > 0.0005) {
                          priceCell = (
                            <span className={`font-mono ${diff > 0 ? 'text-destructive' : 'text-primary'}`}>
                              {Number(entry.before.price).toFixed(3)} → {Number(entry.after.price).toFixed(3)}
                              <span className="ml-1 text-xs opacity-60">({diff > 0 ? '+' : ''}{diff.toFixed(3)})</span>
                            </span>
                          );
                        } else {
                          priceCell = <span className="text-muted-foreground/40 text-xs">bez zmeny</span>;
                        }
                      }

                      return (
                        <tr
                          key={entry.id}
                          className={`border-b border-border hover:bg-muted/50 transition-colors ${idx % 2 === 1 ? 'bg-muted/20' : ''}`}>
                          <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(entry.timestamp).toLocaleString('sk-SK', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Bratislava' })}
                          </td>
                          <td className="px-4 py-2.5 text-foreground font-medium text-xs whitespace-nowrap">{entry.userName}</td>
                          <td className="px-4 py-2.5">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${meta.className}`}>
                              {meta.label}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{entry.itemCode}</td>
                          <td className="px-4 py-2.5 text-foreground max-w-xs"><span className="line-clamp-1">{entry.itemName}</span></td>
                          <td className="px-4 py-2.5 text-right text-xs whitespace-nowrap">{priceCell}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2 bg-muted border-t border-border text-xs text-muted-foreground">
                Zobrazených {filtered.length} z {changelog.length} záznamov
              </div>
            </div>
          )}
        </>
      )}

      {/* ── PROJECTS TAB ── */}
      {mainTab === 'projects' && (
        <>
          {projectChanges.length === 0 ? (
            <div className="bg-card border border-border p-16 text-center" style={{ borderRadius: 'var(--radius)' }}>
              <Folder className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">Zatiaľ žiadne zmeny projektov</p>
            </div>
          ) : filteredProjectChanges.length === 0 ? (
            <div className="bg-card border border-border p-12 text-center" style={{ borderRadius: 'var(--radius)' }}>
              <p className="text-muted-foreground text-sm">Žiadne záznamy pre zvolený filter</p>
            </div>
          ) : (
            <div className="bg-card border border-border overflow-hidden shadow-sm" style={{ borderRadius: 'var(--radius)' }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted border-b border-border">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Projekt</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Dátum a čas</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Kto zmenil</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Dôvod úpravy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjectChanges.map((c, idx) => (
                      <tr
                        key={c.id}
                        className={`border-b border-border hover:bg-muted/50 transition-colors ${idx % 2 === 1 ? 'bg-muted/20' : ''}`}>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <span className="font-mono text-xs text-primary font-bold">{c.quoteNumber}</span>
                          {c.customerName && <span className="ml-1.5 text-xs text-muted-foreground">{c.customerName}</span>}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(c.changedAt).toLocaleString('sk-SK', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-4 py-2.5 text-foreground text-xs font-medium whitespace-nowrap">{c.changedByEmail}</td>
                        <td className="px-4 py-2.5 text-foreground text-xs max-w-xs">
                          <span className="line-clamp-2">{c.reason}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2 bg-muted border-t border-border text-xs text-muted-foreground">
                Zobrazených {filteredProjectChanges.length} z {projectChanges.length} záznamov
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
