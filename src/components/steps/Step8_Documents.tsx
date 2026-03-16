import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { useProjectStore } from '../../store/projectStore';
import { StepLayout } from '../ui/StepLayout';
import { Card, Button, PrintIcon, DownloadIcon } from '../ui/FormField';
import { PUMP_TABLE, selectMaxivarem, getTransportCost, getPMCost, fmtN, fmtE, NOZZLE_BY_ORIFICE, detectConcurrentPipes } from '../../utils/calculations';
import { STOCK_ITEMS } from '../../data/stockItems';
import { buildBomLines } from '../../utils/buildBom';
import { exportToOberon, prepareBomForOberon } from '../../utils/exportOberon';

export function Step8_Documents() {
  const { project, globalParams, zones, zoneCalcs, normistPrice, costInputs, uvSystemCode, ssFilter30, uvSystemNazli, cad, ropeOverrides, preOrderState } = useProjectStore();
  const isNormist = (code: string) => {
    if (code.startsWith('NORMIST_PUMP_')) return true;
    return !!STOCK_ITEMS.find(s => s.code === code && s.warehouse === 'NORMIST');
  };
  const bomRef = useRef<HTMLDivElement>(null);
  const orderRef = useRef<HTMLDivElement>(null);

  const totalFlowMlH = zoneCalcs.reduce((sum, c) => sum + (c?.zoneFlow ?? 0), 0);
  const totalFlowM1H = totalFlowMlH / 1e6;
  const etnaCapacity = totalFlowM1H;
  const maxivaremInfo = selectMaxivarem(totalFlowM1H, globalParams.osmoticWater);
  const transpCost = getTransportCost(project.country);
  const pmCost = getPMCost(costInputs.projectArea);
  const osmoticSS = globalParams.osmoticWater;
  const N = globalParams.numberOfZones;
  const { bracketBOM } = detectConcurrentPipes(cad);
  const cadHasPipes = cad.segments.some(s => s.lineType === 'pipe');

  const bomLines = buildBomLines({
    project, globalParams, zones, zoneCalcs, normistPrice,
    costInputs, uvSystemCode: uvSystemCode ?? null, ssFilter30, uvSystemNazli, cad, ropeOverrides,
  });

  const processedBomLines = bomLines.map((l) => isNormist(l.code) && l.code !== 'NORMIST' ? { ...l, price: 0 } : l);
  const bomTotal = processedBomLines.reduce((s, l) => s + l.qty * l.price, 0);
  const normistLines = processedBomLines.filter((l) => l.code.startsWith('NORMIST_PUMP_') || STOCK_ITEMS.find(s => s.code === l.code)?.warehouse === 'NORMIST');
  const attiLines = processedBomLines.filter((l) => !l.code.startsWith('NORMIST_PUMP_') && STOCK_ITEMS.find(s => s.code === l.code)?.warehouse !== 'NORMIST');

  const aggregatedNazliLines = (() => {
    const m = new Map<string, { code: string; name: string; qty: number; unit: string }>();
    processedBomLines.filter((l) => isNormist(l.code) && l.code !== 'NORMIST').forEach((nl) => {
      const ex = m.get(nl.code);
      const nameEn = STOCK_ITEMS.find(s => s.code === nl.code)?.nameEn ?? nl.name;
      ex ? (ex.qty += nl.qty) : m.set(nl.code, { code: nl.code, name: nameEn, qty: nl.qty, unit: nl.unit });
    });
    const lines = Array.from(m.values());
    if (uvSystemNazli) lines.push({ code: 'UV_SYSTEM', name: 'UV System', qty: 1, unit: 'ks' });
    return lines;
  })();

  // Aggregated ATTI lines -- sum quantities by code across all zones
  const aggregatedAttiLines = (() => {
    const m = new Map();
    attiLines.forEach(l => {
      const ex = m.get(l.code);
      ex ? (ex.qty += l.qty) : m.set(l.code, { code: l.code, name: l.name, qty: l.qty, unit: l.unit, price: l.price });
    });
    return Array.from(m.values());
  })();

  const totalRopeRaw = ropeOverrides.reduce((s, v) => s + (v || 0), 0);
  const ropeCeiled = Math.ceil(totalRopeRaw / 500) * 500;
  const ropeSpools = ropeCeiled / 500;

  const printBOM = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html><head><title>BOM – ${project.quoteNumber}</title><style>body{font-family:Arial;font-size:11px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:4px 6px}th{background:#f3f4f6}h2{font-size:14px;margin-top:16px}tfoot td{font-weight:bold}.rope-note{background:#f0fdf4;border-left:3px solid #16a34a;padding:6px 10px;margin:8px 0;font-size:11px}</style></head><body>`);
    w.document.write(`<h1>BOM – Objednávka pre Attiho</h1><p>Ponuka: ${project.quoteNumber} | Zákazník: ${project.customerName}</p>`);
    const aggTotal = aggregatedAttiLines.reduce((s, l) => s + l.qty * l.price, 0);
    w.document.write('<table><thead><tr><th>#</th><th>Kód</th><th>Popis</th><th>Qty</th><th>MJ</th><th>Cena/MJ</th><th>Celkom</th></tr></thead><tbody>');
    aggregatedAttiLines.forEach((l, i) => w.document.write('<tr><td>' + (i+1) + '</td><td>' + l.code + '</td><td>' + l.name + '</td><td>' + fmtN(l.qty, 1) + '</td><td>' + l.unit + '</td><td>' + fmtE(l.price) + '</td><td>' + fmtE(l.qty * l.price) + '</td></tr>'));
    w.document.write('</tbody><tfoot><tr><td colspan="6">SPOLU</td><td>' + fmtE(aggTotal) + '</td></tr></tfoot></table>');
    w.document.write(`<div class="rope-note"><strong>Lano celkom (zaokrúhlené nahor na 500 m):</strong> ${fmtN(ropeCeiled, 0)} m = ${ropeSpools} × cievka 500 m</div>`);
    w.document.write(`<h2>TOTAL: ${fmtE(attiLines.reduce((s, l) => s + l.qty * l.price, 0))}</h2></body></html>`);
    w.document.close(); w.print();
  };

  const printOrderNazli = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html><head><title>Order NAZLI – ${project.quoteNumber}</title><style>body{font-family:Arial;font-size:11px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:4px 6px}th{background:#1e3a5f;color:#fff}</style></head><body>`);
    w.document.write(`<h1>ORDER FORM – NOR ELEKTRONIK, Istanbul</h1><table style="margin-bottom:12px"><tr><td><b>SHIPPER:</b> Sanfog s.r.o.</td><td><b>CUSTOMER:</b> NOR ELEKTRONIK</td></tr><tr><td><b>DATE:</b> ${project.quoteDate}</td><td><b>REF:</b> ${project.quoteNumber}</td></tr></table>`);
    w.document.write('<table><thead><tr><th>#</th><th>CODE</th><th>DESCRIPTION</th><th>QTY</th><th>UNIT</th></tr></thead><tbody>');
    aggregatedNazliLines.forEach((nl, i) => w.document.write(`<tr><td>${i + 1}</td><td>${nl.code.startsWith('NORMIST_PUMP_') ? '' : nl.code}</td><td>${nl.name}</td><td>${fmtN(nl.qty, 1)}</td><td>${nl.unit}</td></tr>`));
    w.document.write('</tbody></table></body></html>'); w.document.close(); w.print();
  };

  const exportNazliXLSX = () => {
    const rows = aggregatedNazliLines.map((nl, i) => ({ '#': i + 1, CODE: nl.code, DESCRIPTION: nl.name, QTY: nl.qty, UNIT: nl.unit }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Order NAZLI');
    XLSX.writeFile(wb, `OrderNAZLI_${project.quoteNumber}.xlsx`);
  };

  const exportAttiBOMXLSX = () => {
    const rows = aggregatedAttiLines.map((l, i) => ({
      '#': i + 1,
      Kod: l.code,
      Popis: l.name,
      Qty: l.qty,
      MJ: l.unit,
      'Cena/MJ': l.price,
      Celkom: +(l.qty * l.price).toFixed(2),
    }));
    rows.push({
      '#': rows.length + 1,
      Sekcia: 'Lano',
      Kod: 'INFO',
      Popis: `Lano zaokruhlene nahor na 500 m: ${fmtN(ropeCeiled, 0)} m = ${ropeSpools} x cievka 500 m`,
      Qty: ropeCeiled,
      MJ: 'm',
      'Cena/MJ': 0,
      Celkom: 0,
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'BOM Atti');
    XLSX.writeFile(wb, `BOM_Atti_${project.quoteNumber}.xlsx`);
  };

  const [oberonExporting, setOberonExporting] = useState(false);
  const exportAttiOberon = () => {
    try {
      exportToOberon(
        prepareBomForOberon(attiLines.map((l) => ({ code: l.code, name: l.name, qty: l.qty }))),
        project.quoteNumber
      );
    } catch (e) {
      alert(String(e));
    }
  }

  return (

    <StepLayout stepNum={8} title="Generovanie výstupných dokumentov" subtitle="8A – Order Form pre NAZLI  ·  8B – BOM pre Attiho (OBERON)" canContinue={true}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card variant="info" title="8A — Order Form pre NAZLI (NORMIST)">
          <p className="text-sm text-muted-foreground mb-4">Proforma faktúra pre NOR ELEKTRONIK Istanbul ({aggregatedNazliLines.length} kódov).</p>
          <div className="flex gap-2 flex-wrap">
            <Button variant="primary" onClick={printOrderNazli}><PrintIcon /> Tlačiť – Order Form NAZLI</Button>
            <Button variant="secondary" onClick={exportNazliXLSX}><DownloadIcon /> Export XLSX</Button>
          </div>
        </Card>
        <Card title="8B — BOM pre Attiho (OBERON)">
          <p className="text-xs text-amber-800 bg-amber-50 border-l-2 border-amber-400 p-2 pl-3 rounded-r mb-3">Interný dokument – obsahuje položky bez NORMIST ({attiLines.length} riadkov)</p>
          <div className="flex gap-2 flex-wrap">
            <Button variant="primary" onClick={printBOM}><PrintIcon /> Tlačiť – BOM pre Attiho</Button>
            <Button variant="secondary" onClick={exportAttiBOMXLSX}><DownloadIcon /> Export XLSX</Button>
            <Button variant="secondary" onClick={exportAttiOberon} disabled={oberonExporting}>
              <DownloadIcon /> {oberonExporting ? 'Exportujem…' : 'Export do Oberon'}
            </Button>
          </div>
        </Card>

      </div>

      {!cadHasPipes && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 border-l-4 border-l-amber-400 rounded-r-lg text-sm text-amber-800">
          <strong>Držiaky neboli vypočítané</strong> – CAD výkres (krok 3G) neobsahuje žiadne potrubia.
        </div>
      )}

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-foreground">Náhľad BOM</h3>
          <div className="text-sm text-muted-foreground flex gap-4">
            <span>Riadkov: <strong>{processedBomLines.length}</strong></span>
            <span className="text-primary">NORMIST: <strong>{normistLines.length}</strong></span>
            <span className="text-teal">Atti: <strong>{attiLines.length}</strong></span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted text-muted-foreground">
                <th className="text-left p-3 w-1/4">Sekcia</th>
                <th className="text-left p-3">Kód</th>
                <th className="text-left p-3">Popis</th>
                <th className="text-right p-3">Qty</th>
                <th className="text-right p-3">MJ</th>
                <th className="text-right p-3">Cena/MJ</th>
                <th className="text-right p-3">Celkom</th>
                <th className="text-center p-3">Dodávateľ</th>
              </tr>
            </thead>
            <tbody>
              {processedBomLines.map((line, i) => {
                const isNazliRef = isNormist(line.code) && line.code !== 'NORMIST';
                return (
                  <tr key={i} className={`border-t border-border ${i % 2 === 0 ? '' : 'bg-muted/30'}`}>
                    <td className="p-2 text-muted-foreground/60 text-xs">{line.section}</td>
                    <td className="p-2 font-mono text-xs text-primary">{line.code}</td>
                    <td className="p-2 text-foreground">{line.name}</td>
                    <td className="p-2 text-right font-mono">{fmtN(line.qty, 1)}</td>
                    <td className="p-2 text-right text-muted-foreground">{line.unit}</td>
                    <td className="p-2 text-right text-muted-foreground">{isNazliRef ? '—' : `${fmtN(line.price, 2)} €`}</td>
                    <td className="p-2 text-right font-semibold text-muted-foreground">{isNazliRef ? '—' : `${fmtN(line.qty * line.price, 2)} €`}</td>
                    <td className="p-2 text-center">
                      {isNormist(line.code)
                        ? <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold">NORMIST</span>
                        : <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded">Atti</span>
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-teal/10 border-t-2 border-teal/30">
                <td colSpan={7} className="p-3 font-bold text-foreground text-sm">TOTAL NÁKLADY</td>
                <td className="p-3 text-right font-bold text-teal text-base">{fmtE(bomTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </StepLayout>
  );
}
