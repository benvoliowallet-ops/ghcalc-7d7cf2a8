import type { Project, GlobalParams, ZoneParams, ZoneCalc, CostInputs, CADDrawing } from '../types';
import { PUMP_TABLE, calcETNACapacity, selectMaxivarem, NOZZLE_BY_ORIFICE, detectConcurrentPipes } from './calculations';
import { getPipe10mmForSpacing, getStockPrice, getStockNameEn } from '../data/stockItems';

export interface BomSnapshot {
  project: Project;
  globalParams: GlobalParams;
  zones: ZoneParams[];
  zoneCalcs: ZoneCalc[];
  normistPrice: number;
  costInputs: CostInputs;
  uvSystemCode: string | null;
  ssFilter30: boolean;
  uvSystemNazli?: boolean;
  cad: CADDrawing;
  ropeOverrides: number[];
}

export interface BomLine {
  section: string;
  code: string;
  name: string;
  qty: number;
  unit: string;
  price: number;
}

export function buildBomLines(snap: BomSnapshot): BomLine[] {
  const {
    project, globalParams, zones, zoneCalcs, normistPrice,
    costInputs, uvSystemCode, ssFilter30, cad, ropeOverrides,
  } = snap;

  const lines: BomLine[] = [];

  function add(section: string, code: string, name: string, qty: number, unit: string, price: number) {
    if (qty > 0) lines.push({ section, code, name, qty, unit, price });
  }

  const totalFlowMlH = zoneCalcs.reduce((sum, c) => sum + (c?.zoneFlow ?? 0), 0);
  const totalFlowM1H = totalFlowMlH / 1000 / 1000;
  const etnaResult = calcETNACapacity(totalFlowM1H);
  if (etnaResult.capacityWarning) {
    console.warn(`[BOM] ETNA capacity warning: designFlow ${totalFlowM1H.toFixed(1)} m³/h exceeds max ETNA capacity (35 m³/h)`);
  }
  const maxivaremInfo = selectMaxivarem(totalFlowM1H, globalParams.osmoticWater);
  const osmoticSS = globalParams.osmoticWater;
  const N = globalParams.numberOfZones;
  const { bracketBOM } = detectConcurrentPipes(cad);
  const cadHasPipes = cad.segments.some(s => s.lineType === 'pipe');

  // ── System / Station ────────────────────────────────────────────────────────
  add('Balné', 'SNFG.00001', getStockNameEn('SNFG.00001'), 1, 'ks', getStockPrice('SNFG.00001'));
  if (normistPrice > 0) add('FOGSYSTEM NORMIST', 'NORMIST', `FOGSYSTEM NORMIST (${osmoticSS ? 'SS' : 'STD'})`, 1, 'ks', normistPrice);
  add('ETNA', etnaResult.pumpCode, `${etnaResult.pumpName} ${osmoticSS ? '[SS]' : '[ŠTANDARD]'}`, 1, 'ks', getStockPrice(etnaResult.pumpCode));
  add('ETNA', maxivaremInfo.code, maxivaremInfo.label, 1, 'ks', maxivaremInfo.price);
  add('ETNA', 'ETNA_ACC', getStockNameEn('ETNA_ACC'), 1, 'ks', getStockPrice('ETNA_ACC'));
  add('ETNA', 'ETNA_VODA', getStockNameEn('ETNA_VODA'), 1, 'ks', getStockPrice('ETNA_VODA'));
  add('ETNA', 'SNFG.TLK.001', getStockNameEn('SNFG.TLK.001'), 1, 'ks', getStockPrice('SNFG.TLK.001'));
  add('ETNA', 'ETNA_MONTAZ', getStockNameEn('ETNA_MONTAZ'), 1, 'hod', getStockPrice('ETNA_MONTAZ'));

  // ── Pump accessories (per zone) ─────────────────────────────────────────────
  add('Čerpadlo', '0204013A', getStockNameEn('0204013A'), N, 'ks', getStockPrice('0204013A'));
  add('Čerpadlo', '0104003-kit', getStockNameEn('0104003-kit'), N, 'ks', getStockPrice('0104003-kit'));
  add('Čerpadlo', '204091', getStockNameEn('204091'), N, 'ks', getStockPrice('204091'));
  add('Čerpadlo', '4072000024', getStockNameEn('4072000024'), N, 'ks', getStockPrice('4072000024'));
  add('Čerpadlo', '60.0525.00', getStockNameEn('60.0525.00'), N, 'ks', getStockPrice('60.0525.00'));
  add('Čerpadlo', 'snfg.06.0001', getStockNameEn('snfg.06.0001'), 1, 'ks', getStockPrice('snfg.06.0001'));

  // ── System extras ────────────────────────────────────────────────────────────
  add('Systém', 'TELTONIKA_GSM', getStockNameEn('TELTONIKA_GSM'), 1, 'ks', getStockPrice('TELTONIKA_GSM'));
  add('Systém', 'BPONG-005-P2PWE', getStockNameEn('BPONG-005-P2PWE'), 1, 'ks', getStockPrice('BPONG-005-P2PWE'));
  add('Systém', 'NOR EGE', getStockNameEn('NOR EGE'), N * 5, 'm', getStockPrice('NOR EGE'));
  add('Systém', 'NOR 204090', getStockNameEn('NOR 204090'), N, 'ks', getStockPrice('NOR 204090'));
  add('Systém', 'NORMIST_DANFOSS', getStockNameEn('NORMIST_DANFOSS'), 1, 'ks', getStockPrice('NORMIST_DANFOSS'));
  if (uvSystemCode) add('Systém', uvSystemCode, getStockNameEn(uvSystemCode), 1, 'ks', getStockPrice(uvSystemCode));
  if (ssFilter30) add('Systém', 'NORMIST_30SS_FILTER', getStockNameEn('NORMIST_30SS_FILTER'), 1, 'ks', getStockPrice('NORMIST_30SS_FILTER'));

  // ── Per-zone items ───────────────────────────────────────────────────────────
  zoneCalcs.forEach((calc, i) => {
    const zone = zones[i];
    if (!zone || !calc) return;
    const zName = zone.name;
    const sec = `Zóna ${i + 1}: ${zName}`;

    const flowLpm = calc.zoneFlow / 1000 / 60;
    const zonePump = PUMP_TABLE.find(p => p.maxFlow >= flowLpm);
    if (zonePump) add(sec, zonePump.code, zonePump.name, 1, 'ks', 0);

    const nCode = NOZZLE_BY_ORIFICE[zone.nozzleOrifice];
    add(sec, nCode, getStockNameEn(nCode), calc.numNozzles, 'ks', getStockPrice(nCode));
    add(sec, 'NOR 301188', getStockNameEn('NOR 301188'), calc.numSwivel, 'ks', getStockPrice('NOR 301188'));

    const pipe10mm = getPipe10mmForSpacing(zone.nozzleSpacing);
    add(sec, pipe10mm.code, pipe10mm.name, calc.numPipes10mmTotal, 'ks', pipe10mm.price);

    if (osmoticSS) {
      add(sec, 'NOR 0311002SS-180', getStockNameEn('NOR 0311002SS-180'), calc.numPipes10mmTotal + 1, 'ks', getStockPrice('NOR 0311002SS-180'));
    } else {
      add(sec, 'NOR 0311002-180', getStockNameEn('NOR 0311002-180'), calc.numPipes10mmTotal + 1, 'ks', getStockPrice('NOR 0311002-180'));
    }

    const endPlugQty = ((zone.connectionType ?? 'T-kus') === 'T-kus') ? calc.numEndPlug * 2 : calc.numEndPlug;
    if (osmoticSS) {
      add(sec, 'NOR 0311008SS', getStockNameEn('NOR 0311008SS'), endPlugQty, 'ks', getStockPrice('NOR 0311008SS'));
    } else {
      add(sec, '0311008', getStockNameEn('0311008'), endPlugQty, 'ks', getStockPrice('0311008'));
    }

    const ropeCode = globalParams.steelRope === 'SS_NEREZ' ? 'SVX_SS_NEREZ' : 'SVX 201143';
    const ropeQty = ropeOverrides[i] ?? calc.ropeLength;
    add(sec, ropeCode, getStockNameEn(ropeCode), ropeQty, 'm', getStockPrice(ropeCode));

    add(sec, 'MVUZTLN400MMAKNS', getStockNameEn('MVUZTLN400MMAKNS'), calc.numHangers, 'ks', getStockPrice('MVUZTLN400MMAKNS'));
    add(sec, 'Gripple Plus Medium', getStockNameEn('Gripple Plus Medium'), calc.numGripple, 'ks', getStockPrice('Gripple Plus Medium'));
    add(sec, 'NOR 201142', getStockNameEn('NOR 201142'), calc.numNozzleHangers, 'ks', getStockPrice('NOR 201142'));
    add(sec, 'NOR 201142M', getStockNameEn('NOR 201142M'), calc.numPipeHangers, 'ks', getStockPrice('NOR 201142M'));
    add(sec, 'ITALINOX', getStockNameEn('ITALINOX'), Math.ceil(calc.inoxPipeLength), 'm', getStockPrice('ITALINOX'));
    add(sec, '183022000', getStockNameEn('183022000'), calc.numInoxConnectors, 'ks', getStockPrice('183022000'));
    add(sec, '189102022', getStockNameEn('189102022'), calc.numTJunctions, 'ks', getStockPrice('189102022'));
    add(sec, 'snfg.05.0002', getStockNameEn('snfg.05.0002'), calc.numDilations, 'ks', getStockPrice('snfg.05.0002'));
    add(sec, 'snfg.05.0014', getStockNameEn('snfg.05.0014'), calc.numDrainAssemblies, 'ks', getStockPrice('snfg.05.0014'));
    if (calc.numDrainAssemblies > 0) {
      add(sec, 'snfg.004.002', getStockNameEn('snfg.004.002'), calc.numDrainAssemblies, 'ks', getStockPrice('snfg.004.002'));
    }

    // Prepoj na napájacie potrubie - rovný alebo T-kus
    if ((zone.connectionType ?? 'T-kus') === 'T-kus') {
      add(sec, '0013910012.02', getStockNameEn('0013910012.02'), 1, 'ks', getStockPrice('0013910012.02'));
    } else {
      add(sec, '0013910012.01', getStockNameEn('0013910012.01'), 1, 'ks', getStockPrice('0013910012.01'));
    }

    if (zone.hasMagnet) {
      add(sec, 'KOH000000606', getStockNameEn('KOH000000606'), Math.ceil(calc.cysyLength), 'm', getStockPrice('KOH000000606'));
    }

    add(sec, 'EKR000001481', getStockNameEn('EKR000001481'), calc.numJunctionBoxes, 'ks', getStockPrice('EKR000001481'));
    add(sec, 'ESV000001630', getStockNameEn('ESV000001630'), calc.numWago, 'ks', getStockPrice('ESV000001630'));

    if (zone.hydraulicHoseLength > 0) add(sec, 'snfg.004.0017', getStockNameEn('snfg.004.0017'), Math.ceil(zone.hydraulicHoseLength), 'm', getStockPrice('snfg.004.0017'));
    if (zone.hydraulicHoseConnectors > 0) add(sec, 'snfg.004.00016', getStockNameEn('snfg.004.00016'), zone.hydraulicHoseConnectors, 'ks', getStockPrice('snfg.004.00016'));

    if (zone.controlType === 'Snímač') {
      add(sec, 'KDP000003519', getStockNameEn('KDP000003519'), Math.ceil(calc.supplyPipeLength), 'm', getStockPrice('KDP000003519'));
      add(sec, 'AS109R', getStockNameEn('AS109R'), 1, 'ks', getStockPrice('AS109R'));
    }
  });

  // ── Bracket BOM (from CAD concurrent pipes) ─────────────────────────────────
  if (cadHasPipes) {
    bracketBOM.forEach(b => add('Držiaky', b.code, getStockNameEn(b.code), b.qty, 'ks', getStockPrice(b.code)));
  }

  // ── Installation & costs ─────────────────────────────────────────────────────
  const montazRate = getStockPrice('SANFOG_MONTAZ');
  const dietaRate = getStockPrice('SANFOG_DIETA');
  const dopravaRate = getStockPrice('SANFOG_DOPRAVA');

  const totalInstallDays =
    costInputs.installTechDays * costInputs.installTechCount +
    costInputs.installGreenhouseDays * costInputs.installGreenhouseCount +
    costInputs.diggingDays * costInputs.diggingCount +
    costInputs.commissioningDays * costInputs.commissioningCount;

  const installTechCost = totalInstallDays * montazRate;
  const dietsCost = totalInstallDays * dietaRate;
  const accommodationCost = costInputs.accommodationCost;
  const salesTripsCost = (costInputs.salesTrips + costInputs.techTrips + costInputs.implTeamTrips) * dopravaRate;

  if (installTechCost > 0) add('Montáž', 'SANFOG_MONTAZ', 'Práca montáž', installTechCost / montazRate, 'dní', montazRate);
  if (dietsCost > 0) add('Montáž', 'SANFOG_DIETA', 'Diéty', dietsCost / dietaRate, 'dní', dietaRate);
  if (accommodationCost > 0) add('Montáž', 'SANFOG_UBYT', 'Ubytovanie', 1, 'ks', accommodationCost);
  if (salesTripsCost > 0) add('Doprava', 'SANFOG_DOPRAVA', 'Doprava výjazdy', salesTripsCost / dopravaRate, 'výjazd', dopravaRate);

  const prepravaCode = project.country === 'CZ' ? 'SANFOG_PREPRAVA_CZ'
    : project.country === 'HU' ? 'SANFOG_PREPRAVA_HU'
    : 'SANFOG_PREPRAVA_SK';
  add('Doprava', prepravaCode, `Preprava tovaru (${project.country})`, 1, 'ks', getStockPrice(prepravaCode));

  add('Ostatné', 'SANFOG_PROJEKTO', getStockNameEn('SANFOG_PROJEKTO'), 1, 'ks', getStockPrice('SANFOG_PROJEKTO'));

  if (costInputs.projectArea <= 2) {
    add('Ostatné', 'SANFOG_PM_2Ha', getStockNameEn('SANFOG_PM_2Ha'), 1, 'ks', getStockPrice('SANFOG_PM_2Ha'));
  } else if (costInputs.projectArea <= 4) {
    add('Ostatné', 'SANFOG_PM_4Ha', getStockNameEn('SANFOG_PM_4Ha'), 1, 'ks', getStockPrice('SANFOG_PM_4Ha'));
  } else {
    add('Ostatné', 'SANFOG_PM_6Ha', getStockNameEn('SANFOG_PM_6Ha'), 1, 'ks', getStockPrice('SANFOG_PM_6Ha'));
  }

  add('Ostatné', 'SANFOG_MAT', getStockNameEn('SANFOG_MAT'), 1, 'ks', Number(costInputs.mountingMaterial) + Number(costInputs.mountingMaterialStation));
  add('Ostatné', 'SANFOG_COLNICA', getStockNameEn('SANFOG_COLNICA'), 1, 'ks', getStockPrice('SANFOG_COLNICA'));

  return lines;
}
