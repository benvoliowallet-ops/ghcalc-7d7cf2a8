import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '../store/authStore';
import { useProjectStore } from '../store/projectStore';

export interface ProjectChangeEntry {
  id: string;
  projectId: string;
  changedAt: string;
  changedBy: string | null;
  changedByEmail: string;
  reason: string;
}

/** Load change history for a single project */
export function useProjectChanges(projectId: string | null) {
  const [changes, setChanges] = useState<ProjectChangeEntry[]>([]);

  useEffect(() => {
    if (!projectId) { setChanges([]); return; }

    supabase
      .from('project_changes')
      .select('*')
      .eq('project_id', projectId)
      .order('changed_at', { ascending: false })
      .then(({ data }) => {
        if (data) {
          setChanges(data.map((r) => ({
            id: r.id,
            projectId: r.project_id ?? '',
            changedAt: r.changed_at,
            changedBy: r.changed_by ?? null,
            changedByEmail: r.changed_by_email,
            reason: r.reason,
          })));
        }
      });
  }, [projectId]);

  return changes;
}

/** Load all project changes across all projects (for ChangeLogPage) */
export function useAllProjectChanges() {
  const [changes, setChanges] = useState<(ProjectChangeEntry & { quoteNumber: string; customerName: string })[]>([]);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('project_changes')
      .select('*, projects(quote_number, customer_name)')
      .order('changed_at', { ascending: false });

    if (data) {
      setChanges(data.map((r: any) => ({
        id: r.id,
        projectId: r.project_id ?? '',
        changedAt: r.changed_at,
        changedBy: r.changed_by ?? null,
        changedByEmail: r.changed_by_email,
        reason: r.reason,
        quoteNumber: r.projects?.quote_number ?? '',
        customerName: r.projects?.customer_name ?? '',
      })));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { changes, reload: load };
}

/** Mark a project as completed */
export async function markProjectCompleted(projectId: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('projects')
    .update({ status: 'completed' })
    .eq('id', projectId);
  return { error: error?.message ?? null };
}

/** Reopen a completed project: set status → in_progress + log reason */
export async function reopenProject(
  projectId: string,
  reason: string,
  currentUser: { id: string; email: string; name?: string },
): Promise<{ error: string | null }> {
  const { error: updateError } = await supabase
    .from('projects')
    .update({ status: 'in_progress' })
    .eq('id', projectId);

  if (updateError) return { error: updateError.message };

  const { error: insertError } = await supabase
    .from('project_changes')
    .insert({
      project_id: projectId,
      changed_by: currentUser.id,
      changed_by_email: currentUser.name ?? currentUser.email,
      reason,
    });

  return { error: insertError?.message ?? null };
}
