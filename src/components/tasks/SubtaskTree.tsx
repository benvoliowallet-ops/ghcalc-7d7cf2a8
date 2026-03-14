import React, { useState, useCallback } from 'react';
import { Plus, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { Task, useTaskMutations, useProfiles } from '@/hooks/useTasks';
import { TaskRow } from './TaskRow';
import { TaskDetailModal } from './TaskDetailModal';
import { useAuthStore } from '@/store/authStore';

interface SubtaskTreeProps {
  parentId: string;
  allTasks: Task[];
  depth?: number;
  onTaskClick: (task: Task) => void;
  onRefresh: () => void;
}

export function SubtaskTree({ parentId, allTasks, depth = 0, onTaskClick, onRefresh }: SubtaskTreeProps) {
  const { currentUser } = useAuthStore();
  const { createTask } = useTaskMutations(onRefresh);
  const profiles = useProfiles();

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedSubtask, setSelectedSubtask] = useState<Task | null>(null);

  const subtasks = allTasks.filter(t => t.parent_task_id === parentId);

  const handleAddSubtask = useCallback(async (pid: string) => {
    if (!newTitle.trim()) return;
    setSaving(true);
    await createTask({ title: newTitle.trim(), parent_task_id: pid });
    setNewTitle('');
    setAddingTo(null);
    setSaving(false);
  }, [newTitle, createTask]);

  if (subtasks.length === 0 && !addingTo) {
    if (depth > 0) return null;
    return (
      <div className="mt-3">
        <button
          onClick={() => setAddingTo(parentId)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Pridať podúlohu
        </button>
      </div>
    );
  }

  return (
    <div style={{ paddingLeft: depth > 0 ? '16px' : '0', borderLeft: depth > 0 ? '2px solid hsl(var(--border))' : 'none', marginLeft: depth > 0 ? '8px' : '0' }}>
      {subtasks.map(subtask => {
        const hasChildren = allTasks.some(t => t.parent_task_id === subtask.id);
        const isExpanded = expanded[subtask.id];
        return (
          <div key={subtask.id}>
            <div className="flex items-start gap-1">
              {hasChildren && (
                <button
                  onClick={() => setExpanded(p => ({ ...p, [subtask.id]: !p[subtask.id] }))}
                  className="mt-3 shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              )}
              {!hasChildren && <div className="w-4 shrink-0" />}
              <div className="flex-1">
                <TaskRow
                  task={subtask}
                  subtaskCount={allTasks.filter(t => t.parent_task_id === subtask.id).length}
                  onClick={(t) => setSelectedSubtask(t)}
                />
                {isExpanded && (
                  <SubtaskTree
                    parentId={subtask.id}
                    allTasks={allTasks}
                    depth={depth + 1}
                    onTaskClick={onTaskClick}
                    onRefresh={onRefresh}
                  />
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Add subtask inline form */}
      {addingTo === parentId ? (
        <div className="flex gap-2 items-center mt-2 ml-5">
          <input
            autoFocus
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAddSubtask(parentId); if (e.key === 'Escape') { setAddingTo(null); setNewTitle(''); } }}
            placeholder="Názov podúlohy..."
            className="flex-1 text-sm px-2 py-1 rounded border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-teal"
            style={{ borderRadius: 'var(--radius)' }}
          />
          <button
            onClick={() => handleAddSubtask(parentId)}
            disabled={saving || !newTitle.trim()}
            className="px-3 py-1 text-xs font-semibold rounded bg-teal text-white hover:bg-teal/90 disabled:opacity-50 transition-colors flex items-center gap-1"
            style={{ borderRadius: 'var(--radius)' }}
          >
            {saving && <Loader2 className="w-3 h-3 animate-spin" />}
            Pridať
          </button>
          <button
            onClick={() => { setAddingTo(null); setNewTitle(''); }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Zrušiť
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAddingTo(parentId)}
          className="ml-5 mt-2 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Pridať podúlohu
        </button>
      )}

      <TaskDetailModal
        task={selectedSubtask}
        open={!!selectedSubtask}
        onClose={() => setSelectedSubtask(null)}
        onRefresh={() => { onRefresh(); }}
      />
    </div>
  );
}
