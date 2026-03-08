import * as XLSX from 'xlsx';
import { useProjectStore } from '../../store/projectStore';
import { StepLayout } from '../ui/StepLayout';
import { Card, Button, PrintIcon, DownloadIcon } from '../ui/FormField';
import { NOZZLE_BY_ORIFICE, calcETNACapacity, getTransportCost, getPMCost, PUMP_TABLE, fmtN, fmtE, detectConcurrentPipes } from '../../utils/calculations';
import { getPipe10mmForSpacing } from '../../data/stockItems';

export function Step10_OrderForm() {
  const { project, globalParams, zones, zoneCalcs, normistPrice, costInputs, uvSystemCode, ssFilter30, cad } = useProjectStore();

  const totalFlowMlH = zoneCalcs.reduce((sum, c) => sum + (c?.zoneFlow ?? 0), 0);
  const transpCost = getTransportCost(project.country);
  const pmCost = getPMCost(costInputs.projectArea);
  const osmoticSS = globalParams.osmoticWater;

  type OrderLine = { code: string; name: string; qty: number; unit: string; supplier: string; priceUnit: number; total: number };
  const lines: OrderLine[] = [];
  const add = (code: string, name: string, qty: number, unit: string, supplier: string, price: number) => {
    if (qty > 0) lines.push({ code, name, qty, unit, supplier, priceUnit: price, total: qty * price });
  };

  add('SNFG.00001', 'Balné', 1, 'psch.', 'SANFOG', 350);
  if (normistPrice > 0) add('NORMIST', `FOGSYSTEM NORMIST (${osmoticSS ? 'SS' : 'STD'})`, 1, 'ks', 'NORMIST/NAZLI', normistPrice);
  add('snfg.001.0021', `ETNA HF KI-ST 32/2-30 ${osmoticSS ? 'SS' : 'ŠTANDARD'}`, 1, 'ks', 'ETNA', osmoticSS ? 3200 : 2800);
  add(osmoticSS ? 'MAXTRA_300_SS' : 'MAXTRA_300_STANDARD', `MAXIVAREM 300V ${osmoticSS ? 'SS' : 'ŠTANDARD'}`, 1, 'ks', 'MAXTRA CONTROL', osmoticSS ? 380 : 305.02);
  add('ETNA_ACC', 'Príslušenstvo k ETNA-NOR', 1, 'psch.', 'ETNA', 200);
  add('ETNA_VODA', 'Vodoinstalačný materiál ETNA-NOR', 1, 'psch.', 'ETNA', 300);
  add('SNFG.TLK.001', 'Trojcestná armatúra', 1, 'ks', 'SANFOG', 150);
  add('ETNA_MONTAZ', 'Montáž ETNA', 1, 'hod', 'SANFOG', 300);

  const N = globalParams.numberOfZones;
  add('0204013A', 'Solenoid Valve Kit 70 Bar', N, 'ks', 'NORMIST', 157.44);
  add('0104003-kit', 'Pressure Switch Kit', N, 'ks', 'NORMIST', 48);
  add('204091', 'Keller Pressure Transmitter 0/160 Bar', N, 'ks', 'NORMIST', 71.55);
  add('4072000024', 'Bypass ventil VRT100', N, 'ks', 'TECNOMEC', 76.43);
  add('60.0525.00', 'Poistný ventil VS220', N, 'ks', 'TECNOMEC', 29.25);
  add('snfg.006.0001', 'Prepoj čerpadlo → hl. vedenie DN25 3m', N, 'ks', 'SANFOG', 39.728);
  add('TELTONIKA_GSM', 'Teltonika GSM brána', 1, 'ks', 'TELTONIKA', 200);
  add('BPONG-005-P2PWE', 'Náhradný rukávový filter 5 mic', 1, 'ks', 'Eftech', 4.57);
  add('NORMIST_DANFOSS', 'DANFOSS Drive', 1, 'ks', 'DANFOSS', 954);

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
    if (globalParams.steelRope === 'SS_NEREZ') totalRopeSS += calc.ropeLength; else totalRopeOCEL += calc.ropeLength;
    totalHangers += calc.numHangers; totalGripple += calc.numGripple; totalNozzleHangers += calc.numNozzleHangers; totalPipeHangers += calc.numPipeHangers;
    totalInoxPipe += calc.inoxPipeLength; totalInoxConnectors += calc.numInoxConnectors; totalTJunctions += calc.numTJunctions;
    totalDilations += calc.numDilations; totalDrain += calc.numDrainAssemblies; totalNeedles += calc.numNeedleValves;
    totalCYSY += calc.cysyLength; totalBoxes += calc.numJunctionBoxes; totalWago += calc.numWago;
  });

  Object.entries(totalPumpsByCode).forEach(([code, { name, qty }]) => add(code, name, qty, 'ks', 'NORMIST', 0));
  Object.entries(totalNozzles).forEach(([code, qty]) => { const orifice = Object.entries(NOZZLE_BY_ORIFICE).find(([, v]) => v === code)?.[0]; add(code, `Tryska D${orifice}mm AK SS`, qty, 'ks', 'NORMIST', 1.23); });
  add('NOR 301188', 'Swivel adaptér', zoneCalcs.reduce((s, c) => s + c.numSwivel, 0), 'ks', 'NORMIST', 1.5);
  Object.entries(totalPipesByCode).forEach(([code, { name, qty, price }]) => add(code, name, qty, 'ks', 'NORMIST', price));
  add('NORMIST 0311002SS-180', 'Fitting SS 180°', totalFitting180, 'ks', 'NORMIST', 2.4);
  add('NORMIST 0311008SS', 'End plug 10mm SS', totalEndPlug, 'ks', 'NORMIST', 0.73);
  if (totalRopeSS > 0) add('SVX_SS_NEREZ', 'Nerezové lano 3mm', totalRopeSS, 'm', 'SVX', 0.15);
  if (totalRopeOCEL > 0) add('SVX 201143', 'Oceľové lano 3mm', totalRopeOCEL, 'm', 'SVX', 0.099);
  add('MVUZTLN400MMAKNS', 'Závesný diel 400mm AK NS', totalHangers, 'ks', 'NORMIST', 0.23);
  add('Gripple Plus Medium', 'GRIPPLE stredný', totalGripple, 'ks', 'GRIPPLE', 1.18);
  add('NORMIST 201142', 'Záves drziak trysky D10', totalNozzleHangers, 'ks', 'NORMIST', 0.15);
  add('NORMIST 201142M', 'Záves stred rúr D10', totalPipeHangers, 'ks', 'NORMIST', 0.12);
  add('ITALINOX', 'Trubka A304 TIG 22×1,5 [SS]', Math.ceil(totalInoxPipe), 'm', 'ITALINOX', 3.0);
  add('183022000', 'VT Spojka P22F AK [SS]', totalInoxConnectors, 'ks', 'RACMET', 2.836);
  add('RACMET 182022000', 'VT T-kus P22F AK [SS]', totalTJunctions, 'ks', 'RACMET', 6.81);
  bracketBOM.forEach(b => add(b.code, b.name, b.qty, 'ks', 'SANFOG', b.direction === 'racmet' ? 13.58 : 11.66));
  add('snfg.05.0002', 'Dilatácia hydraulická DN25 2m [SS]', totalDilations, 'ks', 'SANFOG', 37.328);
  add('snfg.05.0014', 'Zostava vyprázdňovania', totalDrain, 'ks', 'SANFOG', 34.47);
  add('MVVMVGG1.2FG1.2FAK', 'Ventil ihlový G1/2F [SS]', totalNeedles, 'ks', 'SANFOG', 15);
  add('MVEMKCS2X1PVCW', 'CYSY 2×1 PVC Biely', Math.ceil(totalCYSY), 'm', 'Kábel SK', 0.367);
  add('EKR000001481', 'Rozbočovacia krabica A1', totalBoxes, 'ks', 'OBERON', 0.48);
  add('ESV000001630', 'WAGO svorky 221-413', totalWago, 'ks', 'OBERON', 0.38);

  const installTechCost = (costInputs.installTechDays * costInputs.installTechCount + costInputs.installGreenhouseDays * costInputs.installGreenhouseCount + costInputs.diggingDays * costInputs.diggingCount + costInputs.commissioningDays * costInputs.commissioningCount) * 100;
  if (installTechCost > 0) add('SANFOG_MONTAZ', 'Práca montáž', installTechCost / 100, 'dní', 'SANFOG', 100);
  add('SANFOG_PREPRAVA', `Preprava tovaru ${project.country}`, 1, 'psch.', 'Dopravca', transpCost);
  add('SANFOG_PROJEKTO', 'Obhliadka + projektovanie', 1, 'psch.', 'SANFOG', 400);
  add('SANFOG_PM', 'Projektový manažér', 1, 'psch.', 'SANFOG', pmCost);
  add('SANFOG_MAT', 'Montážny materiál', 1, 'psch.', 'SANFOG', Number(costInputs.mountingMaterial) + Number(costInputs.mountingMaterialStation));
  add('SANFOG_COLNICA', 'Ďalšie náklady, colnica', 1, 'psch.', 'SANFOG', 1400);

  const processedLines = lines.map((l) => l.supplier === 'NORMIST' && l.code !== 'NORMIST' ? { ...l, priceUnit: 0, total: 0 } : l);
  const grandTotal = processedLines.reduce((s, l) => s + l.total, 0);

  const printOrder = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html><head><title>Objednávka – ${project.quoteNumber}</title><style>body{font-family:Arial;font-size:11px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:5px 8px}th{background:#14532d;color:#fff}tfoot td{font-weight:bold}</style></head><body>`);
    w.document.write(`<h1>OBJEDNÁVKOVÝ FORMULÁR PRE ATTIHO</h1><p>Ponuka: ${project.quoteNumber} | ${project.customerName}</p>`);
    w.document.write('<table><thead><tr><th>#</th><th>Kód</th><th>Popis</th><th>Počet</th><th>MJ</th><th>Dodávateľ</th><th>Cena/MJ €</th><th>Celkom €</th></tr></thead><tbody>');
    processedLines.forEach((l, i) => { const isNR = l.supplier === 'NORMIST' && l.code !== 'NORMIST'; w.document.write(`<tr><td>${i+1}</td><td>${l.code}</td><td>${l.name}</td><td>${fmtN(l.qty,1)}</td><td>${l.unit}</td><td>${l.supplier}</td><td>${isNR?'—':fmtN(l.priceUnit,2)}</td><td>${isNR?'—':fmtN(l.total,2)}</td></tr>`); });
    w.document.write(`</tbody><tfoot><tr><td colspan="7">TOTAL</td><td>${fmtN(grandTotal,2)} €</td></tr></tfoot></table></body></html>`);
    w.document.close(); w.print();
  };

  const exportOrderXLSX = () => {
    const rows = processedLines.map((l, i) => { const isNR = l.supplier === 'NORMIST' && l.code !== 'NORMIST'; return { '#': i+1, Kód: l.code, Popis: l.name, Qty: l.qty, MJ: l.unit, Dodávateľ: l.supplier, 'Cena/MJ': isNR ? '—' : l.priceUnit, Celkom: isNR ? '—' : l.total }; });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Objednávka');
    XLSX.writeFile(wb, `Order_${project.quoteNumber}.xlsx`);
  };

  return (
    <StepLayout stepNum={10} title="Objednávkový formulár pre Attiho (OBERON)" subtitle="Finálna objednávka. Každá položka obsahuje Kód OBERON · Počet · MJ · Dodávateľ · Cena." hideNav={true}>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">Ponuka: <strong>{project.quoteNumber}</strong> · {project.customerName}</p>
        <div className="flex gap-2">
          <Button variant="secondary" size="lg" onClick={exportOrderXLSX}><DownloadIcon /> Export XLSX</Button>
          <Button variant="primary" size="lg" onClick={printOrder}><PrintIcon /> Tlačiť</Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-green-50 flex items-center justify-between">
          <h3 className="font-bold text-green-800">📋 Objednávkový formulár</h3>
          <div className="text-green-700 font-bold text-lg">{fmtE(grandTotal)}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="bg-gray-800 text-white"><th className="text-left p-3">#</th><th className="text-left p-3">Kód OBERON</th><th className="text-left p-3">Popis</th><th className="text-right p-3">Počet</th><th className="text-right p-3">MJ</th><th className="text-right p-3">Dodávateľ</th><th className="text-right p-3">Cena/MJ</th><th className="text-right p-3">Celkom</th></tr></thead>
            <tbody>
              {processedLines.map((line, i) => {
                const isNazliRef = line.supplier === 'NORMIST' && line.code !== 'NORMIST';
                return (
                  <tr key={i} className={`border-t border-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="p-2 text-gray-400">{i + 1}</td>
                    <td className="p-2 font-mono text-blue-700">{line.code}</td>
                    <td className="p-2 text-gray-800">{line.name}</td>
                    <td className="p-2 text-right font-mono">{fmtN(line.qty, 1)}</td>
                    <td className="p-2 text-right text-gray-400">{line.unit}</td>
                    <td className="p-2 text-right text-gray-500">{line.supplier}</td>
                    <td className="p-2 text-right">{isNazliRef ? <span className="text-gray-400">—</span> : <>{fmtN(line.priceUnit, 2)} €</>}</td>
                    <td className="p-2 text-right font-semibold text-green-700">{isNazliRef ? <span className="text-gray-400">—</span> : <>{fmtN(line.total, 2)} €</>}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot><tr className="bg-green-50 border-t-2 border-green-300"><td colSpan={7} className="p-4 font-bold text-gray-800">TOTAL NÁKLADY</td><td className="p-4 text-right font-bold text-green-800 text-base">{fmtE(grandTotal)}</td></tr></tfoot>
          </table>
        </div>
      </div>
    </StepLayout>
  );
}
