import * as XLSX from 'xlsx';
import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { useAuthStore } from '../../store/authStore';
import { StepLayout } from '../ui/StepLayout';
import { Card, Button, PrintIcon, DownloadIcon } from '../ui/FormField';
import { fmtN, fmtE } from '../../utils/calculations';
import { exportToOberon, prepareBomForOberon } from '../../utils/exportOberon';
import { markProjectCompleted } from '../../hooks/useProjectChanges';
import { buildBomLines } from '../../utils/buildBom';
import { STOCK_ITEMS } from '../../data/stockItems';

export function Step10_OrderForm() {
  const { project, globalParams, zones, zoneCalcs, normistPrice, costInputs, uvSystemCode, ssFilter30, uvSystemNazli, cad, ropeOverrides, savedProjects, setSavedProjects } = useProjectStore();
  const { currentUser } = useAuthStore();
  const [completingProject, setCompletingProject] = useState(false);
  const [completedSuccess, setCompletedSuccess] = useState(false);

  const isProjectCompleted = savedProjects.find(p => p.id === project.id)?.status === 'completed';

  const handleCompleteProject = async () => {
    if (!project.id) return;
    setCompletingProject(true);
    const { error } = await markProjectCompleted(project.id);
    setCompletingProject(false);
    if (!error) {
      setSavedProjects(
        savedProjects.map((p) =>
          p.id === project.id ? { ...p, status: 'completed' as const } : p
        )
      );
      setCompletedSuccess(true);
      setTimeout(() => setCompletedSuccess(false), 4000);
    }
  };

  // Build BOM from shared utility (same source as Step8 & ProjectSummary)
  const bomLines = buildBomLines({
    project, globalParams, zones, zoneCalcs, normistPrice,
    costInputs, uvSystemCode: uvSystemCode ?? null, ssFilter30, uvSystemNazli, cad, ropeOverrides,
  });

  // Transform BomLine → OrderLine (suppress price for NORMIST lines)
  type OrderLine = { code: string; name: string; qty: number; unit: string; priceUnit: number; total: number; isNormistRef: boolean };
  const processedLines: OrderLine[] = bomLines.map(l => {
    const isNormistRef = l.code === 'NORMIST' || l.code.startsWith('NORMIST_PUMP_') || (() => { const r = LEGACY_CODE_MAP[l.code] ?? l.code; return !!STOCK_ITEMS.find(s => s.code === r && s.warehouse === 'NORMIST'); })();
    const priceUnit = isNormistRef ? 0 : l.price;
    return { code: l.code, name: l.name, qty: l.qty, unit: l.unit, priceUnit, total: l.qty * priceUnit, isNormistRef };
  });

  const grandTotal = processedLines.reduce((s, l) => s + l.total, 0);

  const totalRopeRaw = ropeOverrides.reduce((s, v) => s + (v || 0), 0);
  const ropeCeiled = Math.ceil(totalRopeRaw / 500) * 500;
  const ropeSpools = ropeCeiled / 500;

  const printOrder = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html><head><title>Objednávka – ${project.quoteNumber}</title><style>body{font-family:Arial;font-size:11px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:5px 8px}th{background:#14532d;color:#fff}tfoot td{font-weight:bold}.rope-note{background:#f0fdf4;border-left:3px solid #16a34a;padding:6px 10px;margin:8px 0;font-size:11px}</style></head><body>`);
    w.document.write(`<h1>OBJEDNÁVKOVÝ FORMULÁR PRE ATTIHO</h1><p>Ponuka: ${project.quoteNumber} | ${project.customerName}</p>`);
    w.document.write('<table><thead><tr><th>#</th><th>Kód</th><th>Popis</th><th>Počet</th><th>MJ</th><th>Cena/MJ €</th><th>Celkom €</th></tr></thead><tbody>');
    processedLines.forEach((l, i) => {
      w.document.write(`<tr><td>${i + 1}</td><td>${l.code}</td><td>${l.name}</td><td>${fmtN(l.qty, 1)}</td><td>${l.unit}</td><td>${l.isNormistRef ? '—' : fmtN(l.priceUnit, 2)}</td><td>${l.isNormistRef ? '—' : fmtN(l.total, 2)}</td></tr>`);
    });
    w.document.write(`</tbody><tfoot><tr><td colspan="6">TOTAL</td><td>${fmtN(grandTotal, 2)} €</td></tr></tfoot></table>`);
    w.document.write(`<div class="rope-note"><strong>Lano celkom (zaokrúhlené nahor na 500 m):</strong> ${fmtN(ropeCeiled, 0)} m = ${ropeSpools} × cievka 500 m</div>`);
    w.document.write(`</body></html>`);
    w.document.close(); w.print();
  };

  const exportOrderXLSX = () => {
    const rows = processedLines.map((l, i) => ({
      '#': i + 1, Kód: l.code, Popis: l.name, Qty: l.qty, MJ: l.unit,
      'Cena/MJ': l.isNormistRef ? '—' : l.priceUnit,
      Celkom: l.isNormistRef ? '—' : l.total,
    }));
    rows.push({ '#': rows.length + 1, Kód: 'INFO', Popis: `Lano zaokrúhlené nahor na 500 m: ${fmtN(ropeCeiled, 0)} m = ${ropeSpools} × cievka 500 m`, Qty: ropeCeiled, MJ: 'm', 'Cena/MJ': '—', Celkom: '—' });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Objednávka');
    XLSX.writeFile(wb, `Order_${project.quoteNumber}.xlsx`);
  };

  const [oberonExporting, setOberonExporting] = useState(false);
  const exportOrderOberon = async () => {
    setOberonExporting(true);
    try {
  const attiLines = processedLines.filter(l => !l.isNormistRef);
      await exportToOberon(prepareBomForOberon(attiLines.map(l => ({ code: l.code, name: l.name, qty: l.qty }))), project.quoteNumber);
    } catch (e) { alert(String(e)); } finally { setOberonExporting(false); }
  };

  if (processedLines.length === 0) {
    return (
      <StepLayout stepNum={10} title="Objednávkový formulár pre Attiho (OBERON)" subtitle="Finálna objednávka." hideNav={true}>
        <div className="text-center py-24 bg-card border border-dashed border-border rounded-2xl">
          <p className="text-xl font-semibold text-foreground mb-2">Žiadne položky</p>
          <p className="text-muted-foreground">Najprv nakonfigurujte zóny v krokoch 2–9.</p>
        </div>
      </StepLayout>
    );
  }

  return (
    <StepLayout stepNum={10} title="Objednávkový formulár pre Attiho (OBERON)" subtitle="Finálna objednávka. Každá položka obsahuje Kód OBERON · Počet · MJ · Cena." hideNav={true}>
      <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-muted-foreground">Ponuka: <strong>{project.quoteNumber}</strong> · {project.customerName}</p>
        <div className="flex gap-2 flex-wrap">
          <Button variant="secondary" size="lg" onClick={exportOrderXLSX}><DownloadIcon /> Export XLSX</Button>
          <Button variant="secondary" size="lg" onClick={exportOrderOberon} disabled={oberonExporting}><DownloadIcon /> {oberonExporting ? 'Exportujem…' : 'Export do Oberon'}</Button>
          <Button variant="primary" size="lg" onClick={printOrder}><PrintIcon /> Tlačiť</Button>
          {isProjectCompleted ? (
            <span
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold border"
              style={{
                borderRadius: 'var(--radius)',
                backgroundColor: 'hsl(var(--success) / 0.12)',
                color: 'hsl(var(--success))',
                borderColor: 'hsl(var(--success) / 0.35)',
              }}>
              <CheckCircle2 className="w-4 h-4" /> Projekt dokončený
            </span>
          ) : (
            <button
              onClick={handleCompleteProject}
              disabled={completingProject}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold border transition-colors disabled:opacity-50"
              style={{
                borderRadius: 'var(--radius)',
                backgroundColor: completedSuccess ? 'hsl(var(--success) / 0.12)' : 'hsl(var(--success))',
                color: completedSuccess ? 'hsl(var(--success))' : 'white',
                borderColor: 'hsl(var(--success) / 0.6)',
              }}>
              <CheckCircle2 className="w-4 h-4" />
              {completingProject ? 'Ukladám…' : completedSuccess ? '✓ Dokončené' : 'Dokončiť projekt'}
            </button>
          )}
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-teal/30 bg-teal/10 flex items-center justify-between">
          <h3 className="font-bold text-foreground">Objednávkový formulár</h3>
          <div className="text-teal font-bold text-lg">{fmtE(grandTotal)}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-navy text-white">
                <th className="text-left p-3">#</th>
                <th className="text-left p-3">Kód OBERON</th>
                <th className="text-left p-3">Popis</th>
                <th className="text-right p-3">Počet</th>
                <th className="text-right p-3">MJ</th>
                <th className="text-right p-3">Cena/MJ</th>
                <th className="text-right p-3">Celkom</th>
              </tr>
            </thead>
            <tbody>
              {processedLines.map((line, i) => (
                <tr key={i} className={`border-t border-border ${i % 2 === 0 ? '' : 'bg-muted/30'}`}>
                  <td className="p-2 text-muted-foreground">{i + 1}</td>
                  <td className="p-2 font-mono text-primary">{line.code}</td>
                  <td className="p-2 text-foreground">{line.name}</td>
                  <td className="p-2 text-right font-mono">{fmtN(line.qty, 1)}</td>
                  <td className="p-2 text-right text-muted-foreground">{line.unit}</td>
                  <td className="p-2 text-right">{line.isNormistRef ? <span className="text-muted-foreground">—</span> : <>{fmtN(line.priceUnit, 2)} €</>}</td>
                  <td className="p-2 text-right font-semibold text-teal">{line.isNormistRef ? <span className="text-muted-foreground">—</span> : <>{fmtN(line.total, 2)} €</>}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-teal/10 border-t-2 border-teal/30">
                <td colSpan={6} className="p-4 font-bold text-foreground">TOTAL NÁKLADY</td>
                <td className="p-4 text-right font-bold text-teal text-base">{fmtE(grandTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </StepLayout>
  );
}
