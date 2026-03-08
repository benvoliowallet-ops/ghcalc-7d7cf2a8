import { useRef } from 'react';
import * as XLSX from 'xlsx';
import { useProjectStore } from '../../store/projectStore';
import { StepLayout } from '../ui/StepLayout';
import { Card, Button, PrintIcon, DownloadIcon } from '../ui/FormField';
import { PUMP_TABLE, calcETNACapacity, getTransportCost, getPMCost, fmtN, fmtE, NOZZLE_BY_ORIFICE, detectConcurrentPipes } from '../../utils/calculations';
import { getPipe10mmForSpacing } from '../../data/stockItems';
import { useNormistChecker } from '../../hooks/useSupabaseItems';

export function Step8_Documents() {
  const { project, globalParams, zones, zoneCalcs, normistPrice, costInputs, uvSystemCode, ssFilter30, cad } = useProjectStore();
  const { isNormist } = useNormistChecker();
  const bomRef = useRef<HTMLDivElement>(null);
  const orderRef = useRef<HTMLDivElement>(null);

  const totalFlowMlH = zoneCalcs.reduce((sum, c) => sum + (c?.zoneFlow ?? 0), 0);
  const etnaCapacity = calcETNACapacity(totalFlowMlH);
  const transpCost = getTransportCost(project.country);
  const pmCost = getPMCost(costInputs.projectArea);
  const osmoticSS = globalParams.osmoticWater;
  const N = globalParams.numberOfZones;
  const { bracketBOM } = detectConcurrentPipes(cad);
  const cadHasPipes = cad.segments.some(s => s.lineType === 'pipe');

  const bomLines: { section: string; code: string; name: string; qty: number; unit: string; price: number }[] = [];
  const add = (section: string, code: string, name: string, qty: number, unit: string, price: number) => {
    if (qty > 0) bomLines.push({ section, code, name, qty, unit, price });
  };

  add('Balné', 'SNFG.00001', 'Balné', 1, 'psch.', 350);
  if (normistPrice > 0) add('FOGSYSTEM NORMIST', 'NORMIST', `FOGSYSTEM NORMIST (${osmoticSS ? 'SS' : 'STD'})`, 1, 'ks', normistPrice);
  add('ETNA', 'snfg.001.0021', `ETNA HF KI-ST 32/2-30 ${osmoticSS ? 'SS' : 'ŠTANDARD'}`, 1, 'ks', osmoticSS ? 3200 : 2800);
  add('ETNA', osmoticSS ? 'MAXTRA_300_SS' : 'MAXTRA_300_STANDARD', `MAXIVAREM 300V ${osmoticSS ? 'SS' : 'ŠTANDARD'}`, 1, 'ks', osmoticSS ? 380 : 305.02);
  add('ETNA', 'ETNA_ACC', 'Príslušenstvo k ETNA-NOR (≤10m)', 1, 'psch.', 200);
  add('ETNA', 'ETNA_VODA', 'Vodoinstalačný materiál ETNA-NOR', 1, 'psch.', 300);
  add('ETNA', 'SNFG.TLK.001', 'Trojcestná armatúra', 1, 'ks', 150);
  add('ETNA', 'ETNA_MONTAZ', 'Montáž ETNA', 1, 'hod', 300);
  add('Čerpadlo', '0204013A', 'Solenoid Valve Kit 70 Bar', N, 'ks', 157.44);
  add('Čerpadlo', '0104003-kit', 'Pressure Switch Kit', N, 'ks', 48);
  add('Čerpadlo', '204091', 'Keller Pressure Transmitter 0/160 Bar', N, 'ks', 71.55);
  add('Čerpadlo', '4072000024', 'Bypass ventil VRT100-100LPM@170bar', N, 'ks', 76.43);
  add('Čerpadlo', '60.0525.00', 'Poistný ventil VS220 G3/8F', N, 'ks', 29.25);
  add('Čerpadlo', 'snfg.006.0001', 'Prepoj čerpadlo → hl. vedenie DN25 3m [SS]', N, 'ks', 39.728);
  add('Systém', 'TELTONIKA_GSM', 'Teltonika GSM brána', 1, 'ks', 200);
  add('Systém', 'BPONG-005-P2PWE', 'Náhradný rukávový filter 5 mic', 1, 'ks', 4.57);
  add('Systém', 'NORMIST_DANFOSS', 'DANFOSS Drive', 1, 'ks', 954);
  if (uvSystemCode) add('Systém', uvSystemCode, 'UV System', 1, 'ks', 1500);
  if (ssFilter30) add('Systém', 'NORMIST_30SS_FILTER', 'SS Filter 30" Unit', 1, 'ks', 800);

  zoneCalcs.forEach((calc, i) => {
    const zone = zones[i];
    if (!zone) return;
    const zName = zone.name;
    const flowLpm = calc.zoneFlow / 1000 / 60;
    const zonePump = PUMP_TABLE.find(p => p.maxFlow >= flowLpm);
    if (zonePump) add(`Zóna ${i+1}: ${zName}`, zonePump.code, zonePump.name, 1, 'ks', 0);
    const nCode = NOZZLE_BY_ORIFICE[zone.nozzleOrifice];
    add(`Zóna ${i+1}: ${zName}`, nCode, `Tryska D${zone.nozzleOrifice}mm AK SS`, calc.numNozzles, 'ks', 1.23);
    add(`Zóna ${i+1}: ${zName}`, 'NOR 301188', 'Swivel adaptér', calc.numSwivel, 'ks', 1.5);
    const pipe10mm = getPipe10mmForSpacing(zone.nozzleSpacing);
    add(`Zóna ${i+1}: ${zName}`, pipe10mm.code, pipe10mm.name, calc.numPipes10mmTotal, 'ks', pipe10mm.price);
    add(`Zóna ${i+1}: ${zName}`, 'NORMIST 0311002SS-180', 'Fitting SS 180°', calc.numFitting180, 'ks', 2.4);
    add(`Zóna ${i+1}: ${zName}`, 'NORMIST 0311008SS', 'End plug 10mm SS', calc.numEndPlug, 'ks', 0.73);
    add(`Zóna ${i+1}: ${zName}`, 'NORMIST 0311001SS', 'Drziak trysky 1 tryska SS', calc.numNozzles - calc.numFitting180, 'ks', 3.78);
    const ropeCode = globalParams.steelRope === 'SS_NEREZ' ? 'SVX_SS_NEREZ' : 'SVX 201143';
    const ropeName = globalParams.steelRope === 'SS_NEREZ' ? 'Nerezové lano 3mm' : 'Oceľové lano 3mm';
    add(`Zóna ${i+1}: ${zName}`, ropeCode, ropeName, calc.ropeLength, 'm', 0.15);
    add(`Zóna ${i+1}: ${zName}`, 'MVUZTLN400MMAKNS', 'Závesný diel 400mm AK NS', calc.numHangers, 'ks', 0.23);
    add(`Zóna ${i+1}: ${zName}`, 'Gripple Plus Medium', 'GRIPPLE stredný', calc.numGripple, 'ks', 1.18);
    add(`Zóna ${i+1}: ${zName}`, 'NORMIST 201142', 'Záves drziak trysky D10', calc.numNozzleHangers, 'ks', 0.15);
    add(`Zóna ${i+1}: ${zName}`, 'NORMIST 201142M', 'Záves stred rúr D10', calc.numPipeHangers, 'ks', 0.12);
    add(`Zóna ${i+1}: ${zName}`, 'ITALINOX', 'Trubka A304 TIG 22×1,5 [SS]', Math.ceil(calc.inoxPipeLength), 'm', 3.0);
    add(`Zóna ${i+1}: ${zName}`, '183022000', 'VT Spojka P22F AK [SS]', calc.numInoxConnectors, 'ks', 2.836);
    add(`Zóna ${i+1}: ${zName}`, 'RACMET 182022000', 'VT T-kus P22F AK [SS]', calc.numTJunctions, 'ks', 6.81);
    add(`Zóna ${i+1}: ${zName}`, 'snfg.05.0002', 'Dilatácia hydraulická DN25 2m [SS]', calc.numDilations, 'ks', 37.328);
    add(`Zóna ${i+1}: ${zName}`, 'snfg.05.0014', 'Zostava vyprázdňovania 0-90bar', calc.numDrainAssemblies, 'ks', 34.47);
    add(`Zóna ${i+1}: ${zName}`, 'MVVMVGG1.2FG1.2FAK', 'Ventil ihlový G1/2F [SS]', calc.numNeedleValves, 'ks', 15);
    add(`Zóna ${i+1}: ${zName}`, 'MVEMKCS2X1PVCW', 'CYSY 2×1 PVC Biely', Math.ceil(calc.cysyLength), 'm', 0.367);
    add(`Zóna ${i+1}: ${zName}`, 'EKR000001481', 'Rozbočovacia krabica A1', calc.numJunctionBoxes, 'ks', 0.48);
    add(`Zóna ${i+1}: ${zName}`, 'ESV000001630', 'WAGO svorky 221-413', calc.numWago, 'ks', 0.38);
    if (zone.hydraulicHoseLength > 0) add(`Zóna ${i+1}: ${zName}`, 'snfg.004.0017', 'Hydraulická hadica DN25 1m', Math.ceil(zone.hydraulicHoseLength), 'm', 2.68);
    if (zone.hydraulicHoseConnectors > 0) add(`Zóna ${i+1}: ${zName}`, 'snfg.004.00016', 'Prepoj hydraulická hadica DN25', zone.hydraulicHoseConnectors, 'ks', 21.38);
    if (zone.controlType === 'Snímač') {
      add(`Zóna ${i+1}: ${zName}`, 'KDP000003519', 'Kábel snímač teploty/vlhkosti', Math.ceil(calc.supplyPipeLength), 'm', 0.352);
      add(`Zóna ${i+1}: ${zName}`, 'AS109R', 'Snímač teploty a vlhkosti RS485', 1, 'ks', 70.31);
    }
  });

  if (cadHasPipes) {
    bracketBOM.forEach(b => { const price = b.direction === 'racmet' ? 13.58 : 11.66; add('Držiaky', b.code, b.name, b.qty, 'ks', price); });
  }

  const installTechCost = (costInputs.installTechDays * costInputs.installTechCount + costInputs.installGreenhouseDays * costInputs.installGreenhouseCount + costInputs.diggingDays * costInputs.diggingCount + costInputs.commissioningDays * costInputs.commissioningCount) * 100;
  const dietsCost = (costInputs.installTechDays * costInputs.installTechCount + costInputs.installGreenhouseDays * costInputs.installGreenhouseCount + costInputs.diggingDays * costInputs.diggingCount + costInputs.commissioningDays * costInputs.commissioningCount) * 35;
  const accommodationCost = costInputs.accommodationNights * costInputs.accommodationTechs * 40;
  const salesTripsCost = (costInputs.salesTrips + costInputs.techTrips + costInputs.implTeamTrips) * 150;

  if (installTechCost > 0) add('Montáž', 'SANFOG_MONTAZ', 'Práca montáž', installTechCost / 100, 'dní', 100);
  if (dietsCost > 0) add('Montáž', 'SANFOG_DIETA', 'Diéty', dietsCost / 35, 'dní', 35);
  if (accommodationCost > 0) add('Montáž', 'SANFOG_UBYT', 'Ubytovanie', accommodationCost / 40, 'noc', 40);
  if (salesTripsCost > 0) add('Doprava', 'SANFOG_DOPRAVA', 'Doprava výjazdy', salesTripsCost / 150, 'výjazd', 150);
  add('Doprava', 'SANFOG_PREPRAVA', `Preprava tovaru (${project.country})`, 1, 'psch.', transpCost);
  add('Ostatné', 'SANFOG_PROJEKTO', 'Obhliadka + projektovanie', 1, 'psch.', 400);
  add('Ostatné', 'SANFOG_PM', 'Projektový manažér', 1, 'psch.', pmCost);
  add('Ostatné', 'SANFOG_MAT', 'Montážny materiál', 1, 'psch.', Number(costInputs.mountingMaterial) + Number(costInputs.mountingMaterialStation));
  add('Ostatné', 'SANFOG_COLNICA', 'Ďalšie náklady, colnica', 1, 'psch.', 1400);

  const processedBomLines = bomLines.map((l) => isNormist(l.code) && l.code !== 'NORMIST' ? { ...l, price: 0 } : l);
  const bomTotal = processedBomLines.reduce((s, l) => s + l.qty * l.price, 0);
  const normistLines = processedBomLines.filter((l) => isNormist(l.code));
  const attiLines = processedBomLines.filter((l) => !isNormist(l.code));

  const aggregatedNazliLines = (() => {
    const m = new Map<string, { code: string; name: string; qty: number; unit: string }>();
    processedBomLines.filter((l) => isNormist(l.code) && l.code !== 'NORMIST').forEach((nl) => {
      const ex = m.get(nl.code);
      ex ? (ex.qty += nl.qty) : m.set(nl.code, { code: nl.code, name: nl.name, qty: nl.qty, unit: nl.unit });
    });
    return Array.from(m.values());
  })();

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

  const printOrderNazli = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html><head><title>Order NAZLI – ${project.quoteNumber}</title><style>body{font-family:Arial;font-size:11px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:4px 6px}th{background:#1e3a5f;color:#fff}</style></head><body>`);
    w.document.write(`<h1>ORDER FORM – NOR ELEKTRONIK, Istanbul</h1><table style="margin-bottom:12px"><tr><td><b>SHIPPER:</b> Sanfog s.r.o.</td><td><b>CUSTOMER:</b> NOR ELEKTRONIK</td></tr><tr><td><b>DATE:</b> ${project.quoteDate}</td><td><b>REF:</b> ${project.quoteNumber}</td></tr></table>`);
    w.document.write('<table><thead><tr><th>#</th><th>CODE</th><th>DESCRIPTION</th><th>QTY</th><th>UNIT</th></tr></thead><tbody>');
    aggregatedNazliLines.forEach((nl, i) => w.document.write(`<tr><td>${i + 1}</td><td>${nl.code}</td><td>${nl.name}</td><td>${fmtN(nl.qty, 1)}</td><td>${nl.unit}</td></tr>`));
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
    const rows = attiLines.map((l, i) => ({ '#': i + 1, Sekcia: l.section, Kód: l.code, Popis: l.name, Qty: l.qty, MJ: l.unit, 'Cena/MJ': l.price, Celkom: +(l.qty * l.price).toFixed(2) }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'BOM Atti');
    XLSX.writeFile(wb, `BOM_Atti_${project.quoteNumber}.xlsx`);
  };

  return (
    <StepLayout stepNum={8} title="Generovanie výstupných dokumentov" subtitle="8A – Order Form pre NAZLI  ·  8B – BOM pre Attiho (OBERON)" canContinue={true}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card variant="info" title="8A — Order Form pre NAZLI (NORMIST)">
          <p className="text-sm text-gray-600 mb-4">Proforma faktúra pre NOR ELEKTRONIK Istanbul ({aggregatedNazliLines.length} kódov).</p>
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
          </div>
        </Card>
      </div>

      {!cadHasPipes && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 border-l-4 border-l-amber-400 rounded-r-lg text-sm text-amber-800">
          <strong>Držiaky neboli vypočítané</strong> – CAD výkres (krok 3G) neobsahuje žiadne potrubia.
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-bold text-gray-800">Náhľad BOM</h3>
          <div className="text-sm text-gray-500 flex gap-4">
            <span>Riadkov: <strong>{processedBomLines.length}</strong></span>
            <span className="text-blue-600">NORMIST: <strong>{normistLines.length}</strong></span>
            <span className="text-green-600">Atti: <strong>{attiLines.length}</strong></span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="bg-gray-50 text-gray-500"><th className="text-left p-3 w-1/4">Sekcia</th><th className="text-left p-3">Kód</th><th className="text-left p-3">Popis</th><th className="text-right p-3">Qty</th><th className="text-right p-3">MJ</th><th className="text-right p-3">Cena/MJ</th><th className="text-right p-3">Celkom</th><th className="text-center p-3">Dodávateľ</th></tr></thead>
            <tbody>
              {processedBomLines.map((line, i) => {
                const isNazliRef = isNormist(line.code) && line.code !== 'NORMIST';
                return (
                  <tr key={i} className={`border-t border-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="p-2 text-gray-400 text-xs">{line.section}</td>
                    <td className="p-2 font-mono text-xs text-blue-700">{line.code}</td>
                    <td className="p-2 text-gray-800">{line.name}</td>
                    <td className="p-2 text-right font-mono">{fmtN(line.qty, 1)}</td>
                    <td className="p-2 text-right text-gray-400">{line.unit}</td>
                    <td className="p-2 text-right text-gray-400">{isNazliRef ? '—' : `${fmtN(line.price, 2)} €`}</td>
                    <td className="p-2 text-right font-semibold text-gray-400">{isNazliRef ? '—' : `${fmtN(line.qty * line.price, 2)} €`}</td>
                    <td className="p-2 text-center">{isNormist(line.code) ? <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-semibold">NORMIST</span> : <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Atti</span>}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot><tr className="bg-green-50 border-t-2 border-green-200"><td colSpan={7} className="p-3 font-bold text-gray-800 text-sm">TOTAL NÁKLADY</td><td className="p-3 text-right font-bold text-green-700 text-base">{fmtE(bomTotal)}</td></tr></tfoot>
          </table>
        </div>
      </div>
    </StepLayout>
  );
}
