import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';

export interface PortalData {
  id: string;
  project_id: string;
  plain_password: string;
  created_at: string;
  created_by: string;
  expires_at: string | null;
}

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 8; i++) {
    if (i === 4) out += '-';
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export function usePortal(projectId: string | null) {
  const { currentUser } = useAuthStore();
  const [portal, setPortal] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPortal = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('project_portals')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle();
    setLoading(false);
    if (error) { setError(error.message); return; }
    setPortal(data);
  }, [projectId]);

  const createPortal = useCallback(async (): Promise<PortalData | null> => {
    if (!projectId || !currentUser) return null;
    setLoading(true);
    setError(null);

    const password = generatePassword();

    // Upsert — if portal already exists replace it
    const { data, error } = await supabase
      .from('project_portals')
      .upsert({
        project_id: projectId,
        plain_password: password,
        created_by: currentUser.id,
        expires_at: null,
      }, { onConflict: 'project_id' })
      .select()
      .single();

    setLoading(false);
    if (error) { setError(error.message); return null; }
    setPortal(data);
    return data;
  }, [projectId, currentUser]);

  const revokePortal = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    const { error } = await supabase
      .from('project_portals')
      .delete()
      .eq('project_id', projectId);
    setLoading(false);
    if (!error) setPortal(null);
  }, [projectId]);

  return { portal, loading, error, loadPortal, createPortal, revokePortal };
}
