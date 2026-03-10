import React, { useState } from 'react';
import { Plus, CheckSquare, Filter } from 'lucide-react';
import { useTasks, useAllTasks, useProfiles, Task } from '@/hooks/useTasks';
import { TaskList } from '@/components/tasks/TaskList';
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal';
import { NewTaskModal } from '@/components/tasks/NewTaskModal';

const PRIORITIES = [
  { value: '', label: 'Všetky priority' },
  { value: 'low', label: 'Nízka' },
  { value: 'medium', label: 'Stredná' },
  { value: 'high', label: 'Vysoká' },
  { value: 'urgent', label: 'Urgentná' },
];

export default function TasksPage() {
  const profiles = useProfiles();

  const [filterAssignedTo, setFilterAssignedTo] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const { tasks, loading, refetch } = useTasks({
    assignedTo: filterAssignedTo || undefined,
    includeCompleted: showCompleted,
    parentTaskId: null,
  });

  const { tasks: allTasks, refetch: refetchAll } = useAllTasks();

  const filteredTasks = filterPriority
    ? tasks.filter(t => t.priority === filterPriority)
    : tasks;

  const handleRefresh = () => { refetch(); refetchAll(); };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <CheckSquare className="w-5 h-5" style={{ color: 'hsl(var(--teal))' }} />
          <h1 className="text-xl font-bold text-foreground uppercase tracking-wide">Úlohy</h1>
          {!loading && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded font-mono">
              {filteredTasks.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setNewTaskOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded text-white hover:opacity-90 transition-opacity"
          style={{ background: 'hsl(var(--teal))', borderRadius: 'var(--radius)' }}
        >
          <Plus className="w-4 h-4" /> Nová úloha
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <Filter className="w-3.5 h-3.5 text-muted-foreground" />

        <select
          value={filterAssignedTo}
          onChange={e => setFilterAssignedTo(e.target.value)}
          className="px-3 py-1.5 text-sm rounded border border-border bg-background text-foreground focus:outline-none"
          style={{ borderRadius: 'var(--radius)' }}
        >
          <option value="">Všetci</option>
          {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        <select
          value={filterPriority}
          onChange={e => setFilterPriority(e.target.value)}
          className="px-3 py-1.5 text-sm rounded border border-border bg-background text-foreground focus:outline-none"
          style={{ borderRadius: 'var(--radius)' }}
        >
          {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>

        <button
          onClick={() => setShowCompleted(v => !v)}
          className={`px-3 py-1.5 text-sm rounded border transition-colors ${
            showCompleted
              ? 'border-teal text-teal bg-teal/10'
              : 'border-border text-muted-foreground hover:border-teal hover:text-foreground'
          }`}
          style={{ borderRadius: 'var(--radius)' }}
        >
          Zobraziť dokončené
        </button>
      </div>

      {/* Task list */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Načítavam…</div>
      ) : (
        <TaskList
          tasks={filteredTasks}
          allTasks={allTasks}
          showCompleted={showCompleted}
          onTaskClick={task => setSelectedTask(task)}
        />
      )}

      <NewTaskModal
        open={newTaskOpen}
        onClose={() => setNewTaskOpen(false)}
        onCreated={handleRefresh}
      />

      <TaskDetailModal
        task={selectedTask}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onRefresh={handleRefresh}
      />
    </div>
  );
}
