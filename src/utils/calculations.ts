import type { ZoneParams, ZoneCalc, GlobalParams, CADDrawing, CADSegment, NozzleCombo, BracketBOMLine, ConcurrentInterval } from '../types';
import { NOZZLE_BY_ORIFICE } from '../data/stockItems';
export { NOZZLE_BY_ORIFICE };  // re-export for consumers

// ─── Nozzle Flow Table (l/min) ────────────────────────────────────────────────
export const NOZZLE_FLOW_LPM: Record<number, Record<number, number>> = {
  0.15: { 50: 0.043, 60: 0.047, 70: 0.050, 80: 0.058, 90: 0.064, 100: 0.068, 110: 0.072 },
  0.20: { 50: 0.063, 60: 0.071, 70: 0.075, 80: 0.081, 90: 0.085, 100: 0.091, 110: 0.097 },
  0.25: { 50: 0.077, 60: 0.087, 70: 0.085, 80: 0.092, 90: 0.103, 100: 0.111, 110: 0.117 },
  0.30: { 50: 0.091, 60: 0.102, 70: 0.105, 80: 0.116, 90: 0.122, 100: 0.132, 110: 0.142 },
};

export function getNozzleFlowLpm(orifice: number, pressureBar: number): number {
  const orificeData = NOZZLE_FLOW_LPM[orifice];
  if (!orificeData) return 0.090;
  const flow = orificeData[pressureBar];
  if (flow !== undefined) return flow;
  const pressures = Object.keys(orificeData).map(Number).sort((a, b) => a - b);
  const nearest = pressures.reduce((prev, curr) =>
    Math.abs(curr - pressureBar) < Math.abs(prev - pressureBar) ? curr : prev
  );
  return orificeData[nearest];
}

export function calcZone(
  zone: ZoneParams,
  globalParams: GlobalParams,
  zoneIndex: number,
  cad: CADDrawing
): ZoneCalc {
  const { length: L, width: S, numNaves: N, trellisPitch: Rkrat } = zone;

  const area = L * S * N;
  const zoneFlow = globalParams.fogCapacity * area;

  const WALL_OFFSET_M = 0.75;
  const nozzleSpacingM = zone.nozzleSpacing / 100;
  const effectiveLength = Math.max(0, L - 2 * WALL_OFFSET_M);
  const nozzlesPerNaveRaw = effectiveLength > 0 && nozzleSpacingM > 0
    ? Math.floor(effectiveLength / nozzleSpacingM) + 1
    : 0;
  const nozzlesPerNave = nozzlesPerNaveRaw % 2 === 0
    ? nozzlesPerNaveRaw
    : nozzlesPerNaveRaw + 1;
  const numNozzles = nozzlesPerNave * N;
  const numSwivel = N * 3;

  const numPipes10mmPerNave = Math.ceil(nozzlesPerNave / 2);
  const numPipes10mmTotal = numPipes10mmPerNave * N;
  const numFitting180 = Math.ceil(numNozzles / 2);
  const numEndPlug = N * 2;

  const ropeRaw = (L + 10) * N;
  const ropeLength = Math.ceil(ropeRaw / 500) * 500;
  const ropeWaste = ropeLength - ropeRaw;
  const numHangers = Math.floor(L / Rkrat) * N;
  const numGripple = N * 2;
  const numNozzleHangers = numNozzles;
  const L_pipe = numPipes10mmPerNave > 0 ? L / numPipes10mmPerNave : 0;
  const numPipeHangers = L_pipe <= 3.5 ? numPipes10mmTotal * 1 : numPipes10mmTotal * 2;

  const zoneSegments = cad.segments.filter(
    s => s.zoneIndex === zoneIndex && s.lineType === 'pipe'
  );
  const supplyPipeLength = calcTotalLength(zoneSegments, cad.scale);

  const elevationLength = zone.elevationLength ?? 0;
  const inoxPipeLength = supplyPipeLength + elevationLength;
  const numInoxConnectors = Math.ceil((inoxPipeLength / 6) * 1.1);
  const numTJunctions = N;

  const { bracketsTrellis, bracketsRacmet } = calcBrackets(zoneSegments, cad.scale, zone);

  const D_inner = 0.019;
  const A = Math.PI * (D_inner / 2) ** 2;
  const Q_m3s = zoneFlow / 1000 / 3600 / 1000;
  const velocity = Q_m3s / A;
  const lambda = 0.03;
  const rho = 1000;
  const pressureDrop = (lambda * (supplyPipeLength / D_inner) * (rho * velocity ** 2 / 2)) / 1e5;

  const dilationPoints: { x: number; y: number; type: 'bend' | '80m' }[] = [];
  let numDilations = zone.elevation * 2;
  for (let i = 0; i < zoneSegments.length; i++) {
    const seg = zoneSegments[i];
    const sdx = Math.abs(seg.end.x - seg.start.x);
    const sdy = Math.abs(seg.end.y - seg.start.y);
    const isHoriz = sdx >= sdy;
    const lengthM = Math.sqrt(sdx * sdx + sdy * sdy) / (cad.scale || 1);
    if (i > 0) {
      const prev = zoneSegments[i - 1];
      const pDx = Math.abs(prev.end.x - prev.start.x);
      const pDy = Math.abs(prev.end.y - prev.start.y);
      if (isHoriz !== (pDx >= pDy)) {
        numDilations += 1;
        dilationPoints.push({ x: seg.start.x, y: seg.start.y, type: 'bend' });
      }
    }
    const per80 = Math.floor(lengthM / 80);
    numDilations += per80;
    for (let j = 1; j <= per80; j++) {
      const t = (j * 80) / lengthM;
      dilationPoints.push({
        x: seg.start.x + (seg.end.x - seg.start.x) * t,
        y: seg.start.y + (seg.end.y - seg.start.y) * t,
        type: '80m',
      });
    }
  }

  const cableSegments = cad.segments.filter(
    s => s.zoneIndex === zoneIndex && s.lineType === 'cable_cysy'
  );
  const cysyLength = calcTotalLength(cableSegments, cad.scale);
  const numDrainAssemblies = 1;
  const numJunctionBoxes = numDrainAssemblies;
  const numWago = numDrainAssemblies * 3;
  const numNeedleValves = 1;
  const drawingComplete = cad.segments.filter(s => s.zoneIndex === zoneIndex).length > 0;

  return {
    zoneIndex,
    area,
    zoneFlow,
    numNozzles,
    nozzlesPerNave,
    numSwivel,
    numPipes10mm: numPipes10mmPerNave,
    numPipes10mmTotal,
    numFitting180,
    numEndPlug,
    ropeLength,
    ropeWaste,
    numHangers,
    numGripple,
    numNozzleHangers,
    numPipeHangers,
    bracketsTrellis,
    bracketsRacmet,
    inoxPipeLength,
    numInoxConnectors,
    numTJunctions,
    supplyPipeLength,
    velocity,
    pressureDrop,
    numDilations,
    dilationPoints,
    cysyLength,
    numJunctionBoxes,
    numWago,
    numDrainAssemblies,
    numNeedleValves,
    drawingComplete,
  };
}

function calcTotalLength(segments: CADSegment[], scale: number): number {
  if (scale === 0) return 0;
  return segments.reduce((sum, s) => {
    const dx = s.end.x - s.start.x;
    const dy = s.end.y - s.start.y;
    return sum + Math.sqrt(dx * dx + dy * dy) / scale;
  }, 0);
}

function calcBrackets(
  segments: CADSegment[],
  scale: number,
  _zone: ZoneParams
): { bracketsTrellis: number; bracketsRacmet: number } {
  let bracketsTrellis = 0;
  let bracketsRacmet = 0;
  if (scale === 0) return { bracketsTrellis, bracketsRacmet };
  for (const seg of segments) {
    const dx = Math.abs(seg.end.x - seg.start.x);
    const dy = Math.abs(seg.end.y - seg.start.y);
    const lengthM = Math.sqrt(dx * dx + dy * dy) / scale;
    const isAlongLength = dx >= dy;
    if (isAlongLength) {
      bracketsRacmet += Math.ceil(lengthM / 2.5);
    } else {
      bracketsTrellis += Math.ceil(lengthM / 2.66);
    }
  }
  return { bracketsTrellis, bracketsRacmet };
}

export interface PumpOption {
  code: string;
  name: string;
  maxFlow: number;
  pressure: number;
}

export const PUMP_TABLE: PumpOption[] = [
  { code: 'NORMIST_PUMP_AR50',  name: 'AR50 with Control Unit PLC TOUCH SCREEN',  maxFlow: 50,  pressure: 70 },
  { code: 'NORMIST_PUMP_AR60',  name: 'AR60 with Control Unit PLC TOUCH SCREEN',  maxFlow: 60,  pressure: 70 },
  { code: 'NORMIST_PUMP_AR70',  name: 'AR70 with Control Unit PLC TOUCH SCREEN',  maxFlow: 70,  pressure: 70 },
  { code: 'NORMIST_PUMP_AR100', name: 'AR100 with Control Unit PLC TOUCH SCREEN', maxFlow: 100, pressure: 70 },
];

export function selectPump(zoneFlowMlH: number): PumpOption | null {
  const lpm = zoneFlowMlH / 1000 / 60;
  return PUMP_TABLE.find(p => p.maxFlow >= lpm) ?? null;
}

export function calcETNACapacity(totalFlowMlH: number): number {
  return (totalFlowMlH / 1000 / 1000) * 1.5;
}

export function getTransportCost(country: 'SK' | 'CZ' | 'HU'): number {
  return country === 'HU' ? 750 : 450;
}

export function getPMCost(area: number): number {
  if (area <= 2) return 300;
  if (area <= 4) return 600;
  return 900;
}

export function bracketPipeCount(nPipes: number): 2 | 4 | 6 {
  if (nPipes <= 2) return 2;
  if (nPipes <= 4) return 4;
  return 6;
}

export function getTrellisBracketCode(nPipes: number): string {
  switch (bracketPipeCount(nPipes)) {
    case 2: return 'snfg.05.0005';
    case 4: return 'snfg.05.0006';
    case 6: return 'snfg.05.0018';
  }
}

export function getRacmetBracketCode(nPipes: number): string {
  switch (bracketPipeCount(nPipes)) {
    case 2: return 'snfg.05.0008';
    case 4: return 'snfg.05.0010';
    case 6: return 'snfg.05.0012';
  }
}

const PARALLEL_TOLERANCE_PX = 5;

interface _PipeRange { coord: number; min: number; max: number; }

function _groupByCoord(items: _PipeRange[]): _PipeRange[][] {
  if (!items.length) return [];
  const sorted = [...items].sort((a, b) => a.coord - b.coord);
  const groups: _PipeRange[][] = [[sorted[0]]];
  for (let i = 1; i < sorted.length; i++) {
    const g = groups[groups.length - 1];
    if (Math.abs(sorted[i].coord - g[0].coord) <= PARALLEL_TOLERANCE_PX) {
      g.push(sorted[i]);
    } else {
      groups.push([sorted[i]]);
    }
  }
  return groups;
}

function _sweepLine(ranges: [number, number][]): { start: number; end: number; count: number }[] {
  if (!ranges.length) return [];
  type Ev = { x: number; delta: number };
  const events: Ev[] = [];
  for (const [a, b] of ranges) {
    if (a >= b) continue;
    events.push({ x: a, delta: +1 }, { x: b, delta: -1 });
  }
  events.sort((a, b) => a.x - b.x || b.delta - a.delta);
  const result: { start: number; end: number; count: number }[] = [];
  let count = 0;
  let segStart = 0;
  for (const ev of events) {
    if (count > 0 && ev.x > segStart) {
      result.push({ start: segStart, end: ev.x, count });
    }
    count += ev.delta;
    segStart = ev.x;
  }
  return result.filter(r => r.count > 0 && r.end > r.start);
}

export function detectConcurrentPipes(cad: CADDrawing): {
  bracketBOM: BracketBOMLine[];
  intervals: ConcurrentInterval[];
} {
  const scale = cad.scale || 8;
  const pipeSegs = cad.segments.filter(s => s.lineType === 'pipe');

  const hRanges: _PipeRange[] = [];
  const vRanges: _PipeRange[] = [];

  for (const seg of pipeSegs) {
    const dx = Math.abs(seg.end.x - seg.start.x);
    const dy = Math.abs(seg.end.y - seg.start.y);
    const avgCoordH = (seg.start.y + seg.end.y) / 2;
    const avgCoordV = (seg.start.x + seg.end.x) / 2;
    if (dx >= dy) {
      hRanges.push({ coord: avgCoordH, min: Math.min(seg.start.x, seg.end.x), max: Math.max(seg.start.x, seg.end.x) });
    } else {
      vRanges.push({ coord: avgCoordV, min: Math.min(seg.start.y, seg.end.y), max: Math.max(seg.start.y, seg.end.y) });
    }
  }

  const bomAcc: Record<string, { qty: number; slots: 2 | 4 | 6; direction: 'trellis' | 'racmet'; name: string }> = {};
  const outIntervals: ConcurrentInterval[] = [];

  const accBOM = (code: string, qty: number, slots: 2 | 4 | 6, dir: 'trellis' | 'racmet', name: string) => {
    if (qty <= 0) return;
    if (!bomAcc[code]) bomAcc[code] = { qty: 0, slots, direction: dir, name };
    bomAcc[code].qty += qty;
  };

  for (const group of _groupByCoord(hRanges)) {
    const axisCoord = group.reduce((s, g) => s + g.coord, 0) / group.length;
    for (const iv of _sweepLine(group.map(g => [g.min, g.max] as [number, number]))) {
      const lenM = (iv.end - iv.start) / scale;
      const slots = bracketPipeCount(iv.count);
      const code = getRacmetBracketCode(iv.count);
      accBOM(code, Math.ceil(lenM / 2.5), slots, 'racmet', `RACMET drziak ${slots} vedení`);
      if (iv.count > 1) outIntervals.push({ axisCoord, start: iv.start, end: iv.end, count: iv.count, direction: 'H' });
    }
  }

  for (const group of _groupByCoord(vRanges)) {
    const axisCoord = group.reduce((s, g) => s + g.coord, 0) / group.length;
    for (const iv of _sweepLine(group.map(g => [g.min, g.max] as [number, number]))) {
      const lenM = (iv.end - iv.start) / scale;
      const slots = bracketPipeCount(iv.count);
      const code = getTrellisBracketCode(iv.count);
      accBOM(code, Math.ceil(lenM / 2.66), slots, 'trellis', `Drziak kratovnica ${slots} vedení`);
      if (iv.count > 1) outIntervals.push({ axisCoord, start: iv.start, end: iv.end, count: iv.count, direction: 'V' });
    }
  }

  const bracketBOM: BracketBOMLine[] = Object.entries(bomAcc).map(([code, v]) => ({
    code,
    name: v.name,
    qty: v.qty,
    slots: v.slots,
    direction: v.direction,
  }));

  return { bracketBOM, intervals: outIntervals };
}

export function generateQuoteNumber(): string {
  const year = new Date().getFullYear().toString().slice(2);
  const seq = String(Math.floor(Math.random() * 9000) + 1000);
  return `PP-${year}${seq}`;
}

export function fmtN(n: number, decimals = 0): string {
  return n.toLocaleString('sk-SK', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function fmtE(n: number): string {
  return `${fmtN(n, 2)} €`;
}

export function fmtM(n: number): string {
  return `${fmtN(n, 1)} m`;
}

const COMBO_SPACINGS = [200, 250, 300, 350, 400, 450, 500] as const;
const COMBO_PRESSURES = [70, 80, 90] as const;
const COMBO_ORIFICES: Array<0.15 | 0.20 | 0.25 | 0.30> = [0.15, 0.20, 0.25, 0.30];

export function generateNozzleCombos(zone: ZoneParams, globalParams: GlobalParams): NozzleCombo[] {
  const { length: L, width: S, numNaves: N } = zone;
  const qRequired = globalParams.fogCapacity * L * S * N;
  const WALL_OFFSET_M = 0.75;
  const effectiveLength = Math.max(0, L - 2 * WALL_OFFSET_M);
  const combos: NozzleCombo[] = [];

  for (const pressure of COMBO_PRESSURES) {
    for (const orifice of COMBO_ORIFICES) {
      for (const spacingCm of COMBO_SPACINGS) {
        const spacingM = spacingCm / 100;
        const nozzlesPerNave = effectiveLength > 0 && spacingM > 0
          ? Math.floor(effectiveLength / spacingM) + 1
          : 0;
        const numNozzles = nozzlesPerNave * N;
        const qLpm = NOZZLE_FLOW_LPM[orifice]?.[pressure] ?? 0;
        const qActualMlH = numNozzles * qLpm * 60 * 1000;
        if (qActualMlH >= qRequired) {
          combos.push({
            orifice,
            spacingCm,
            numNozzles,
            qActualMlH,
            nozzleCode: NOZZLE_BY_ORIFICE[orifice],
            coveragePct: Math.round((qActualMlH / qRequired) * 100),
            pressure,
          });
        }
      }
    }
  }
  return combos;
}
