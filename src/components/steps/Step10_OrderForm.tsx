import * as XLSX from 'xlsx';
import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { useAuthStore } from '../../store/authStore';
import { StepLayout } from '../ui/StepLayout';
import { Card, Button, PrintIcon, DownloadIcon } from '../ui/FormField';
import { NOZZLE_BY_ORIFICE, calcETNACapacity, selectMaxivarem, getTransportCost, getPMCost, PUMP_TABLE, fmtN, fmtE, detectConcurrentPipes } from '../../utils/calculations';
import { getPipe10mmForSpacing, getStockPrice } from '../../data/stockItems';
import { exportToOberon, prepareBomForOberon } from '../../utils/exportOberon';
import { markProjectCompleted } from '../../hooks/useProjectChanges';


export function Step10_OrderForm() {
  const { project, globalParams, zones, zoneCalcs, normistPrice, costInputs, uvSystemCode, ssFilter30, cad, ropeOverrides, savedProjects, setSavedProjects } = useProjectStore();
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

  const totalFlowMlH = zoneCalcs.reduce((sum, c) => sum + (c?.zoneFlow ?? 0), 0);
  const transpCost = getTransportCost(project.country);
  const pmCost = getPMCost(costInputs.projectArea);
  const osmoticSS = globalParams.osmoticWater;
  const maxivaremInfo = selectMaxivarem(calcETNACapacity(totalFlowMlH), osmoticSS);

  type OrderLine = { code: string; name: string; qty: number; unit: string; supplier: string; priceUnit: number; total: number };
  const lines: OrderLine[] = [];
  const add = (code: string, name: string, qty: number, unit: string, supplier: string, price: number) => {
    if (qty > 0) lines.push({ code, name, qty, unit, supplier, priceUnit: price, total: qty * price });
  };

  add('SNFG.00001', 'Balné', 1, 'ks', 'SANFOG', getStockPrice('SNFG.00001'));
  if (normistPrice > 0) add('NORMIST', `FOGSYSTEM NORMIST (${osmoticSS ? 'SS' : 'STD'})`, 1, 'ks', 'NORMIST/NAZLI', normistPrice);
  add('snfg.001.0021', `ETNA HF KI-ST 32/2-30 ${osmoticSS ? 'SS' : 'ŠTANDARD'}`, 1, 'ks', 'ETNA', getStockPrice('snfg.001.0021'));
  add(maxivaremInfo.code, maxivaremInfo.label, 1, 'ks', 'MAXTRA CONTROL', maxivaremInfo.price);
  add('ETNA_ACC', 'Príslušenstvo k ETNA-NOR', 1, 'ks', 'ETNA', getStockPrice('ETNA_ACC'));
  add('ETNA_VODA', 'Vodoinstalačný materiál ETNA-NOR', 1, 'ks', 'ETNA', getStockPrice('ETNA_VODA'));
  add('SNFG.TLK.001', 'Trojcestná armatúra', 1, 'ks', 'SANFOG', getStockPrice('SNFG.TLK.001'));
  add('ETNA_MONTAZ', 'Montáž ETNA', 1, 'hod', 'SANFOG', getStockPrice('ETNA_MONTAZ'));

  const N = globalParams.numberOfZones;

  const { bracketBOM } = detectConcurrentPipes(cad);
  const totalNozzles: Record<string, number> = {};
  const totalPumpsByCode: Record<string, { name: string; qty: number }> = {};
  const totalPipesByCode: Record<string, { name: string; qty: number; price: number }> = {};
  let totalFitting180 = 0, totalEndPlug = 0, totalRopeSS = 0, totalRopeOCEL = 0;
  let totalHangers = 0, totalGripple = 0, totalNozzleHangers = 0, totalPipeHangers = 0;
  let totalInoxPipe = 0, totalInoxConnectors = 0, totalTJunctions = 0;
  let totalDilations = 0, totalDrain = 0, totalNeedles = 0;
  let totalCYSY = 0, totalBoxes = 0, totalWago = 0;

  zoneCalcs.forEach((calc, i) => {
    const zone = zones[i]; if (!zone) return;
    const nCode = NOZZLE_BY_ORIFICE[zone.nozzleOrifice];
    totalNozzles[nCode] = (totalNozzles[nCode] ?? 0) + calc.numNozzles;
    const flowLpm = calc.zoneFlow / 1000 / 60;
    const zonePump = PUMP_TABLE.find(p => p.maxFlow >= flowLpm);
    if (zonePump) { if (!totalPumpsByCode[zonePump.code]) totalPumpsByCode[zonePump.code] = { name: zonePump.name, qty: 0 }; totalPumpsByCode[zonePump.code].qty += 1; }
    const pipe10mm = getPipe10mmForSpacing(zone.nozzleSpacing);
    const existing = totalPipesByCode[pipe10mm.code];
    totalPipesByCode[pipe10mm.code] = { name: pipe10mm.name, qty: (existing?.qty ?? 0) + calc.numPipes10mmTotal, price: pipe10mm.price };
    totalFitting180 += calc.numFitting180; totalEndPlug += calc.numEndPlug;
    const ropeQty = ropeOverrides[i] ?? calc.ropeLength;
    if (globalParams.steelRope === 'SS_NEREZ') totalRopeSS += ropeQty; else totalRopeOCEL += ropeQty;
    totalHangers += calc.numHangers; totalGripple += calc.numGripple; totalNozzleHangers += calc.numNozzleHangers; totalPipeHangers += calc.numPipeHangers;
    totalInoxPipe += calc.inoxPipeLength; totalInoxConnectors += calc.numInoxConnectors; totalTJunctions += calc.numTJunctions;
    totalDilations += calc.numDilations; totalDrain += calc.numDrainAssemblies; totalNeedles += calc.numNeedleValves;
    totalCYSY += calc.cysyLength; totalBoxes += calc.numJunctionBoxes; totalWago += calc.numWago;
  });

  Object.entries(totalPumpsByCode).forEach(([code, { name, qty }]) => add(code, name, qty, 'ks', 'NORMIST', 0));

  add('0204013A', 'Solenoid Valve Kit 70 Bar', N, 'ks', 'NORMIST', getStockPrice('0204013A'));
  add('0104003-kit', 'Pressure Switch Kit', N, 'ks', 'NORMIST', getStockPrice('0104003-kit'));
  add('204091', 'Keller Pressure Transmitter 0/160 Bar', N, 'ks', 'NORMIST', getStockPrice('204091'));
  add('4072000024', 'Bypass ventil VRT100', N, 'ks', 'TECNOMEC', getStockPrice('4072000024'));
  add('60.0525.00', 'Poistný ventil VS220', N, 'ks', 'TECNOMEC', getStockPrice('60.0525.00'));
  add('snfg.006.0001', 'Prepoj čerpadlo → hl. vedenie DN25 3m', N, 'ks', 'SANFOG', getStockPrice('snfg.006.0001'));
  add('TELTONIKA_GSM', 'Teltonika GSM brána', 1, 'ks', 'TELTONIKA', getStockPrice('TELTONIKA_GSM'));
  add('BPONG-005-P2PWE', 'Náhradný rukávový filter 5 mic', 1, 'ks', 'Eftech', getStockPrice('BPONG-005-P2PWE'));
  add('NORMIST_DANFOSS', 'DANFOSS Drive', 1, 'ks', 'DANFOSS', getStockPrice('NORMIST_DANFOSS'));

  Object.entries(totalNozzles).forEach(([code, qty]) => { const orifice = Object.entries(NOZZLE_BY_ORIFICE).find(([, v]) => v === code)?.[0]; add(code, `Tryska D${orifice}mm AK SS`, qty, 'ks', 'NORMIST', getStockPrice(code)); });
  add('NOR 301188', 'Swivel adaptér', zoneCalcs.reduce((s, c) => s + c.numSwivel, 0), 'ks', 'NORMIST', getStockPrice('NOR 301188'));
  Object.entries(totalPipesByCode).forEach(([code, { name, qty }]) => add(code, name, qty, 'ks', 'NORMIST', getStockPrice(code)));
  add('NORMIST 0311002SS-180', 'Fitting SS 180°', totalFitting180, 'ks', 'NORMIST', getStockPrice('NORMIST 0311002SS-180'));
  add('NORMIST 0311008SS', 'End plug 10mm SS', totalEndPlug, 'ks', 'NORMIST', getStockPrice('NORMIST 0311008SS'));
  if (totalRopeSS > 0) add('SVX_SS_NEREZ', 'Nerezové lano 3mm', totalRopeSS, 'm', 'SVX', getStockPrice('SVX_SS_NEREZ'));
  if (totalRopeOCEL > 0) add('SVX 201143', 'Oceľové lano 3mm', totalRopeOCEL, 'm', 'SVX', getStockPrice('SVX 201143'));
  add('MVUZTLN400MMAKNS', 'Závesný diel 400mm AK NS', totalHangers, 'ks', 'NORMIST', getStockPrice('MVUZTLN400MMAKNS'));
  add('Gripple Plus Medium', 'GRIPPLE stredný', totalGripple, 'ks', 'GRIPPLE', getStockPrice('Gripple Plus Medium'));
  add('NORMIST 201142', 'Záves drziak trysky D10', totalNozzleHangers, 'ks', 'NORMIST', getStockPrice('NORMIST 201142'));
  add('NORMIST 201142M', 'Záves stred rúr D10', totalPipeHangers, 'ks', 'NORMIST', getStockPrice('NORMIST 201142M'));
  add('ITALINOX', 'Trubka A304 TIG 22×1,5 [SS]', Math.ceil(totalInoxPipe), 'm', 'ITALINOX', getStockPrice('ITALINOX'));
  add('183022000', 'VT Spojka P22F AK [SS]', totalInoxConnectors, 'ks', 'RACMET', getStockPrice('183022000'));
  add('RACMET 182022000', 'VT T-kus P22F AK [SS]', totalTJunctions, 'ks', 'RACMET', getStockPrice('RACMET 182022000'));
  bracketBOM.forEach(b => add(b.code, b.name, b.qty, 'ks', 'SANFOG', getStockPrice(b.code)));
  add('snfg.05.0002', 'Dilatácia hydraulická DN25 2m [SS]', totalDilations, 'ks', 'SANFOG', getStockPrice('snfg.05.0002'));
  add('snfg.05.0014', 'Zostava vyprázdňovania', totalDrain, 'ks', 'SANFOG', getStockPrice('snfg.05.0014'));
  add('MVVMVGG1.2FG1.2FAK', 'Ventil ihlový G1/2F [SS]', totalNeedles, 'ks', 'SANFOG', getStockPrice('MVVMVGG1.2FG1.2FAK'));
  add('MVEMKCS2X1PVCW', 'CYSY 2×1 PVC Biely', Math.ceil(totalCYSY), 'm', 'Kábel SK', getStockPrice('MVEMKCS2X1PVCW'));
  add('EKR000001481', 'Rozbočovacia krabica A1', totalBoxes, 'ks', 'OBERON', getStockPrice('EKR000001481'));
  add('ESV000001630', 'WAGO svorky 221-413', totalWago, 'ks', 'OBERON', getStockPrice('ESV000001630'));

  const installTechCost = (costInputs.installTechDays * costInputs.installTechCount + costInputs.installGreenhouseDays * costInputs.installGreenhouseCount + costInputs.diggingDays * costInputs.diggingCount + costInputs.commissioningDays * costInputs.commissioningCount) * 100;
  if (installTechCost > 0) add('SANFOG_MONTAZ', 'Práca montáž', installTechCost / 100, 'dní', 'SANFOG', getStockPrice('SANFOG_MONTAZ'));
  add('SANFOG_PREPRAVA', `Preprava tovaru ${project.country}`, 1, 'ks', 'Dopravca', transpCost);
  add('SANFOG_PROJEKTO', 'Obhliadka + projektovanie', 1, 'ks', 'SANFOG', getStockPrice('SANFOG_PROJEKTO'));
  add('SANFOG_PM', 'Projektový manažér', 1, 'ks', 'SANFOG', pmCost);
  add('SANFOG_MAT', 'Montážny materiál', 1, 'ks', 'SANFOG', Number(costInputs.mountingMaterial) + Number(costInputs.mountingMaterialStation));
  add('SANFOG_COLNICA', 'Ďalšie náklady, colnica', 1, 'ks', 'SANFOG', getStockPrice('SANFOG_COLNICA'));

  const processedLines = lines.map((l) => l.supplier === 'NORMIST' && l.code !== 'NORMIST' ? { ...l, priceUnit: 0, total: 0 } : l);
  const grandTotal = processedLines.reduce((s, l) => s + l.total, 0);

  const totalRopeRaw = ropeOverrides.reduce((s, v) => s + (v || 0), 0);
  const ropeCeiled = Math.ceil(totalRopeRaw / 500) * 500;
  const ropeSpools = ropeCeiled / 500;

  const printOrder = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html><head><title>Objednávka – ${project.quoteNumber}</title><style>body{font-family:Arial;font-size:11px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:5px 8px}th{background:#14532d;color:#fff}tfoot td{font-weight:bold}.rope-note{background:#f0fdf4;border-left:3px solid #16a34a;padding:6px 10px;margin:8px 0;font-size:11px}</style></head><body>`);
    w.document.write(`<h1>OBJEDNÁVKOVÝ FORMULÁR PRE ATTIHO</h1><p>Ponuka: ${project.quoteNumber} | ${project.customerName}</p>`);
    w.document.write('<table><thead><tr><th>#</th><th>Kód</th><th>Popis</th><th>Počet</th><th>MJ</th><th>Dodávateľ</th><th>Cena/MJ €</th><th>Celkom €</th></tr></thead><tbody>');
    processedLines.forEach((l, i) => { const isNR = l.supplier === 'NORMIST' && l.code !== 'NORMIST'; w.document.write(`<tr><td>${i+1}</td><td>${l.code}</td><td>${l.name}</td><td>${fmtN(l.qty,1)}</td><td>${l.unit}</td><td>${l.supplier}</td><td>${isNR?'—':fmtN(l.priceUnit,2)}</td><td>${isNR?'—':fmtN(l.total,2)}</td></tr>`); });
    w.document.write(`</tbody><tfoot><tr><td colspan="7">TOTAL</td><td>${fmtN(grandTotal,2)} €</td></tr></tfoot></table>`);
    w.document.write(`<div class="rope-note"><strong>Lano celkom (zaokrúhlené nahor na 500 m):</strong> ${fmtN(ropeCeiled, 0)} m = ${ropeSpools} × cievka 500 m</div>`);
    w.document.write(`</body></html>`);
    w.document.close(); w.print();
  };

  const exportOrderXLSX = () => {
    const rows = processedLines.map((l, i) => { const isNR = l.supplier === 'NORMIST' && l.code !== 'NORMIST'; return { '#': i+1, Kód: l.code, Popis: l.name, Qty: l.qty, MJ: l.unit, Dodávateľ: l.supplier, 'Cena/MJ': isNR ? '—' : l.priceUnit, Celkom: isNR ? '—' : l.total }; });
    rows.push({ '#': rows.length + 1, Kód: 'INFO', Popis: `Lano zaokrúhlené nahor na 500 m: ${fmtN(ropeCeiled, 0)} m = ${ropeSpools} × cievka 500 m`, Qty: ropeCeiled, MJ: 'm', Dodávateľ: '—', 'Cena/MJ': '—', Celkom: '—' });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Objednávka');
    XLSX.writeFile(wb, `Order_${project.quoteNumber}.xlsx`);
  };

  const [oberonExporting, setOberonExporting] = useState(false);
  const exportOrderOberon = async () => {
    setOberonExporting(true);
    try {
      const attiLines = processedLines.filter((l) => !(l.supplier === 'NORMIST' && l.code !== 'NORMIST'));
      await exportToOberon(prepareBomForOberon(attiLines.map((l) => ({ code: l.code, qty: l.qty }))), project.quoteNumber);
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
    <StepLayout stepNum={10} title="Objednávkový formulár pre Attiho (OBERON)" subtitle="Finálna objednávka. Každá položka obsahuje Kód OBERON · Počet · MJ · Dodávateľ · Cena." hideNav={true}>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Ponuka: <strong>{project.quoteNumber}</strong> · {project.customerName}</p>
        <div className="flex gap-2">
          <Button variant="secondary" size="lg" onClick={exportOrderXLSX}><DownloadIcon /> Export XLSX</Button>
          <Button variant="secondary" size="lg" onClick={exportOrderOberon} disabled={oberonExporting}><DownloadIcon /> {oberonExporting ? 'Exportujem…' : 'Export do Oberon'}</Button>
          <Button variant="primary" size="lg" onClick={printOrder}><PrintIcon /> Tlačiť</Button>
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
                <th className="text-right p-3">Dodávateľ</th>
                <th className="text-right p-3">Cena/MJ</th>
                <th className="text-right p-3">Celkom</th>
              </tr>
            </thead>
            <tbody>
              {processedLines.map((line, i) => {
                const isNazliRef = line.supplier === 'NORMIST' && line.code !== 'NORMIST';
                return (
                  <tr key={i} className={`border-t border-border ${i % 2 === 0 ? '' : 'bg-muted/30'}`}>
                    <td className="p-2 text-muted-foreground">{i + 1}</td>
                    <td className="p-2 font-mono text-primary">{line.code}</td>
                    <td className="p-2 text-foreground">{line.name}</td>
                    <td className="p-2 text-right font-mono">{fmtN(line.qty, 1)}</td>
                    <td className="p-2 text-right text-muted-foreground">{line.unit}</td>
                    <td className="p-2 text-right text-muted-foreground">{line.supplier}</td>
                    <td className="p-2 text-right">{isNazliRef ? <span className="text-muted-foreground">—</span> : <>{fmtN(line.priceUnit, 2)} €</>}</td>
                    <td className="p-2 text-right font-semibold text-teal">{isNazliRef ? <span className="text-muted-foreground">—</span> : <>{fmtN(line.total, 2)} €</>}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-teal/10 border-t-2 border-teal/30">
                <td colSpan={7} className="p-4 font-bold text-foreground">TOTAL NÁKLADY</td>
                <td className="p-4 text-right font-bold text-teal text-base">{fmtE(grandTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </StepLayout>
  );
}
