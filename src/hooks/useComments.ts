import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';

export interface ProjectComment {
  id: string;
  project_id: string;
  author_id: string;
  author_name: string;
  body: string;
  resolved: boolean;
  created_at: string;
}

export function useComments(projectId: string | null) {
  const { currentUser } = useAuthStore();
  const [comments, setComments] = useState<ProjectComment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    const { data } = await supabase
      .from('project_comments')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });
    setLoading(false);
    if (data) setComments(data as ProjectComment[]);
  }, [projectId]);

  // Initial load
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Realtime subscription
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`comments:${projectId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'project_comments', filter: `project_id=eq.${projectId}` },
        () => { fetchComments(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [projectId, fetchComments]);

  const addComment = useCallback(async (body: string) => {
    if (!projectId || !currentUser || !body.trim()) return;
    await supabase.from('project_comments').insert({
      project_id: projectId,
      author_id: currentUser.id,
      author_name: currentUser.name,
      body: body.trim(),
    });
  }, [projectId, currentUser]);

  const toggleResolved = useCallback(async (comment: ProjectComment) => {
    await supabase
      .from('project_comments')
      .update({ resolved: !comment.resolved })
      .eq('id', comment.id);
  }, []);

  const deleteComment = useCallback(async (id: string) => {
    await supabase.from('project_comments').delete().eq('id', id);
  }, []);

  const unresolvedCount = comments.filter(c => !c.resolved).length;

  return { comments, loading, addComment, toggleResolved, deleteComment, unresolvedCount };
}
