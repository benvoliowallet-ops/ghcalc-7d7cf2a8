import * as XLSX from 'xlsx';
import { useProjectStore } from '../store/projectStore';
import { PUMP_TABLE, calcETNACapacity, fmtN, fmtE } from '../utils/calculations';

interface ProjectSummaryProps {
  onOpenWizard: () => void;
  onBack: () => void;
}

export function ProjectSummary({ onOpenWizard, onBack }: ProjectSummaryProps) {
  const {
    project, globalParams, zones, zoneCalcs, normistPrice,
    costInputs, ropeOverrides
  } = useProjectStore();

  const totalArea = zoneCalcs.reduce((s, c) => s + (c?.area ?? 0), 0);
  const totalFlowMlH = zoneCalcs.reduce((s, c) => s + (c?.zoneFlow ?? 0), 0);
  const etnaCapacity = calcETNACapacity(totalFlowMlH);
  const totalNozzles = zoneCalcs.reduce((s, c) => s + (c?.numNozzles ?? 0), 0);

  // rough cost estimate (normistPrice + 350 balné)
  const roughCost = normistPrice + 350 +
    (costInputs.installTechDays * costInputs.installTechCount +
     costInputs.installGreenhouseDays * costInputs.installGreenhouseCount +
     costInputs.commissioningDays * costInputs.commissioningCount) * 100;

  const handleExportXLSX = () => {
    const rows = zones.map((z, i) => {
      const c = zoneCalcs[i];
      const flowLpm = (c?.zoneFlow ?? 0) / 1000 / 60;
      const pump = PUMP_TABLE.find(p => p.maxFlow >= flowLpm);
      return {
        'Zóna': z.name,
        'Plocha m²': c?.area ?? 0,
        'Prietok ml/h': c?.zoneFlow ?? 0,
        'Trysky ks': c?.numNozzles ?? 0,
        'Čerpadlo': pump?.name ?? '—',
        'Lano (obj.) m': ropeOverrides[i] ?? c?.ropeLength ?? 0,
        'Odpad m': c?.ropeWaste ?? 0,
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Prehľad projektu');
    XLSX.writeFile(wb, `Summary_${project.quoteNumber}.xlsx`);
  };

  const handlePrint = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    const ropeTotal = ropeOverrides.length
      ? ropeOverrides.reduce((s, v) => s + v, 0)
      : zoneCalcs.reduce((s, c) => s + (c?.ropeLength ?? 0), 0);

    const zoneRows = zones.map((z, i) => {
      const c = zoneCalcs[i];
      const flowLpm = (c?.zoneFlow ?? 0) / 1000 / 60;
      const pump = PUMP_TABLE.find(p => p.maxFlow >= flowLpm);
      return `<tr>
        <td>${z.name}</td>
        <td>${fmtN(c?.area ?? 0, 1)}</td>
        <td>${fmtN(c?.zoneFlow ?? 0, 0)}</td>
        <td>${c?.numNozzles ?? 0}</td>
        <td>${pump?.name ?? '—'}</td>
        <td>${fmtN(ropeOverrides[i] ?? c?.ropeLength ?? 0, 0)}</td>
        <td>${fmtN(c?.ropeWaste ?? 0, 0)}</td>
      </tr>`;
    }).join('');

    w.document.write(`<html><head><title>Prehľad – ${project.quoteNumber}</title>
    <style>
      body{font-family:Arial;font-size:11px;color:#1a1a2e}
      h1{font-size:16px;color:#1e3a5f} h2{font-size:13px;color:#1e3a5f;margin-top:20px}
      table{width:100%;border-collapse:collapse;margin-top:8px}
      th,td{border:1px solid #ddd;padding:5px 8px;text-align:left}
      th{background:#1e3a5f;color:#fff}
      .totals{display:flex;gap:24px;margin:12px 0}
      .kpi{border:1px solid #ddd;padding:8px 14px;border-radius:4px;text-align:center}
      .kpi-val{font-size:18px;font-weight:bold;color:#00adc6}
      .kpi-lbl{font-size:10px;color:#666}
    </style></head><body>
    <h1>PREHĽAD PROJEKTU – ${project.quoteNumber}</h1>
    <table style="width:auto;margin-bottom:12px"><tr>
      <td><b>Zákazník:</b> ${project.customerName || '—'}</td>
      <td style="padding-left:24px"><b>Adresa:</b> ${project.projectAddress || '—'}</td>
      <td style="padding-left:24px"><b>Dátum:</b> ${project.quoteDate}</td>
      <td style="padding-left:24px"><b>Krajina:</b> ${project.country}</td>
    </tr></table>
    <div class="totals">
      <div class="kpi"><div class="kpi-val">${fmtN(totalArea, 1)} m²</div><div class="kpi-lbl">Celková plocha</div></div>
      <div class="kpi"><div class="kpi-val">${fmtN(totalFlowMlH, 0)} ml/h</div><div class="kpi-lbl">Celkový prietok</div></div>
      <div class="kpi"><div class="kpi-val">${fmtN(etnaCapacity, 2)} m³/h</div><div class="kpi-lbl">ETNA kapacita</div></div>
      <div class="kpi"><div class="kpi-val">${totalNozzles}</div><div class="kpi-lbl">Trysky celkom</div></div>
      <div class="kpi"><div class="kpi-val">${fmtN(ropeTotal, 0)} m</div><div class="kpi-lbl">Lano objednávka</div></div>
    </div>
    <h2>Zóny</h2>
    <table><thead><tr>
      <th>Zóna</th><th>Plocha m²</th><th>Prietok ml/h</th><th>Trysky ks</th>
      <th>Čerpadlo</th><th>Lano obj. m</th><th>Odpad m</th>
    </tr></thead><tbody>${zoneRows}</tbody></table>
    </body></html>`);
    w.document.close(); w.print();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        ← Späť na projekty
      </button>

      {/* Header */}
      <div
        className="bg-navy text-white rounded-t-lg px-6 py-5 flex items-start justify-between"
        style={{ borderRadius: 'var(--radius) var(--radius) 0 0' }}
      >
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="font-mono text-lg font-bold text-teal">{project.quoteNumber}</span>
            <span className="text-xs bg-teal/20 text-teal border border-teal/40 px-2 py-0.5 rounded font-semibold uppercase tracking-wide">
              Hotovo ✓
            </span>
          </div>
          <h1 className="text-xl font-bold text-white">
            {project.customerName || 'Bez zákazníka'}
          </h1>
          {project.projectAddress && (
            <p className="text-sm text-white/60 mt-0.5">📍 {project.projectAddress}</p>
          )}
          <p className="text-xs text-white/40 mt-1">{project.quoteDate} · {project.country}</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded transition-colors"
            style={{ borderRadius: 'var(--radius)' }}
          >
            🖨 Tlačiť
          </button>
          <button
            onClick={handleExportXLSX}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded transition-colors"
            style={{ borderRadius: 'var(--radius)' }}
          >
            📥 Export XLSX
          </button>
          <button
            onClick={onOpenWizard}
            className="flex items-center gap-1.5 px-3 py-2 bg-teal hover:bg-teal/90 text-white text-sm font-semibold rounded transition-colors"
            style={{ borderRadius: 'var(--radius)' }}
          >
            ✏️ Otvoriť wizard
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 border border-t-0 border-border bg-card divide-x divide-border"
        style={{ borderRadius: '0 0 var(--radius) var(--radius)' }}>
        {[
          { val: `${fmtN(totalArea, 1)} m²`, lbl: 'Celková plocha' },
          { val: `${fmtN(totalFlowMlH, 0)} ml/h`, lbl: 'Prietok' },
          { val: `${fmtN(etnaCapacity, 2)} m³/h`, lbl: 'ETNA kapacita' },
          { val: `${totalNozzles} ks`, lbl: 'Trysky celkom' },
          { val: `${globalParams.numberOfZones}`, lbl: 'Počet zón' },
        ].map(({ val, lbl }) => (
          <div key={lbl} className="px-4 py-4 text-center">
            <div className="text-lg font-bold text-teal">{val}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{lbl}</div>
          </div>
        ))}
      </div>

      {/* Zone table */}
      <div
        className="mt-6 bg-card border border-border overflow-hidden"
        style={{ borderRadius: 'var(--radius)' }}
      >
        <div className="px-4 py-3 border-b border-border">
          <h2 className="font-bold text-foreground uppercase tracking-wide text-sm">Zóny</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted text-muted-foreground text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-2">Zóna</th>
                <th className="text-right px-4 py-2">Plocha m²</th>
                <th className="text-right px-4 py-2">Prietok ml/h</th>
                <th className="text-right px-4 py-2">Trysky ks</th>
                <th className="text-left px-4 py-2">Čerpadlo</th>
                <th className="text-right px-4 py-2">Lano obj.</th>
                <th className="text-right px-4 py-2">Odpad</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((zone, i) => {
                const calc = zoneCalcs[i];
                const flowLpm = (calc?.zoneFlow ?? 0) / 1000 / 60;
                const pump = PUMP_TABLE.find(p => p.maxFlow >= flowLpm);
                const ropeFinal = ropeOverrides[i] ?? calc?.ropeLength ?? 0;
                return (
                  <tr key={i} className="border-t border-border hover:bg-muted/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-foreground">{zone.name}</td>
                    <td className="px-4 py-3 text-right font-mono">{fmtN(calc?.area ?? 0, 1)}</td>
                    <td className="px-4 py-3 text-right font-mono">{fmtN(calc?.zoneFlow ?? 0, 0)}</td>
                    <td className="px-4 py-3 text-right font-mono">{calc?.numNozzles ?? 0}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{pump?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-right font-mono text-teal font-semibold">{fmtN(ropeFinal, 0)} m</td>
                    <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                      {fmtN((calc?.ropeWaste ?? 0) + (ropeFinal - (calc?.ropeLength ?? 0)), 0)} m
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border bg-muted/60">
                <td className="px-4 py-3 font-bold text-foreground">SPOLU</td>
                <td className="px-4 py-3 text-right font-bold font-mono">{fmtN(totalArea, 1)}</td>
                <td className="px-4 py-3 text-right font-bold font-mono">{fmtN(totalFlowMlH, 0)}</td>
                <td className="px-4 py-3 text-right font-bold font-mono">{totalNozzles}</td>
                <td />
                <td className="px-4 py-3 text-right font-bold font-mono text-teal">
                  {fmtN(ropeOverrides.reduce((s, v) => s + v, 0) || zoneCalcs.reduce((s, c) => s + (c?.ropeLength ?? 0), 0), 0)} m
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Cost info */}
      {normistPrice > 0 && (
        <div
          className="mt-4 bg-card border border-border px-4 py-4 flex flex-wrap gap-6"
          style={{ borderRadius: 'var(--radius)' }}
        >
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">NORMIST cena</p>
            <p className="text-lg font-bold text-teal">{fmtE(normistPrice)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Odhad nákladov</p>
            <p className="text-lg font-bold text-foreground">{fmtE(roughCost)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">ETNA kapacita</p>
            <p className="text-lg font-bold text-foreground">{fmtN(etnaCapacity, 2)} m³/h</p>
          </div>
        </div>
      )}
    </div>
  );
}
