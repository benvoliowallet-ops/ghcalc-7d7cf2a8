import React from 'react';
import { AlertCircle, Clock, User, FolderOpen, GitBranch } from 'lucide-react';
import { Task, isOverdue } from '@/hooks/useTasks';
import { formatSK } from '@/lib/dateUtils';

interface TaskRowProps {
  task: Task;
  subtaskCount?: number;
  onClick: (task: Task) => void;
}

const PRIORITY_BORDER: Record<string, string> = {
  low: 'hsl(var(--muted-foreground))',
  medium: 'hsl(var(--teal))',
  high: 'hsl(var(--orange))',
  urgent: 'hsl(0 72% 51%)',
};

const PRIORITY_LABEL: Record<string, string> = {
  low: 'Nízka',
  medium: 'Stredná',
  high: 'Vysoká',
  urgent: 'Urgentná',
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  todo: { label: 'Todo', bg: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' },
  in_progress: { label: 'V riešení', bg: 'hsl(var(--teal) / 0.15)', color: 'hsl(var(--teal))' },
  done: { label: 'Dokončené', bg: 'hsl(142 70% 45% / 0.15)', color: 'hsl(142 70% 45%)' },
};

export function TaskRow({ task, subtaskCount, onClick }: TaskRowProps) {
  const overdue = isOverdue(task);
  const status = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.todo;
  const deadlineDate = task.deadline ? new Date(task.deadline) : null;
  const completedLate = task.status === 'done' && task.completed_at && task.deadline
    ? new Date(task.completed_at) > new Date(task.deadline)
    : false;
  const daysLate = completedLate && task.completed_at && task.deadline
    ? Math.ceil((new Date(task.completed_at).getTime() - new Date(task.deadline).getTime()) / 86400000)
    : 0;

  return (
    <div
      className="group flex items-center gap-3 px-4 py-3 bg-card border border-border hover:bg-muted/40 cursor-pointer transition-colors"
      style={{
        borderLeft: `3px solid ${PRIORITY_BORDER[task.priority] ?? PRIORITY_BORDER.medium}`,
        borderRadius: 'var(--radius)',
        marginBottom: '4px',
      }}
      onClick={() => onClick(task)}
    >
      {/* Title + description */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm text-foreground truncate">{task.title}</span>
          {overdue && (
            <span className="flex items-center gap-0.5 text-xs font-bold" style={{ color: 'hsl(0 72% 51%)' }}>
              <AlertCircle className="w-3 h-3" />
              Oneskorené
            </span>
          )}
          {subtaskCount !== undefined && subtaskCount > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              <GitBranch className="w-3 h-3" />
              {subtaskCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          {task.creator && (
            <span className="text-xs text-muted-foreground flex items-center gap-0.5">
              <User className="w-3 h-3" />
              {task.creator.name}
            </span>
          )}
          {task.assignee && (
            <span className="text-xs text-muted-foreground">
              → {task.assignee.name}
            </span>
          )}
          {task.project && (
            <span
              className="text-xs px-1.5 py-0.5 rounded font-mono font-semibold flex items-center gap-0.5"
              style={{ background: 'hsl(var(--teal) / 0.1)', color: 'hsl(var(--teal))' }}
            >
              <FolderOpen className="w-3 h-3" />
              {task.project.quote_number}
            </span>
          )}
        </div>
      </div>

      {/* Right side: deadline + status */}
      <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
        {deadlineDate && (
          <span
            className="text-xs flex items-center gap-0.5 font-mono"
            style={{
              color: overdue ? 'hsl(0 72% 51%)' : 'hsl(var(--muted-foreground))',
              fontWeight: overdue ? 700 : 400,
            }}
          >
            <Clock className="w-3 h-3" />
            {format(deadlineDate, 'dd.MM.yyyy')}
          </span>
        )}
        {completedLate && (
          <span
            className="text-xs flex items-center gap-0.5 font-semibold"
            style={{ color: 'hsl(30 90% 55%)' }}
            title={`Splnené ${daysLate} ${daysLate === 1 ? 'deň' : 'dní'} po termíne`}
          >
            <Clock className="w-3 h-3" />
            +{daysLate}d
          </span>
        )}
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded whitespace-nowrap"
          style={{ background: status.bg, color: status.color }}
        >
          {status.label}
        </span>
        <span className="text-xs text-muted-foreground hidden sm:block">
          {PRIORITY_LABEL[task.priority]}
        </span>
      </div>
    </div>
  );
}
