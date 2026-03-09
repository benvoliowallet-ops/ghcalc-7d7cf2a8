import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
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
  PreOrderState,
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
  accommodationCost: 0,
  mountingMaterial: 500,
  mountingMaterialStation: 500,
};

const defaultPreOrderState: PreOrderState = {
  pumpConnectorMeters: [3],
  etnaDistance: 8,
  etnaCustomCost: 200,
};

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface ProjectStore extends ProjectState {
  savedProjects: SavedProject[];
  saveStatus: SaveStatus;
  openProjectId: string | null;
  saveCurrentProject: () => void;
  setSavedProjects: (projects: SavedProject[]) => void;
  setSaveStatus: (status: SaveStatus) => void;
  loadProject: (id: string) => void;
  deleteSavedProject: (id: string) => Promise<void>;
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
  setUVSystemNazli: (v: boolean) => void;
  toggleCADZoneLock: (zoneIndex: number) => void;
  setRopeOverrides: (overrides: number[]) => void;
  updatePreOrderState: (s: Partial<PreOrderState>) => void;
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
    uvSystemNazli: s.uvSystemNazli,
    activeZoneIndex: s.activeZoneIndex,
    ropeOverrides: s.ropeOverrides,
    preOrderState: s.preOrderState,
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
      uvSystemNazli: false,
      activeZoneIndex: 0,
      savedProjects: [],
      ropeOverrides: [],
      preOrderState: defaultPreOrderState,
      saveStatus: 'idle' as const,
      openProjectId: null as string | null,

      setSavedProjects: (projects) => set({ savedProjects: projects }),
      setSaveStatus: (status) => set({ saveStatus: status }),

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
          ownerId: '',
          ownerName: '',
        };
        set(prev => ({
          savedProjects: [entry, ...prev.savedProjects.filter(p => p.id !== entry.id)],
        }));
      },

      loadProject: (id) => {
        const saved = get().savedProjects.find(p => p.id === id);
        if (!saved) return;
        set({
          ...saved.snapshot,
          openProjectId: id,
          // Ensure preOrderState exists for old snapshots without it
          preOrderState: saved.snapshot.preOrderState ?? defaultPreOrderState,
        });
      },

      // NC6 FIX: return a Promise so callers can handle errors, and optimistic
      // update is now done AFTER DB confirms success (or reverted on failure)
      deleteSavedProject: async (id) => {
        // Optimistic: remove from local state immediately
        const prev = get().savedProjects;
        set(s => ({ savedProjects: s.savedProjects.filter(p => p.id !== id) }));

        const { error } = await supabase.from('projects').delete().eq('id', id);
        if (error) {
          // Revert on failure — restore the project to the list
          console.error('[Projects] Delete error:', error.message);
          set({ savedProjects: prev });
          throw new Error(error.message);
        }
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
          // Resize preOrderState.pumpConnectorMeters to match zone count
          const meters = [...(s.preOrderState.pumpConnectorMeters ?? [])];
          while (meters.length < count) meters.push(3);
          const pumpConnectorMeters = meters.slice(0, count);
          return {
            globalParams: newParams,
            zones,
            preOrderState: { ...s.preOrderState, pumpConnectorMeters },
          };
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
      setUVSystemNazli: (v) => set({ uvSystemNazli: v }),
      setRopeOverrides: (overrides) => set({ ropeOverrides: overrides }),
      updatePreOrderState: (s) => set(prev => ({ preOrderState: { ...prev.preOrderState, ...s } })),

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
          uvSystemNazli: false,
          activeZoneIndex: 0,
          ropeOverrides: [],
          preOrderState: defaultPreOrderState,
        }),
    }),
    { name: 'greenhouse-project' }
  )
);
