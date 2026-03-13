import * as XLSX from 'xlsx';
import { useState, useCallback, useEffect } from 'react';
import { MapPin, Printer, Download, Pencil, Check, Share2, FileText, Loader2, Copy, X, RefreshCw, Plus, CheckSquare } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { useProjectStore } from '../store/projectStore';
import { PUMP_TABLE, calcETNACapacity, selectMaxivarem, fmtN, fmtE, NOZZLE_BY_ORIFICE, detectConcurrentPipes, getTransportCost, getPMCost } from '../utils/calculations';
import { getPipe10mmForSpacing, getStockPrice } from '../data/stockItems';
import { buildBomLines } from '../utils/buildBom';
import { useNormistChecker } from '../hooks/useSupabaseItems';
import { usePortal } from '../hooks/usePortal';
import { ProjectPDF } from './pdf/ProjectPDF';
import { InlineProjectComments } from './comments/ProjectComments';
import { useTasks, useAllTasks, useTaskMutations, Task } from '../hooks/useTasks';
import { TaskRow } from './tasks/TaskRow';
import { TaskDetailModal } from './tasks/TaskDetailModal';
import { NewTaskModal } from './tasks/NewTaskModal';
import { isOverdue } from '../hooks/useTasks';
import { exportToOberon, prepareBomForOberon } from '../utils/exportOberon';

interface ProjectSummaryProps {
  onOpenWizard: () => void;
  onBack: () => void;
}

export function ProjectSummary({ onOpenWizard, onBack }: ProjectSummaryProps) {
  const {
    project, globalParams, zones, zoneCalcs, normistPrice,
    costInputs, ropeOverrides, uvSystemCode, ssFilter30, uvSystemNazli, cad, preOrderState,
    openProjectId,
  } = useProjectStore();
  const { isNormist } = useNormistChecker();

  const { portal, loading: portalLoading, loadPortal, createPortal, revokePortal } = usePortal(openProjectId ?? null);
  const [shareModal, setShareModal] = useState<{ link: string; password: string } | null>(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => { if (openProjectId) loadPortal(); }, [openProjectId, loadPortal]);

  const totalArea = zoneCalcs.reduce((s, c) => s + (c?.area ?? 0), 0);
  const totalFlowMlH = zoneCalcs.reduce((s, c) => s + (c?.zoneFlow ?? 0), 0);
  const etnaCapacity = totalFlowMlH / 1e6;
  const totalNozzles = zoneCalcs.reduce((s, c) => s + (c?.numNozzles ?? 0), 0);

  const roughCost = normistPrice + getStockPrice('SNFG.00001') +
    (costInputs.installTechDays * costInputs.installTechCount +
     costInputs.installGreenhouseDays * costInputs.installGreenhouseCount +
     costInputs.commissioningDays * costInputs.commissioningCount) * 100;

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
  const attiLines = processedBomLines.filter((l) => !isNormist(l.code));

  const aggregatedNazliLines = (() => {
    const m = new Map<string, { code: string; name: string; qty: number; unit: string }>();
    processedBomLines.filter((l) => isNormist(l.code) && l.code !== 'NORMIST').forEach((nl) => {
      const ex = m.get(nl.code);
      ex ? (ex.qty += nl.qty) : m.set(nl.code, { code: nl.code, name: nl.name, qty: nl.qty, unit: nl.unit });
    });
    const lines = Array.from(m.values());
    if (uvSystemNazli) lines.push({ code: 'UV_SYSTEM', name: 'UV System', qty: 1, unit: 'ks' });
    return lines;
  })();

  // ── Document actions ──────────────────────────────────────────────────────
  const handleDownloadPDF = useCallback(async () => {
    setPdfGenerating(true);
    try {
      const snapshot = {
        currentStep: 10,
        project, globalParams, zones, zoneCalcs, normistPrice,
        costInputs, ropeOverrides, uvSystemCode: uvSystemCode ?? null, ssFilter30, uvSystemNazli, cad, preOrderState,
        pumpSelection: null, etnaConfig: {}, activeZoneIndex: 0,
      };
      const blob = await pdf(
        <ProjectPDF
          snapshot={snapshot}
          quoteNumber={project.quoteNumber}
          customerName={project.customerName}
          projectAddress={project.projectAddress}
          country={project.country}
          contactPerson={project.contactPerson}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Ponuka_${project.quoteNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setPdfGenerating(false);
    }
  }, [project, globalParams, zones, zoneCalcs, normistPrice, costInputs, ropeOverrides, uvSystemCode, ssFilter30, uvSystemNazli, cad, preOrderState]);

  const handleShare = useCallback(async () => {
    const result = await createPortal();
    if (!result) return;
    const baseUrl = window.location.origin;
    setShareModal({
      link: `${baseUrl}/portal/${openProjectId}`,
      password: result.plain_password,
    });
  }, [createPortal, openProjectId]);

  const handleCopyLink = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

  const printOrderNazli = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html><head><title>Order NAZLI – ${project.quoteNumber}</title><style>body{font-family:Arial;font-size:11px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:4px 6px}th{background:#1e3a5f;color:#fff}</style></head><body>`);
    w.document.write(`<h1>ORDER FORM – NOR ELEKTRONIK, Istanbul</h1><table style="margin-bottom:12px"><tr><td><b>SHIPPER:</b> Sanfog s.r.o.</td><td><b>CUSTOMER:</b> NOR ELEKTRONIK</td></tr><tr><td><b>DATE:</b> ${project.quoteDate}</td><td><b>REF:</b> ${project.quoteNumber}</td></tr></table>`);
    w.document.write('<table><thead><tr><th>#</th><th>CODE</th><th>DESCRIPTION</th><th>QTY</th><th>UNIT</th></tr></thead><tbody>');
    aggregatedNazliLines.forEach((nl, i) => w.document.write(`<tr><td>${i + 1}</td><td>${nl.code}</td><td>${nl.name}</td><td>${fmtN(nl.qty, 1)}</td><td>${nl.unit}</td></tr>`));
    w.document.write('</tbody></table></body></html>'); w.document.close(); w.print();
  };

  const printBOM = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html><head><title>BOM – ${project.quoteNumber}</title><style>body{font-family:Arial;font-size:11px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:4px 6px}th{background:#f3f4f6}h2{font-size:14px;margin-top:16px}tfoot td{font-weight:bold}</style></head><body>`);
    w.document.write(`<h1>BOM – Objednávka pre Attiho</h1><p>Ponuka: ${project.quoteNumber} | Zákazník: ${project.customerName}</p>`);
    const attiSections = [...new Set(attiLines.map((l) => l.section))];
    attiSections.forEach((sec) => {
      const lines = attiLines.filter((l) => l.section === sec);
      const secTotal = lines.reduce((s, l) => s + l.qty * l.price, 0);
      w.document.write(`<h2>${sec}</h2><table><thead><tr><th>Kód</th><th>Popis</th><th>Qty</th><th>MJ</th><th>Cena/MJ</th><th>Celkom</th></tr></thead><tbody>`);
      lines.forEach((l) => w.document.write(`<tr><td>${l.code}</td><td>${l.name}</td><td>${fmtN(l.qty, 1)}</td><td>${l.unit}</td><td>${fmtN(l.price, 2)} €</td><td>${fmtN(l.qty * l.price, 2)} €</td></tr>`));
      w.document.write(`</tbody><tfoot><tr><td colspan="5">SPOLU ${sec}</td><td>${fmtN(secTotal, 2)} €</td></tr></tfoot></table>`);
    });
    w.document.write(`<h2>TOTAL: ${fmtE(attiLines.reduce((s, l) => s + l.qty * l.price, 0))}</h2></body></html>`);
    w.document.close(); w.print();
  };

  const exportNazliXLSX = () => {
    const rows = aggregatedNazliLines.map((nl, i) => ({ '#': i + 1, CODE: nl.code, DESCRIPTION: nl.name, QTY: nl.qty, UNIT: nl.unit }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Order NAZLI');
    XLSX.writeFile(wb, `OrderNAZLI_${project.quoteNumber}.xlsx`);
  };

  const exportAttiBOMXLSX = () => {
    const rows = attiLines.map((l, i) => ({ '#': i + 1, Sekcia: l.section, Kód: l.code, Popis: l.name, Qty: l.qty, MJ: l.unit, 'Cena/MJ': l.price, Celkom: +(l.qty * l.price).toFixed(2) }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'BOM Atti');
    XLSX.writeFile(wb, `BOM_Atti_${project.quoteNumber}.xlsx`);
  };

  const [oberonExporting, setOberonExporting] = useState(false);
  const exportAttiOberon = async () => {
    setOberonExporting(true);
    try {
      await exportToOberon(
        prepareBomForOberon(attiLines.map((l) => ({ code: l.code, qty: l.qty }))),
        project.quoteNumber
      );
    } catch (e) {
      alert(String(e));
    } finally {
      setOberonExporting(false);
    }
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
            <span className="text-xs bg-teal/20 text-teal border border-teal/40 px-2 py-0.5 rounded font-semibold uppercase tracking-wide flex items-center gap-1">
              Hotovo <Check className="w-3 h-3" />
            </span>
          </div>
          <h1 className="text-xl font-bold text-white">
            {project.customerName || 'Bez zákazníka'}
          </h1>
          {project.projectAddress && (
            <p className="text-sm text-white/60 mt-0.5 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 flex-shrink-0" />{project.projectAddress}</p>
          )}
          <p className="text-xs text-white/40 mt-1">{project.quoteDate} · {project.country}</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <button
            onClick={handleDownloadPDF}
            disabled={pdfGenerating}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded transition-colors disabled:opacity-60"
            style={{ borderRadius: 'var(--radius)' }}
          >
            {pdfGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
            PDF
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded transition-colors"
            style={{ borderRadius: 'var(--radius)' }}
          >
            <Printer className="w-3.5 h-3.5" /> Tlačiť
          </button>
          <button
            onClick={handleExportXLSX}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded transition-colors"
            style={{ borderRadius: 'var(--radius)' }}
          >
            <Download className="w-3.5 h-3.5" /> Export XLSX
          </button>
          {openProjectId && (
            <button
              onClick={handleShare}
              disabled={portalLoading}
              className="flex items-center gap-1.5 px-3 py-2 text-white text-sm font-semibold rounded transition-colors disabled:opacity-60"
              style={{ borderRadius: 'var(--radius)', background: 'hsl(var(--orange))', }}
            >
              {portalLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
              Zdieľať
            </button>
          )}
          <button
            onClick={onOpenWizard}
            className="flex items-center gap-1.5 px-3 py-2 bg-teal hover:bg-teal/90 text-white text-sm font-semibold rounded transition-colors"
            style={{ borderRadius: 'var(--radius)' }}
          >
            <Pencil className="w-3.5 h-3.5" /> Otvoriť wizard
          </button>
        </div>
      </div>

      {/* Share modal */}
      {shareModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'hsl(var(--navy) / 0.8)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShareModal(null)}
        >
          <div
            className="w-full max-w-md p-6 relative"
            style={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'calc(var(--radius) + 4px)',
              boxShadow: '0 8px 40px hsl(var(--navy) / 0.5)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <button onClick={() => setShareModal(null)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 mb-4">
              <Share2 className="w-5 h-5" style={{ color: 'hsl(var(--orange))' }} />
              <h2 className="font-bold text-foreground text-base">Zdieľať so zákazníkom</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Zákazník otvorí link a zadá heslo. Uvidí projekt bez cien.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Link</label>
                <div className="flex gap-2 items-center">
                  <input
                    readOnly
                    value={shareModal.link}
                    className="flex-1 px-3 py-2 text-xs font-mono rounded border border-border bg-muted text-foreground"
                    style={{ borderRadius: 'var(--radius)' }}
                  />
                  <button
                    onClick={() => handleCopyLink(shareModal.link)}
                    className="px-3 py-2 text-xs font-semibold rounded border border-border bg-card hover:bg-muted transition-colors flex items-center gap-1"
                    style={{ borderRadius: 'var(--radius)' }}
                  >
                    {copied ? <Check className="w-3 h-3 text-teal" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'OK' : 'Kopírovať'}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Heslo</label>
                <div className="flex gap-2 items-center">
                  <input
                    readOnly
                    value={shareModal.password}
                    className="flex-1 px-3 py-2 text-sm font-mono tracking-widest rounded border border-border bg-muted text-foreground font-bold"
                    style={{ borderRadius: 'var(--radius)' }}
                  />
                  <button
                    onClick={() => handleCopyLink(shareModal.password)}
                    className="px-3 py-2 text-xs font-semibold rounded border border-border bg-card hover:bg-muted transition-colors flex items-center gap-1"
                    style={{ borderRadius: 'var(--radius)' }}
                  >
                    <Copy className="w-3 h-3" /> Kopírovať
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 rounded text-xs" style={{ background: 'hsl(var(--orange) / 0.08)', border: '1px solid hsl(var(--orange) / 0.2)', color: 'hsl(var(--orange))', borderRadius: 'var(--radius)' }}>
              ⚠️ Heslo sa zobrazuje iba raz. Uložte si ho alebo odošlite zákazníkovi.
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => handleCopyLink(`Link: ${shareModal.link}\nHeslo: ${shareModal.password}`)}
                className="flex-1 py-2 text-sm font-semibold rounded border border-border hover:bg-muted transition-colors flex items-center justify-center gap-1.5"
                style={{ borderRadius: 'var(--radius)' }}
              >
                <Copy className="w-3.5 h-3.5" /> Kopírovať oboje
              </button>
              <button
                onClick={async () => { await revokePortal(); setShareModal(null); }}
                className="px-3 py-2 text-xs text-destructive hover:bg-destructive/10 rounded border border-destructive/30 transition-colors flex items-center gap-1"
                style={{ borderRadius: 'var(--radius)' }}
              >
                <RefreshCw className="w-3 h-3" /> Zrušiť portál
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Document actions */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Order NAZLI */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-bold text-foreground mb-1">Order Form pre NAZLI</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Proforma pre NOR ELEKTRONIK Istanbul · {aggregatedNazliLines.length} kódov
          </p>
          <div className="flex gap-2">
            <button
              onClick={printOrderNazli}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-sm font-semibold rounded hover:opacity-90 transition-opacity"
              style={{ borderRadius: 'var(--radius)' }}
            >
              <Printer className="w-3.5 h-3.5" /> Tlačiť
            </button>
            <button
              onClick={exportNazliXLSX}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-muted text-foreground text-sm font-semibold rounded hover:bg-muted/80 transition-colors"
              style={{ borderRadius: 'var(--radius)' }}
            >
              <Download className="w-3.5 h-3.5" /> XLSX
            </button>
          </div>
        </div>

        {/* BOM Atti */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-bold text-foreground mb-1">Objednávka pre Attiho (OBERON)</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Interný dokument bez NORMIST položiek · {attiLines.length} riadkov
          </p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={printBOM}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-sm font-semibold rounded hover:opacity-90 transition-opacity"
              style={{ borderRadius: 'var(--radius)' }}
            >
              <Printer className="w-3.5 h-3.5" /> Tlačiť
            </button>
            <button
              onClick={exportAttiBOMXLSX}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-muted text-foreground text-sm font-semibold rounded hover:bg-muted/80 transition-colors"
              style={{ borderRadius: 'var(--radius)' }}
            >
              <Download className="w-3.5 h-3.5" /> XLSX
            </button>
            <button
              onClick={exportAttiOberon}
              disabled={oberonExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-muted text-foreground text-sm font-semibold rounded hover:bg-muted/80 transition-colors disabled:opacity-60"
              style={{ borderRadius: 'var(--radius)' }}
            >
              <Download className="w-3.5 h-3.5" /> {oberonExporting ? 'Exportujem…' : 'Export do Oberon'}
            </button>
          </div>
        </div>
      </div>


      {/* Project Tasks */}
      {openProjectId && (
        <div className="mt-6">
          <ProjectTasksSection projectId={openProjectId} />
        </div>
      )}

      {/* Project Comments */}
      {openProjectId && (
        <div className="mt-6">
          <InlineProjectComments projectId={openProjectId} />
        </div>
      )}
    </div>
  );
}

// ── Inline project tasks section ──────────────────────────────────────────────

function ProjectTasksSection({ projectId }: { projectId: string }) {
  const [showCompleted, setShowCompleted] = useState(false);
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const { tasks, loading, refetch } = useTasks({ projectId, includeCompleted: showCompleted, parentTaskId: null });
  const { tasks: allTasks, refetch: refetchAll } = useAllTasks();

  const activeTasks = tasks.filter(t => t.status !== 'done');
  const doneTasks = showCompleted ? allTasks.filter(t => t.project_id === projectId && t.status === 'done' && !t.parent_task_id) : [];

  const handleRefresh = () => { refetch(); refetchAll(); };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-4 h-4" style={{ color: 'hsl(var(--teal))' }} />
          <h2 className="font-bold text-foreground uppercase tracking-wide text-sm">Úlohy projektu</h2>
          {!loading && activeTasks.length > 0 && (
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">{activeTasks.length}</span>
          )}
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setShowCompleted(v => !v)}
            className={`px-2 py-1 text-xs rounded border transition-colors ${showCompleted ? 'border-teal text-teal' : 'border-border text-muted-foreground hover:border-teal'}`}
            style={{ borderRadius: 'var(--radius)' }}
          >
            Dokončené
          </button>
          <button
            onClick={() => setNewTaskOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded text-white hover:opacity-90 transition-opacity"
            style={{ background: 'hsl(var(--teal))', borderRadius: 'var(--radius)' }}
          >
            <Plus className="w-3.5 h-3.5" /> Nová úloha
          </button>
        </div>
      </div>
      <div className="px-4 py-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Načítavam…</p>
        ) : activeTasks.length === 0 && !showCompleted ? (
          <p className="text-sm text-muted-foreground py-2">Žiadne aktívne úlohy pre tento projekt.</p>
        ) : (
          <>
            {activeTasks.map(task => (
              <TaskRow key={task.id} task={task} subtaskCount={allTasks.filter(t => t.parent_task_id === task.id).length} onClick={t => setSelectedTask(t)} />
            ))}
            {showCompleted && doneTasks.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Dokončené ({doneTasks.length})</p>
                {doneTasks.map(task => (
                  <TaskRow key={task.id} task={task} subtaskCount={allTasks.filter(t => t.parent_task_id === task.id).length} onClick={t => setSelectedTask(t)} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <NewTaskModal
        open={newTaskOpen}
        onClose={() => setNewTaskOpen(false)}
        onCreated={handleRefresh}
        prefilledProjectId={projectId}
      />
      <TaskDetailModal
        task={selectedTask}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onRefresh={handleRefresh}
      />
    </div>
  );
}
