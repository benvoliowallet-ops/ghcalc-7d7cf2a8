import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ProjectState,
  Project,
  GlobalParams,
  ZoneParams,
  ZoneCalc,
  CADDrawing,
  CADSegment,
  CADSymbol,
  CostInputs,
  SavedProject,
} from '../types';
import { calcZone, generateQuoteNumber } from '../utils/calculations';

const defaultProject: Project = {
  id: crypto.randomUUID(),
  quoteNumber: generateQuoteNumber(),
  customerName: '',
  projectAddress: '',
  country: 'SK',
  quoteDate: new Date().toISOString().split('T')[0],
  contactPerson: '',
  phone: '',
  email: '',
};

const defaultGlobalParams: GlobalParams = {
  numberOfZones: 1,
  fogCapacity: 150,
  systemPressure: 70,
  pumpLocation: 'NÁVRH',
  osmoticWater: false,
  steelRope: 'SS_NEREZ',
};

const defaultZone: ZoneParams = {
  name: 'Zóna 1',
  length: 50,
  width: 8,
  height: 4,
  numNaves: 1,
  trellisPitch: 2.5,
  controlType: 'Snímač',
  hasMagnet: false,
  elevation: 0,
  elevationLength: 0,
  hydraulicHoseEnabled: false,
  hydraulicHoseLength: 0,
  hydraulicHoseConnectors: 0,
  connectionType: 'T-kus',
  nozzleOrifice: 0.25,
  nozzleFlow: 0.090,
  nozzleSpacing: 400,
};

const defaultCAD: CADDrawing = {
  zones: [],
  segments: [],
  symbols: [],
  scale: 10,
};

const defaultCostInputs: CostInputs = {
  installTechDays: 1,
  installTechCount: 2,
  installGreenhouseDays: 1,
  installGreenhouseCount: 2,
  diggingDays: 0,
  diggingCount: 0,
  commissioningDays: 1,
  commissioningCount: 1,
  inspectionFixed: 200,
  designFixed: 200,
  projectArea: 1,
  salesTrips: 1,
  techTrips: 2,
  implTeamTrips: 1,
  accommodationNights: 0,
  accommodationTechs: 0,
  mountingMaterial: 500,
  mountingMaterialStation: 500,
};

interface ProjectStore extends ProjectState {
  savedProjects: SavedProject[];
  saveCurrentProject: () => void;
  loadProject: (id: string) => void;
  deleteSavedProject: (id: string) => void;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateProject: (p: Partial<Project>) => void;
  updateGlobalParams: (p: Partial<GlobalParams>) => void;
  setZones: (zones: ZoneParams[]) => void;
  updateZone: (index: number, zone: Partial<ZoneParams>) => void;
  setActiveZone: (index: number) => void;
  recalcAllZones: () => void;
  addSegment: (seg: CADSegment) => void;
  removeSegment: (id: string) => void;
  addSymbol: (sym: CADSymbol) => void;
  removeSymbol: (id: string) => void;
  setCADData: (segments: CADSegment[], symbols: CADSymbol[]) => void;
  updateCADZonePosition: (zoneIndex: number, x: number, y: number) => void;
  setCADScale: (scale: number) => void;
  markDrawingComplete: (zoneIndex: number, complete: boolean) => void;
  initCADZones: () => void;
  updateCostInputs: (c: Partial<CostInputs>) => void;
  setNormistPrice: (price: number) => void;
  setUVSystemCode: (v: string | null) => void;
  setSSFilter: (v: boolean) => void;
  toggleCADZoneLock: (zoneIndex: number) => void;
  resetProject: () => void;
}

function captureSnapshot(s: ProjectStore): ProjectState {
  return {
    currentStep: s.currentStep,
    project: s.project,
    globalParams: s.globalParams,
    zones: s.zones,
    zoneCalcs: s.zoneCalcs,
    cad: s.cad,
    pumpSelection: s.pumpSelection,
    etnaConfig: s.etnaConfig,
    normistPrice: s.normistPrice,
    costInputs: s.costInputs,
    uvSystemCode: s.uvSystemCode,
    ssFilter30: s.ssFilter30,
    activeZoneIndex: s.activeZoneIndex,
  };
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      currentStep: 1,
      project: defaultProject,
      globalParams: defaultGlobalParams,
      zones: [defaultZone],
      zoneCalcs: [],
      cad: defaultCAD,
      pumpSelection: null,
      etnaConfig: {},
      normistPrice: 0,
      costInputs: defaultCostInputs,
      uvSystemCode: null,
      ssFilter30: false,
      activeZoneIndex: 0,
      savedProjects: [],

      saveCurrentProject: () => {
        const s = get();
        const snapshot = captureSnapshot(s);
        const entry: SavedProject = {
          id: s.project.id,
          savedAt: new Date().toISOString(),
          quoteNumber: s.project.quoteNumber,
          customerName: s.project.customerName,
          projectAddress: s.project.projectAddress,
          country: s.project.country,
          currentStep: s.currentStep,
          numZones: s.zones.length,
          snapshot,
        };
        set(prev => ({
          savedProjects: [entry, ...prev.savedProjects.filter(p => p.id !== entry.id)],
        }));
      },

      loadProject: (id) => {
        const saved = get().savedProjects.find(p => p.id === id);
        if (!saved) return;
        set({ ...saved.snapshot });
      },

      deleteSavedProject: (id) => {
        set(s => ({ savedProjects: s.savedProjects.filter(p => p.id !== id) }));
      },

      setStep: (step) => set({ currentStep: step }),
      nextStep: () => set(s => ({ currentStep: Math.min(s.currentStep + 1, 10) })),
      prevStep: () => set(s => ({ currentStep: Math.max(s.currentStep - 1, 1) })),

      updateProject: (p) => set(s => ({ project: { ...s.project, ...p } })),

      updateGlobalParams: (p) => {
        set(s => {
          const newParams = { ...s.globalParams, ...p };
          const count = p.numberOfZones ?? s.globalParams.numberOfZones;
          let zones = [...s.zones];
          while (zones.length < count) {
            zones.push({ ...defaultZone, name: `Zóna ${zones.length + 1}` });
          }
          zones = zones.slice(0, count);
          return { globalParams: newParams, zones };
        });
      },

      setZones: (zones) => set({ zones }),

      updateZone: (index, zone) => {
        set(s => {
          const zones = [...s.zones];
          zones[index] = { ...zones[index], ...zone };
          return { zones };
        });
        setTimeout(() => get().recalcAllZones(), 0);
      },

      setActiveZone: (index) => set({ activeZoneIndex: index }),

      recalcAllZones: () => {
        const { zones, globalParams, cad } = get();
        const zoneCalcs: ZoneCalc[] = zones.map((zone, i) =>
          calcZone(zone, globalParams, i, cad)
        );
        set({ zoneCalcs });
      },

      addSegment: (seg) => {
        set(s => ({ cad: { ...s.cad, segments: [...s.cad.segments, seg] } }));
        setTimeout(() => get().recalcAllZones(), 0);
      },

      removeSegment: (id) => {
        set(s => ({ cad: { ...s.cad, segments: s.cad.segments.filter(seg => seg.id !== id) } }));
        setTimeout(() => get().recalcAllZones(), 0);
      },

      addSymbol: (sym) =>
        set(s => ({ cad: { ...s.cad, symbols: [...s.cad.symbols, sym] } })),

      removeSymbol: (id) =>
        set(s => ({ cad: { ...s.cad, symbols: s.cad.symbols.filter(sym => sym.id !== id) } })),

      setCADData: (segments, symbols) => {
        set(s => ({ cad: { ...s.cad, segments, symbols } }));
        setTimeout(() => get().recalcAllZones(), 0);
      },

      updateCADZonePosition: (zoneIndex, x, y) =>
        set(s => ({
          cad: {
            ...s.cad,
            zones: s.cad.zones.map(z => z.zoneIndex === zoneIndex ? { ...z, x, y } : z),
          },
        })),

      setCADScale: (scale) => set(s => ({ cad: { ...s.cad, scale } })),

      markDrawingComplete: (zoneIndex, complete) =>
        set(s => ({
          zoneCalcs: s.zoneCalcs.map(zc =>
            zc.zoneIndex === zoneIndex ? { ...zc, drawingComplete: complete } : zc
          ),
        })),

      initCADZones: () => {
        const { zones, cad } = get();
        const PADDING = 40;
        const scale = 8;
        let offsetX = PADDING;
        const cadZones = zones.map((zone, i) => {
          const widthPx = zone.length * scale;
          const heightPx = zone.width * zone.numNaves * scale;
          const cadZone = { zoneIndex: i, x: offsetX, y: PADDING, width: widthPx, height: heightPx };
          offsetX += widthPx + PADDING;
          return cadZone;
        });
        set({ cad: { ...cad, zones: cadZones, scale } });
      },

      updateCostInputs: (c) => set(s => ({ costInputs: { ...s.costInputs, ...c } })),
      setNormistPrice: (price) => set({ normistPrice: price }),
      setUVSystemCode: (v) => set({ uvSystemCode: v }),
      setSSFilter: (v) => set({ ssFilter30: v }),

      toggleCADZoneLock: (zoneIndex) =>
        set(s => ({
          cad: {
            ...s.cad,
            zones: s.cad.zones.map(z =>
              z.zoneIndex === zoneIndex ? { ...z, locked: !z.locked } : z
            ),
          },
        })),

      resetProject: () =>
        set({
          currentStep: 1,
          project: {
            ...defaultProject,
            id: crypto.randomUUID(),
            quoteNumber: generateQuoteNumber(),
            quoteDate: new Date().toISOString().split('T')[0],
          },
          globalParams: defaultGlobalParams,
          zones: [defaultZone],
          zoneCalcs: [],
          cad: defaultCAD,
          pumpSelection: null,
          etnaConfig: {},
          normistPrice: 0,
          costInputs: defaultCostInputs,
          uvSystemCode: null,
          ssFilter30: false,
          activeZoneIndex: 0,
        }),
    }),
    { name: 'greenhouse-project' }
  )
);
