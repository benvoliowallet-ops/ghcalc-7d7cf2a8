import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Task } from '@/hooks/useTasks';
import { TaskRow } from './TaskRow';

interface TaskListProps {
  tasks: Task[];
  allTasks: Task[];
  showCompleted?: boolean;
  onTaskClick: (task: Task) => void;
}

export function TaskList({ tasks, allTasks, showCompleted, onTaskClick }: TaskListProps) {
  const [completedOpen, setCompletedOpen] = useState(false);

  const active = tasks.filter(t => t.status !== 'done');
  const completed = allTasks.filter(t => t.status === 'done' && t.parent_task_id === null);

  function getSubtaskCount(taskId: string): number {
    return allTasks.filter(t => t.parent_task_id === taskId).length;
  }

  if (active.length === 0 && !showCompleted) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        Žiadne aktívne úlohy. ✓
      </div>
    );
  }

  return (
    <div>
      {active.map(task => (
        <TaskRow
          key={task.id}
          task={task}
          subtaskCount={getSubtaskCount(task.id)}
          onClick={onTaskClick}
        />
      ))}

      {showCompleted && (
        <div className="mt-4">
          <button
            onClick={() => setCompletedOpen(v => !v)}
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            {completedOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            Dokončené ({completed.length})
          </button>
          {completedOpen && completed.map(task => (
            <TaskRow
              key={task.id}
              task={task}
              subtaskCount={getSubtaskCount(task.id)}
              onClick={onTaskClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
