import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';

export interface TaskProfile {
  id: string;
  name: string;
}

export interface TaskProject {
  id: string;
  quote_number: string;
  customer_name: string;
}

export interface Task {
  id: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  assigned_to: string | null;
  project_id: string | null;
  parent_task_id: string | null;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'done';
  deadline: string | null;
  completed_at: string | null;
  assignee?: TaskProfile | null;
  creator?: TaskProfile | null;
  project?: TaskProject | null;
}

export interface TaskComment {
  id: string;
  task_id: string;
  created_by: string;
  created_at: string;
  content: string;
  author?: TaskProfile | null;
}

export interface TaskFilters {
  assignedTo?: string;
  projectId?: string;
  includeCompleted?: boolean;
  parentTaskId?: string | null;
}

function isOverdue(task: Task) {
  return task.deadline && task.status !== 'done' && new Date(task.deadline) < new Date();
}

function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const aOverdue = isOverdue(a) ? 0 : 1;
    const bOverdue = isOverdue(b) ? 0 : 1;
    if (aOverdue !== bOverdue) return aOverdue - bOverdue;
    if (a.deadline && b.deadline) return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    if (a.deadline && !b.deadline) return -1;
    if (!a.deadline && b.deadline) return 1;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
}

export function useTasks(filters: TaskFilters = {}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('tasks')
      .select(`
        *,
        assignee:profiles!tasks_assigned_to_fkey(id, name),
        creator:profiles!tasks_created_by_fkey(id, name),
        project:projects!tasks_project_id_fkey(id, quote_number, customer_name)
      `);

    if (filters.assignedTo) query = query.eq('assigned_to', filters.assignedTo);
    if (filters.projectId) query = query.eq('project_id', filters.projectId);
    if (!filters.includeCompleted) query = query.neq('status', 'done');
    // Root-level tasks only when no parentTaskId filter specified and not explicitly null
    if (filters.parentTaskId !== undefined) {
      if (filters.parentTaskId === null) {
        query = query.is('parent_task_id', null);
      } else {
        query = query.eq('parent_task_id', filters.parentTaskId);
      }
    }

    const { data, error } = await query;
    setLoading(false);
    if (!error && data) {
      setTasks(sortTasks(data as unknown as Task[]));
    }
  }, [filters.assignedTo, filters.projectId, filters.includeCompleted, filters.parentTaskId]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  return { tasks, loading, refetch: fetchTasks };
}

export function useAllTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAllTasks = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:profiles!tasks_assigned_to_fkey(id, name),
        creator:profiles!tasks_created_by_fkey(id, name),
        project:projects!tasks_project_id_fkey(id, quote_number, customer_name)
      `);
    setLoading(false);
    if (!error && data) setTasks(data as unknown as Task[]);
  }, []);

  useEffect(() => { fetchAllTasks(); }, [fetchAllTasks]);

  return { tasks, loading, refetch: fetchAllTasks };
}

export function useTaskComments(taskId: string | null) {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    const { data } = await supabase
      .from('task_comments')
      .select('*, author:profiles!task_comments_created_by_fkey(id, name)')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });
    setLoading(false);
    if (data) setComments(data as unknown as TaskComment[]);
  }, [taskId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  useEffect(() => {
    if (!taskId) return;
    const channel = supabase
      .channel(`task_comments:${taskId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_comments', filter: `task_id=eq.${taskId}` }, () => fetchComments())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [taskId, fetchComments]);

  return { comments, loading, refetch: fetchComments };
}

export function useProfiles() {
  const [profiles, setProfiles] = useState<TaskProfile[]>([]);

  useEffect(() => {
    supabase.from('profiles').select('id, name').order('name').then(({ data }) => {
      if (data) setProfiles(data);
    });
  }, []);

  return profiles;
}

export function useProjectList() {
  const [projects, setProjects] = useState<TaskProject[]>([]);

  useEffect(() => {
    supabase.from('projects').select('id, quote_number, customer_name').order('quote_number').then(({ data }) => {
      if (data) setProjects(data);
    });
  }, []);

  return projects;
}

// ── CRUD ─────────────────────────────────────────────────────────────────────

export function useTaskMutations(refetch?: () => void) {
  const { currentUser } = useAuthStore();

  const createTask = useCallback(async (payload: {
    title: string;
    description?: string;
    assigned_to?: string | null;
    project_id?: string | null;
    parent_task_id?: string | null;
    priority?: string;
    deadline?: string | null;
  }) => {
    if (!currentUser) return null;
    const { data, error } = await supabase.from('tasks').insert({
      ...payload,
      created_by: currentUser.id,
      priority: payload.priority ?? 'medium',
      status: 'todo',
    }).select().single();

    if (!error && data && payload.assigned_to && payload.assigned_to !== currentUser.id) {
      triggerNotification('assigned', data.id, payload.assigned_to);
    }
    refetch?.();
    return error ? null : data;
  }, [currentUser, refetch]);

  const updateTask = useCallback(async (id: string, patch: Partial<Task>) => {
    if (!currentUser) return;
    await supabase.from('tasks').update(patch).eq('id', id).eq('created_by', currentUser.id);
    refetch?.();
  }, [currentUser, refetch]);

  const updateTaskStatus = useCallback(async (task: Task, newStatus: 'todo' | 'in_progress' | 'done') => {
    if (!currentUser) return;
    const patch: { status: string; completed_at: string | null } = {
      status: newStatus,
      completed_at: newStatus === 'done' ? new Date().toISOString() : null,
    };

    // Creator updates with full access; assigned_to uses narrower match
    const isCreator = currentUser.id === task.created_by;
    if (isCreator) {
      await supabase.from('tasks').update(patch).eq('id', task.id).eq('created_by', currentUser.id);
    } else {
      await supabase.from('tasks').update(patch).eq('id', task.id).eq('assigned_to', currentUser.id);
    }

    if (newStatus === 'done' && task.created_by !== currentUser.id) {
      triggerNotification('completed', task.id, task.created_by);
    }
    refetch?.();
  }, [currentUser, refetch]);

  const deleteTask = useCallback(async (id: string) => {
    if (!currentUser) return;
    await supabase.from('tasks').delete().eq('id', id).eq('created_by', currentUser.id);
    refetch?.();
  }, [currentUser, refetch]);

  const addTaskComment = useCallback(async (task: Task, content: string) => {
    if (!currentUser || !content.trim()) return;
    const trimmed = content.trim();
    const now = new Date().toISOString();
    const { data } = await supabase.from('task_comments').insert({
      task_id: task.id,
      created_by: currentUser.id,
      content: trimmed,
    }).select().single();

    if (data) {
      // Notify creator (if not commenter) and assigned_to (if set and not commenter)
      const recipients = new Set<string>();
      if (task.created_by !== currentUser.id) recipients.add(task.created_by);
      if (task.assigned_to && task.assigned_to !== currentUser.id) recipients.add(task.assigned_to);
      recipients.forEach(r => triggerNotification('comment', task.id, r, {
        commentText: trimmed,
        commentAuthor: currentUser.name,
        commentAt: now,
      }));
    }
  }, [currentUser]);

  const deleteTaskComment = useCallback(async (id: string) => {
    if (!currentUser) return;
    await supabase.from('task_comments').delete().eq('id', id).eq('created_by', currentUser.id);
  }, [currentUser]);

  return { createTask, updateTask, updateTaskStatus, deleteTask, addTaskComment, deleteTaskComment };
}

async function triggerNotification(type: 'assigned' | 'completed' | 'comment', taskId: string, recipientId: string) {
  try {
    await supabase.functions.invoke('send-task-notification', {
      body: { type, taskId, recipientId },
    });
  } catch {
    // Notifications are best-effort; don't block UI
  }
}

export { isOverdue, sortTasks };
