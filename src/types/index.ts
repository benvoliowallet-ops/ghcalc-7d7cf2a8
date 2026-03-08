// ─── Stock Item ──────────────────────────────────────────────────────────────
export interface StockItem {
  code: string;
  name: string;
  additionalText: string;
  price: number;
  group: string;
  supplier?: string;
}

// ─── Bracket BOM (from concurrent-pipe CAD analysis) ─────────────────────────
export interface BracketBOMLine {
  code: string;
  name: string;
  qty: number;
  slots: 2 | 4 | 6;
  direction: 'trellis' | 'racmet';
}

export interface ConcurrentInterval {
  axisCoord: number;
  start: number;
  end: number;
  count: number;
  direction: 'H' | 'V';
}

// ─── Nozzle Combination ───────────────────────────────────────────────────────
export interface NozzleCombo {
  orifice: 0.15 | 0.20 | 0.25 | 0.30;
  nozzleCode: string;
  spacingCm: number;
  numNozzles: number;
  qActualMlH: number;
  coveragePct: number;
  pressure: number;
}

// ─── Project ─────────────────────────────────────────────────────────────────
export interface Project {
  id: string;
  quoteNumber: string;
  customerName: string;
  projectAddress: string;
  country: 'SK' | 'CZ' | 'HU';
  quoteDate: string;
  contactPerson: string;
  phone: string;
  email: string;
}

// ─── Global Parameters ───────────────────────────────────────────────────────
export interface GlobalParams {
  numberOfZones: number;
  fogCapacity: number;
  systemPressure: number;
  pumpLocation: 'POTVRDENÉ' | 'NÁVRH';
  osmoticWater: boolean;
  steelRope: 'SS_NEREZ' | 'OCEĽ';
}

// ─── Zone Parameters ─────────────────────────────────────────────────────────
export interface ZoneParams {
  name: string;
  length: number;
  width: number;
  height: number;
  numNaves: number;
  trellisPitch: number;
  controlType: 'Snímač' | 'Priva';
  hasMagnet: boolean;
  elevation: number;
  elevationLength: number;
  hydraulicHoseEnabled: boolean;
  hydraulicHoseLength: number;
  hydraulicHoseConnectors: number;
  connectionType: 'T-kus' | 'rovny-spoj';
  nozzleOrifice: 0.15 | 0.20 | 0.25 | 0.30;
  nozzleFlow: number;
  nozzleSpacing: 200 | 250 | 300 | 350 | 400 | 450 | 500;
}

// ─── Zone Calculations ───────────────────────────────────────────────────────
export interface ZoneCalc {
  zoneIndex: number;
  area: number;
  zoneFlow: number;
  numNozzles: number;
  nozzlesPerNave: number;
  numSwivel: number;
  numPipes10mm: number;
  numPipes10mmTotal: number;
  numFitting180: number;
  numEndPlug: number;
  ropeLength: number;
  ropeWaste: number;
  numHangers: number;
  numGripple: number;
  numNozzleHangers: number;
  numPipeHangers: number;
  bracketsTrellis: number;
  bracketsRacmet: number;
  inoxPipeLength: number;
  numInoxConnectors: number;
  numTJunctions: number;
  supplyPipeLength: number;
  velocity: number;
  pressureDrop: number;
  numDilations: number;
  dilationPoints: { x: number; y: number; type: 'bend' | '80m' }[];
  cysyLength: number;
  numJunctionBoxes: number;
  numWago: number;
  numDrainAssemblies: number;
  numNeedleValves: number;
  drawingComplete: boolean;
}

// ─── CAD Drawing ─────────────────────────────────────────────────────────────
export type LineType = 'pipe' | 'cable_cysy' | 'cable_ftp';

export interface CADPoint {
  x: number;
  y: number;
}

export interface CADSegment {
  id: string;
  zoneIndex: number;
  lineType: LineType;
  start: CADPoint;
  end: CADPoint;
}

export interface CADZone {
  zoneIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  locked?: boolean;
}

export interface CADSymbol {
  id: string;
  type: 'pump' | 'drain_magnet' | 'sensor';
  x: number;
  y: number;
  zoneIndex?: number;
}

export interface CADDrawing {
  zones: CADZone[];
  segments: CADSegment[];
  symbols: CADSymbol[];
  scale: number;
}

// ─── Pump ────────────────────────────────────────────────────────────────────
export interface PumpSelection {
  code: string;
  name: string;
  quantity: number;
  totalFlow: number;
}

// ─── ETNA Station ────────────────────────────────────────────────────────────
export interface ETNAConfig {
  capacityM3h: number;
  maxivarem: string;
  maxivareVariant: 'SS' | 'STANDARD';
  etnaFilter: string;
  etnaFilterVariant: 'SS' | 'STANDARD';
  normistPrice: number;
  etnaAccessoryDistance: number;
  etnaAccessoryCost: number;
}

// ─── Costs ───────────────────────────────────────────────────────────────────
export interface CostInputs {
  installTechDays: number;
  installTechCount: number;
  installGreenhouseDays: number;
  installGreenhouseCount: number;
  diggingDays: number;
  diggingCount: number;
  commissioningDays: number;
  commissioningCount: number;
  inspectionFixed: number;
  designFixed: number;
  projectArea: number;
  salesTrips: number;
  techTrips: number;
  implTeamTrips: number;
  accommodationNights: number;
  accommodationTechs: number;
  mountingMaterial: 500 | 750 | 1000 | 1500;
  mountingMaterialStation: 500 | 750 | 1000 | 1500;
}

// ─── Saved Project (Dashboard) ───────────────────────────────────────────────
export interface SavedProject {
  id: string;
  savedAt: string;
  quoteNumber: string;
  customerName: string;
  projectAddress: string;
  country: string;
  currentStep: number;
  numZones: number;
  snapshot: ProjectState;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  passwordHash: string;
  createdAt: string;
}

export interface Invitation {
  code: string;
  email: string;
  role: 'admin' | 'user';
  createdBy: string;
  createdAt: string;
  expiresAt: string;
  usedAt?: string;
  usedBy?: string;
}

// ─── Change Log ───────────────────────────────────────────────────────────────
export interface ChangeLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: 'create' | 'update' | 'delete';
  itemCode: string;
  itemName: string;
  before?: Partial<StockItem>;
  after?: Partial<StockItem>;
}

// ─── Full Project State ───────────────────────────────────────────────────────
export interface ProjectState {
  currentStep: number;
  project: Project;
  globalParams: GlobalParams;
  zones: ZoneParams[];
  zoneCalcs: ZoneCalc[];
  cad: CADDrawing;
  pumpSelection: PumpSelection | null;
  etnaConfig: Partial<ETNAConfig>;
  normistPrice: number;
  costInputs: CostInputs;
  uvSystemCode: string | null;
  ssFilter30: boolean;
  activeZoneIndex: number;
}
