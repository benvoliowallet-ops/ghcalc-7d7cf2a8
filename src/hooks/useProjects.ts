import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProjectStore } from '../store/projectStore';
import { useAuthStore } from '../store/authStore';
import type { SavedProject, ProjectState } from '../types';

/** Loads all projects for the current user from the DB into the store */
export function useLoadProjects() {
  const currentUserId = useAuthStore((s) => s.currentUser?.id);
  const setSavedProjects = useProjectStore((s) => s.setSavedProjects);

  // Stable ref so the async callback always uses the latest setter without re-triggering the effect
  const setSavedProjectsRef = useRef(setSavedProjects);
  setSavedProjectsRef.current = setSavedProjects;

  // Track which userId we already loaded for — prevents re-fetch on object reference churn
  const loadedForRef = useRef<string | null>(null);

  useEffect(() => {
    if (!currentUserId) return;
    if (loadedForRef.current === currentUserId) return;
    loadedForRef.current = currentUserId;

    const loadProjects = async () => {
      const { data: projects, error } = await supabase
        .from('projects')
        .select('id, quote_number, customer_name, project_address, country, current_step, num_zones, snapshot, saved_at, owner_id, status')
        .order('saved_at', { ascending: false });

      if (error) {
        console.error('[Projects] Load error:', error.message);
        return;
      }
      if (!projects || projects.length === 0) {
        setSavedProjectsRef.current([]);
        return;
      }

      // Fetch profiles for all unique owner_ids in a single call
      const ownerIds = [...new Set(projects.map((p) => p.owner_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', ownerIds);

      const profileMap = new Map<string, string>();
      profiles?.forEach((p) => profileMap.set(p.id, p.name || p.email));

      const saved: SavedProject[] = projects.map((row) => ({
        id: row.id,
        savedAt: row.saved_at,
        quoteNumber: row.quote_number,
        customerName: row.customer_name,
        projectAddress: row.project_address,
        country: row.country,
        currentStep: row.current_step,
        numZones: row.num_zones,
        snapshot: row.snapshot as unknown as ProjectState,
        ownerId: row.owner_id,
        ownerName: profileMap.get(row.owner_id) ?? row.owner_id,
        status: ((row as any).status ?? 'in_progress') as 'in_progress' | 'completed',
      }));

      setSavedProjectsRef.current(saved);
    };

    loadProjects();
  }, [currentUserId]); // stable primitive dep — fires exactly once per user login
}

/** Returns a save function that immediately upserts the current project to DB */
export function useProjectSaver() {
  const { currentUser } = useAuthStore();
  const setSaveStatus = useProjectStore((s) => s.setSaveStatus);
  const lastSavedRef = useRef<ProjectState | null>(null);

  function computeDiff(prev: ProjectState, next: ProjectState): string[] {
    const changes: string[] = []
    const fmt = (v: unknown) => v === true ? 'áno' : v === false ? 'nie' : v == null ? '—' : String(v)

    // ── Projekt ───────────────────────────────────────────────────────────────
    const p = prev.project, n = next.project
    if (p.customerName    !== n.customerName)    changes.push(`Zákazník: ${p.customerName} → ${n.customerName}`)
    if (p.projectAddress  !== n.projectAddress)  changes.push(`Adresa: ${p.projectAddress} → ${n.projectAddress}`)
    if (p.country         !== n.country)         changes.push(`Krajina: ${p.country} → ${n.country}`)

    // ── Počet zón ─────────────────────────────────────────────────────────────
    const pz = prev.zones ?? [], nz = next.zones ?? []
    if (pz.length !== nz.length) changes.push(`Počet zón: ${pz.length} → ${nz.length}`)

    // ── Per-zóna ──────────────────────────────────────────────────────────────
    const zoneLabels: Record<string, string> = {
      name: 'Názov', length: 'Dĺžka (m)', width: 'Šírka (m)', height: 'Výška (m)',
      numNaves: 'Počet lodí', trellisPitch: 'Rozostup kratovníc (m)',
      controlType: 'Typ riadenia', hasMagnet: 'Drain magnet',
      elevation: 'Prevýšenie (m)', elevationLength: 'Dĺžka prevýšenia (m)',
      hydraulicHoseEnabled: 'Hydraulická hadica', hydraulicHoseLength: 'Dĺžka hadice (m)',
      hydraulicHoseConnectors: 'Konektory hadice', connectionType: 'Napojenie',
      nozzleOrifice: 'Tryska (mm)', nozzleFlow: 'Prietok trysky (l/h)', nozzleSpacing: 'Rozostup trysiek (mm)',
    }
    for (let i = 0; i < Math.max(pz.length, nz.length); i++) {
      const a = pz[i], b = nz[i]
      if (!a || !b) continue
      const label = b.name || `Zóna ${i + 1}`
      for (const key of Object.keys(zoneLabels)) {
        const av = (a as unknown as Record<string,unknown>)[key], bv = (b as unknown as Record<string,unknown>)[key]
        if (av !== bv) changes.push(`${label} – ${zoneLabels[key]}: ${fmt(av)} → ${fmt(bv)}`)
      }
    }

    // ── Globálne parametre (krok 2) ───────────────────────────────────────────
    const globalLabels: Record<string, string> = {
      numberOfZones: 'Počet zón', fogCapacity: 'Výkon zvlhčovania (g/h)',
      systemPressure: 'Tlak systému (bar)', pumpLocation: 'Stav čerpadla',
      osmoticWater: 'Osmotická voda', steelRope: 'Typ lana', trellisSpacing: 'Rozostup kratovníc (m)',
    }
    const pg = prev.globalParams as unknown as Record<string,unknown> | undefined
    const ng = next.globalParams as unknown as Record<string,unknown> | undefined
    if (pg && ng) {
      for (const key of Object.keys(globalLabels)) {
        if (pg[key] !== ng[key]) changes.push(`${globalLabels[key]}: ${fmt(pg[key])} → ${fmt(ng[key])}`)
      }
    }

    // ── Výber čerpadla (krok 5) ───────────────────────────────────────────────
    const pp = prev.pumpSelection, np = next.pumpSelection
    if (JSON.stringify(pp) !== JSON.stringify(np)) {
      if (!pp && np) changes.push(`Čerpadlo: (žiadne) → ${np.name} ×${np.quantity}`)
      else if (pp && !np) changes.push(`Čerpadlo: ${pp.name} ×${pp.quantity} → (žiadne)`)
      else if (pp && np) {
        if (pp.code !== np.code) changes.push(`Čerpadlo: ${pp.name} → ${np.name}`)
        if (pp.quantity !== np.quantity) changes.push(`Počet čerpadiel: ${pp.quantity} → ${np.quantity}`)
      }
    }

    // ── ETNA konfig (krok 5) ──────────────────────────────────────────────────
    const etnaLabels: Record<string, string> = {
      capacityM3h: 'ETNA výkon (m³/h)', maxivarem: 'Maxivarem',
      maxivareVariant: 'Maxivarem variant', etnaFilter: 'Filter',
      etnaFilterVariant: 'Filter variant', normistPrice: 'Cena NORMIST',
    }
    const pe = prev.etnaConfig as Record<string,unknown> | undefined
    const ne = next.etnaConfig as Record<string,unknown> | undefined
    if (pe && ne) {
      for (const key of Object.keys(etnaLabels)) {
        if (pe[key] !== ne[key]) changes.push(`${etnaLabels[key]}: ${fmt(pe[key])} → ${fmt(ne[key])}`)
      }
    }

    // ── UV / filter voľby ─────────────────────────────────────────────────────
    if (prev.uvSystemCode   !== next.uvSystemCode)   changes.push(`UV systém: ${fmt(prev.uvSystemCode)} → ${fmt(next.uvSystemCode)}`)
    if (prev.ssFilter30     !== next.ssFilter30)     changes.push(`SS filter 30μm: ${fmt(prev.ssFilter30)} → ${fmt(next.ssFilter30)}`)
    if (prev.uvSystemNazli  !== next.uvSystemNazli)  changes.push(`UV systém NAZLI: ${fmt(prev.uvSystemNazli)} → ${fmt(next.uvSystemNazli)}`)

    // ── Náklady (krok 6) ──────────────────────────────────────────────────────
    const costLabels: Record<string, string> = {
      installTechDays: 'Montáž tech. – dni', installTechCount: 'Montáž tech. – počet',
      installGreenhouseDays: 'Montáž skleník – dni', installGreenhouseCount: 'Montáž skleník – počet',
      diggingDays: 'Výkop – dni', diggingCount: 'Výkop – počet',
      commissioningDays: 'Uvedenie do prevádzky – dni', commissioningCount: 'Uvedenie do prevádzky – počet',
      inspectionFixed: 'Obhliadka (€)', designFixed: 'Projekt (€)', projectArea: 'Plocha projektu (m²)',
      salesTrips: 'Obchodné cesty', techTrips: 'Tech. cesty', implTeamTrips: 'Montážne cesty',
      accommodationCost: 'Ubytovanie (€)', mountingMaterial: 'Mont. materiál (€)',
      mountingMaterialStation: 'Mont. materiál stanica (€)',
    }
    const pc = prev.costInputs as unknown as Record<string,unknown> | undefined
    const nc = next.costInputs as unknown as Record<string,unknown> | undefined
    if (pc && nc) {
      for (const key of Object.keys(costLabels)) {
        if (pc[key] !== nc[key]) changes.push(`${costLabels[key]}: ${fmt(pc[key])} → ${fmt(nc[key])}`)
      }
    }

    // ── Pre-order (krok 9) ────────────────────────────────────────────────────
    const pr = prev.preOrderState, nr = next.preOrderState
    if (pr && nr) {
      if (pr.etnaDistance   !== nr.etnaDistance)   changes.push(`ETNA vzdialenosť (m): ${pr.etnaDistance} → ${nr.etnaDistance}`)
      if (pr.etnaCustomCost !== nr.etnaCustomCost) changes.push(`ETNA vlastná cena (€): ${pr.etnaCustomCost} → ${nr.etnaCustomCost}`)
      if (JSON.stringify(pr.pumpConnectorMeters) !== JSON.stringify(nr.pumpConnectorMeters))
        changes.push(`Dĺžky konektorov čerpadla: ${(pr.pumpConnectorMeters??[]).join(', ')} → ${(nr.pumpConnectorMeters??[]).join(', ')}`)
    }

    // ── Lano – manuálne prepisy ───────────────────────────────────────────────
    if (JSON.stringify(prev.ropeOverrides) !== JSON.stringify(next.ropeOverrides))
      changes.push(`Lano (prepisy): ${(prev.ropeOverrides??[]).join(', ')} → ${(next.ropeOverrides??[]).join(', ')}`)

    return changes
  }


  const save = useCallback(
    async (snapshot: ProjectState) => {
      if (!currentUser) return;
      setSaveStatus('saving');

      const { error } = await supabase
        .from('projects')
        .upsert([{
          id: snapshot.project.id,
          owner_id: currentUser.id,
          quote_number: snapshot.project.quoteNumber,
          customer_name: snapshot.project.customerName,
          project_address: snapshot.project.projectAddress,
          country: snapshot.project.country,
          current_step: snapshot.currentStep,
          num_zones: snapshot.zones.length,
          snapshot: JSON.parse(JSON.stringify(snapshot)),
          saved_at: new Date().toISOString(),
        }]);

      if (error) {
        console.error('[Projects] Save error:', error.message);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 4000);
      } else {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 3000);
        // Record change diff
        const prev = lastSavedRef.current;
        lastSavedRef.current = snapshot;
        if (prev && prev.project?.id) {
          const diffs = computeDiff(prev, snapshot);
          if (diffs.length > 0) {
            supabase.from('project_changes').insert({
              project_id: prev.project.id,
              changed_by: currentUser?.id ?? null,
              changed_by_email: (currentUser as any)?.user_metadata?.full_name ?? (currentUser as any)?.user_metadata?.name ?? currentUser?.name ?? currentUser?.email ?? 'unknown',
              reason: diffs.join('; '),
            }).then(({ error: chErr }) => {
              if (chErr) console.error('[Changes] insert error:', chErr.message);
            });
          }
        }
      }
    },
    [currentUser, setSaveStatus]
  );

  return save;
}

/** Returns a debounced auto-save function (2s debounce) and an immediate save.
 *  The timer is properly cleaned up on unmount to prevent ghost saves / memory leaks. */
export function useAutoSave() {
  const save = useProjectSaver();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // NC3 FIX: clean up pending timer when hook unmounts
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const debouncedSave = useCallback(
    (snapshot: ProjectState) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        save(snapshot);
      }, 2000);
    },
    [save]
  );

  const immediateSave = useCallback(
    (snapshot: ProjectState) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
      save(snapshot);
    },
    [save]
  );

  return { debouncedSave, immediateSave };
}
