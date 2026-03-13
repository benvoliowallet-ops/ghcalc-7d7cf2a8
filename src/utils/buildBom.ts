import type { Project, GlobalParams, ZoneParams, ZoneCalc, CostInputs, CADDrawing } from '../types';
import { PUMP_TABLE, calcETNACapacity, selectMaxivarem, NOZZLE_BY_ORIFICE, detectConcurrentPipes } from './calculations';
import { getPipe10mmForSpacing, getStockPrice } from '../data/stockItems';

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
  add('Balné', 'SNFG.00001', 'Balné', 1, 'ks', getStockPrice('SNFG.00001'));
  if (normistPrice > 0) add('FOGSYSTEM NORMIST', 'NORMIST', `FOGSYSTEM NORMIST (${osmoticSS ? 'SS' : 'STD'})`, 1, 'ks', normistPrice);
  add('ETNA', etnaResult.pumpCode, `${etnaResult.pumpName} ${osmoticSS ? '[SS]' : '[ŠTANDARD]'}`, 1, 'ks', getStockPrice(etnaResult.pumpCode));
  add('ETNA', maxivaremInfo.code, maxivaremInfo.label, 1, 'ks', maxivaremInfo.price);
  add('ETNA', 'ETNA_ACC', 'Príslušenstvo k ETNA-NOR (≤10m)', 1, 'ks', getStockPrice('ETNA_ACC'));
  add('ETNA', 'ETNA_VODA', 'Vodoinstalačný materiál ETNA-NOR', 1, 'ks', getStockPrice('ETNA_VODA'));
  add('ETNA', 'SNFG.TLK.001', 'Trojcestná armatúra', 1, 'ks', getStockPrice('SNFG.TLK.001'));
  add('ETNA', 'ETNA_MONTAZ', 'Montáž ETNA', 1, 'hod', getStockPrice('ETNA_MONTAZ'));

  // ── Pump accessories (per zone) ─────────────────────────────────────────────
  add('Čerpadlo', '0204013A', 'Solenoid Valve Kit 70 Bar', N, 'ks', getStockPrice('0204013A'));
  add('Čerpadlo', '0104003-kit', 'Pressure Switch Kit', N, 'ks', getStockPrice('0104003-kit'));
  add('Čerpadlo', '204091', 'Keller Pressure Transmitter 0/160 Bar', N, 'ks', getStockPrice('204091'));
  add('Čerpadlo', '4072000024', 'Bypass ventil VRT100-100LPM@170bar', N, 'ks', getStockPrice('4072000024'));
  add('Čerpadlo', '60.0525.00', 'Poistný ventil VS220 G3/8F', N, 'ks', getStockPrice('60.0525.00'));
  add('Čerpadlo', 'snfg.06.0001', 'Prepoj čerpadlo → hl. vedenie DN25 3m [SS]', 1, 'ks', getStockPrice('snfg.06.0001'));

  // ── System extras ────────────────────────────────────────────────────────────
  add('Systém', 'TELTONIKA_GSM', 'Teltonika GSM brána', 1, 'ks', getStockPrice('TELTONIKA_GSM'));
  add('Systém', 'BPONG-005-P2PWE', 'Náhradný rukávový filter 5 mic', 1, 'ks', getStockPrice('BPONG-005-P2PWE'));
  add('Systém', 'NOR EGE', '1¼" EGE 7 nízkotlaková hadica', N * 5, 'm', getStockPrice('NOR EGE'));
  add('Systém', 'NOR 204090', 'Keller snímač tlaku 10bar', N, 'ks', getStockPrice('NOR 204090'));
  add('Systém', 'NORMIST_DANFOSS', 'DANFOSS Drive', 1, 'ks', getStockPrice('NORMIST_DANFOSS'));
  if (uvSystemCode) add('Systém', uvSystemCode, 'UV System', 1, 'ks', getStockPrice(uvSystemCode));
  if (ssFilter30) add('Systém', 'NORMIST_30SS_FILTER', 'SS Filter 30" Unit', 1, 'ks', getStockPrice('NORMIST_30SS_FILTER'));

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
    add(sec, nCode, `Tryska D${zone.nozzleOrifice}mm AK SS`, calc.numNozzles, 'ks', getStockPrice(nCode));
    add(sec, 'NOR 301188', 'Swivel adaptér', calc.numSwivel, 'ks', getStockPrice('NOR 301188'));

    const pipe10mm = getPipe10mmForSpacing(zone.nozzleSpacing);
    add(sec, pipe10mm.code, pipe10mm.name, calc.numPipes10mmTotal, 'ks', pipe10mm.price);

    if (osmoticSS) {
      add(sec, 'NOR 0311002SS-180', 'Fitting SS 180°', calc.numPipes10mmTotal + 1, 'ks', getStockPrice('NOR 0311002SS-180'));
    } else {
      add(sec, 'NOR 0311002-180', 'Fitting Ni 180°', calc.numPipes10mmTotal + 1, 'ks', getStockPrice('NOR 0311002-180'));
    }

    const endPlugQty = (zone.connectionType === 'T-kus') ? calc.numEndPlug * 2 : calc.numEndPlug;
    if (osmoticSS) {
      add(sec, 'NOR 0311008SS', 'End plug 10mm SS', endPlugQty, 'ks', getStockPrice('NOR 0311008SS'));
    } else {
      add(sec, '0311008', 'End plug 10mm Ni', endPlugQty, 'ks', getStockPrice('0311008'));
    }

    const ropeCode = globalParams.steelRope === 'SS_NEREZ' ? 'SVX_SS_NEREZ' : 'SVX 201143';
    const ropeName = globalParams.steelRope === 'SS_NEREZ' ? 'Nerezové lano 3mm' : 'Oceľové lano 3mm';
    const ropeQty = ropeOverrides[i] ?? calc.ropeLength;
    add(sec, ropeCode, ropeName, ropeQty, 'm', getStockPrice(ropeCode));

    add(sec, 'MVUZTLN400MMAKNS', 'Závesný diel 400mm AK NS', calc.numHangers, 'ks', getStockPrice('MVUZTLN400MMAKNS'));
    add(sec, 'Gripple Plus Medium', 'GRIPPLE stredný', calc.numGripple, 'ks', getStockPrice('Gripple Plus Medium'));
    add(sec, 'NORMIST 201142', 'Záves drziak trysky D10', calc.numNozzleHangers, 'ks', getStockPrice('NORMIST 201142'));
    add(sec, 'NORMIST 201142M', 'Záves stred rúr D10', calc.numPipeHangers, 'ks', getStockPrice('NORMIST 201142M'));
    add(sec, 'ITALINOX', 'Trubka A304 TIG 22×1,5 [SS]', Math.ceil(calc.inoxPipeLength), 'm', getStockPrice('ITALINOX'));
    add(sec, '183022000', 'VT Spojka P22F AK [SS]', calc.numInoxConnectors, 'ks', getStockPrice('183022000'));
    add(sec, '189102022', 'VT T-kus P22F G1/2F P22F AK [SS]', calc.numTJunctions, 'ks', getStockPrice('189102022'));
    add(sec, 'snfg.05.0002', 'Dilatácia hydraulická DN25 2m [SS]', calc.numDilations, 'ks', getStockPrice('snfg.05.0002'));
    add(sec, 'snfg.05.0014', 'Zostava vyprázdňovania 0-90bar', calc.numDrainAssemblies, 'ks', getStockPrice('snfg.05.0014'));
    if (calc.numDrainAssemblies > 0) {
      add(sec, 'snfg.004.002', '1/2" BSP vnútorný závit, vysokotlakový ihlový ventil SS 304', calc.numDrainAssemblies, 'ks', getStockPrice('snfg.004.002'));
    }

    // Prepoj na napájacie potrubie - rovný alebo T-kus
    if (zone.connectionType === 'T-kus') {
      add(sec, '0013910012.02', 'Prepoj hl. vedenie → T-kus (compressed)', 1, 'ks', getStockPrice('0013910012.02'));
    } else {
      add(sec, '0013910012.01', 'Prepoj hl. vedenie → rovný spoj (compressed)', 1, 'ks', getStockPrice('0013910012.01'));
    }
    // CYSY kábel - nahradzuje MVEMKCS2X1PVCW
    if (zone.hasMagnet) {
      add(sec, 'KOH000000606', 'Kábel H05VV-F 2x1 PVC biely', Math.ceil(calc.cysyLength), 'm', getStockPrice('KOH000000606'));
    }

    add(sec, 'EKR000001481', 'Rozbočovacia krabica A1', calc.numJunctionBoxes, 'ks', getStockPrice('EKR000001481'));
    add(sec, 'ESV000001630', 'WAGO svorky 221-413', calc.numWago, 'ks', getStockPrice('ESV000001630'));

    if (zone.hydraulicHoseLength > 0) add(sec, 'snfg.004.0017', 'Hydraulická hadica DN25 1m', Math.ceil(zone.hydraulicHoseLength), 'm', getStockPrice('snfg.004.0017'));
    if (zone.hydraulicHoseConnectors > 0) add(sec, 'snfg.004.00016', 'Prepoj hydraulická hadica DN25', zone.hydraulicHoseConnectors, 'ks', getStockPrice('snfg.004.00016'));

    if (zone.controlType === 'Snímač') {
      add(sec, 'KDP000003519', 'Kábel snímač teploty/vlhkosti', Math.ceil(calc.supplyPipeLength), 'm', getStockPrice('KDP000003519'));
      add(sec, 'AS109R', 'Snímač teploty a vlhkosti RS485', 1, 'ks', getStockPrice('AS109R'));
    }
  });

  // ── Bracket BOM (from CAD concurrent pipes) ─────────────────────────────────
  if (cadHasPipes) {
    bracketBOM.forEach(b => add('Držiaky', b.code, b.name, b.qty, 'ks', getStockPrice(b.code)));
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

  add('Ostatné', 'SANFOG_PROJEKTO', 'Obhliadka + projektovanie', 1, 'ks', getStockPrice('SANFOG_PROJEKTO'));

  if (costInputs.projectArea <= 2) {
    add('Ostatné', 'SANFOG_PM_2Ha', 'Projektový manažér ≤2Ha', 1, 'ks', getStockPrice('SANFOG_PM_2Ha'));
  } else if (costInputs.projectArea <= 4) {
    add('Ostatné', 'SANFOG_PM_4Ha', 'Projektový manažér ≤4Ha', 1, 'ks', getStockPrice('SANFOG_PM_4Ha'));
  } else {
    add('Ostatné', 'SANFOG_PM_6Ha', 'Projektový manažér >4Ha', 1, 'ks', getStockPrice('SANFOG_PM_6Ha'));
  }

  add('Ostatné', 'SANFOG_MAT', 'Montážny materiál', 1, 'ks', Number(costInputs.mountingMaterial) + Number(costInputs.mountingMaterialStation));
  add('Ostatné', 'SANFOG_COLNICA', 'Ďalšie náklady, colnica', 1, 'ks', getStockPrice('SANFOG_COLNICA'));

  return lines;
}
