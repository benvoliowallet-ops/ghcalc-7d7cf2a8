import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProjectStore } from '../store/projectStore';
import { useAuthStore } from '../store/authStore';
import type { SavedProject, ProjectState } from '../types';

/** Loads all projects for the current user from the DB into the store */
export function useLoadProjects() {
  const { currentUser } = useAuthStore();
  const { setSavedProjects } = useProjectStore();

  useEffect(() => {
    if (!currentUser) return;

    supabase
      .from('projects')
      .select('id, quote_number, customer_name, project_address, country, current_step, num_zones, snapshot, saved_at')
      .eq('owner_id', currentUser.id)
      .order('saved_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error('[Projects] Load error:', error.message);
          return;
        }
        if (!data) return;

        const saved: SavedProject[] = data.map((row) => ({
          id: row.id,
          savedAt: row.saved_at,
          quoteNumber: row.quote_number,
          customerName: row.customer_name,
          projectAddress: row.project_address,
          country: row.country,
          currentStep: row.current_step,
          numZones: row.num_zones,
          snapshot: row.snapshot as ProjectState,
        }));

        setSavedProjects(saved);
      });
  }, [currentUser, setSavedProjects]);
}

/** Returns a save function that immediately upserts the current project to DB */
export function useProjectSaver() {
  const { currentUser } = useAuthStore();
  const setSaveStatus = useProjectStore((s) => s.setSaveStatus);

  const save = useCallback(
    async (snapshot: ProjectState) => {
      if (!currentUser) return;
      setSaveStatus('saving');

      const { error } = await supabase
        .from('projects')
        .upsert({
          id: snapshot.project.id,
          owner_id: currentUser.id,
          quote_number: snapshot.project.quoteNumber,
          customer_name: snapshot.project.customerName,
          project_address: snapshot.project.projectAddress,
          country: snapshot.project.country,
          current_step: snapshot.currentStep,
          num_zones: snapshot.zones.length,
          snapshot: snapshot as unknown as Record<string, unknown>,
          saved_at: new Date().toISOString(),
        });

      if (error) {
        console.error('[Projects] Save error:', error.message);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 4000);
      } else {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 3000);
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
