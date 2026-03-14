import React, { useState, useEffect } from 'react';
import { X, Loader2, Pencil, Check, Trash2, Send } from 'lucide-react';
import { Task, useTaskMutations, useTaskComments, useProfiles, useProjectList, useAllTasks } from '@/hooks/useTasks';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { SubtaskTree } from './SubtaskTree';
import { useAuthStore } from '@/store/authStore';
import { format } from 'date-fns';

interface TaskDetailModalProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

const PRIORITIES = [
  { value: 'low', label: 'Nízka' },
  { value: 'medium', label: 'Stredná' },
  { value: 'high', label: 'Vysoká' },
  { value: 'urgent', label: 'Urgentná' },
];

const STATUS_OPTIONS = [
  { value: 'todo', label: 'Todo' },
  { value: 'in_progress', label: 'V riešení' },
  { value: 'done', label: 'Dokončené' },
];

export function TaskDetailModal({ task, open, onClose, onRefresh }: TaskDetailModalProps) {
  const { currentUser } = useAuthStore();
  const { updateTask, updateTaskStatus, deleteTask, addTaskComment, deleteTaskComment } = useTaskMutations(onRefresh);
  const { comments, refetch: refetchComments } = useTaskComments(task?.id ?? null);
  const { tasks: allTasks, refetch: refetchAll } = useAllTasks();
  const profiles = useProfiles();
  const projects = useProjectList();

  const [editTitle, setEditTitle] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [editDesc, setEditDesc] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [savingStatus, setSavingStatus] = useState<string | null>(null);
  const [localStatus, setLocalStatus] = useState<string>(task?.status ?? 'todo');

  const isCreator = !!currentUser && !!task && currentUser.id === task.created_by;
  const isAssigned = !!currentUser && !!task && currentUser.id === task.assigned_to;
  const canEditFull = isCreator;
  const canEditStatus = isCreator || isAssigned;

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? '');
      setEditTitle(false);
      setEditDesc(false);
      setLocalStatus(task.status);
    }
  }, [task]);

  if (!task) return null;

  const handleSaveTitle = async () => {
    if (title.trim() && title !== task.title) {
      await updateTask(task.id, { title: title.trim() });
    }
    setEditTitle(false);
  };

  const handleSaveDesc = async () => {
    if (description !== (task.description ?? '')) {
      await updateTask(task.id, { description: description || null });
    }
    setEditDesc(false);
  };

  const handleFieldChange = async (field: keyof Task, value: unknown) => {
    await updateTask(task.id, { [field]: value } as Partial<Task>);
    onRefresh();
  };

  const handleStatusChange = async (newStatus: string) => {
    setLocalStatus(newStatus);
    setSavingStatus(newStatus);
    await updateTaskStatus(task, newStatus as 'todo' | 'in_progress' | 'done');
    onRefresh();
    setSavingStatus(null);
  };

  const handleDelete = async () => {
    if (!window.confirm('Naozaj chcete vymazať túto úlohu?')) return;
    await deleteTask(task.id);
    onClose();
    onRefresh();
  };

  const handleSendComment = async () => {
    if (!commentText.trim()) return;
    setSendingComment(true);
    await addTaskComment(task, commentText);
    setCommentText('');
    refetchComments();
    setSendingComment(false);
  };

  const handleRefreshAll = () => {
    refetchAll();
    onRefresh();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3 pr-8">
            {editTitle && canEditFull ? (
              <div className="flex-1 flex gap-2">
                <input
                  autoFocus
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveTitle(); if (e.key === 'Escape') { setTitle(task.title); setEditTitle(false); } }}
                  className="flex-1 text-base font-bold px-2 py-1 rounded border border-teal bg-white dark:bg-muted text-foreground focus:outline-none"
                  style={{ borderRadius: 'var(--radius)' }}
                />
                <button onClick={handleSaveTitle} className="text-teal"><Check className="w-4 h-4" /></button>
              </div>
            ) : (
              <DialogTitle
                className={`text-base font-bold leading-snug flex items-center gap-2 ${canEditFull ? 'cursor-pointer hover:text-teal transition-colors' : ''}`}
                onClick={() => canEditFull && setEditTitle(true)}
              >
                {task.title}
                {canEditFull && <Pencil className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100" />}
              </DialogTitle>
            )}
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
          {/* Left: main fields */}
          <div className="md:col-span-2 space-y-4">
            {/* Description */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1">Popis</label>
              {editDesc && canEditFull ? (
                <div>
                  <textarea
                    autoFocus
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 text-sm rounded border border-teal bg-white dark:bg-muted text-foreground focus:outline-none resize-none"
                    style={{ borderRadius: 'var(--radius)' }}
                  />
                  <div className="flex gap-2 mt-1">
                    <button onClick={handleSaveDesc} className="text-xs text-teal font-semibold">Uložiť</button>
                    <button onClick={() => { setDescription(task.description ?? ''); setEditDesc(false); }} className="text-xs text-muted-foreground">Zrušiť</button>
                  </div>
                </div>
              ) : (
                <p
                  className={`text-sm text-foreground min-h-[2rem] ${canEditFull ? 'cursor-pointer hover:bg-muted/50 rounded p-1 -m-1 transition-colors' : ''} ${!task.description ? 'text-muted-foreground italic' : ''}`}
                  onClick={() => canEditFull && setEditDesc(true)}
                >
                  {task.description || (canEditFull ? 'Klikni pre pridanie popisu…' : '—')}
                </p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1">Stav</label>
              <div className="flex gap-2 flex-wrap">
                {STATUS_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    disabled={!canEditStatus || savingStatus !== null}
                    onClick={() => handleStatusChange(opt.value)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded border transition-all flex items-center gap-1.5 ${
                      localStatus === opt.value
                        ? 'bg-teal text-white border-teal'
                        : savingStatus === opt.value
                          ? 'border-teal text-teal bg-teal/10'
                          : 'border-border text-muted-foreground hover:border-teal hover:text-foreground'
                    }`}
                    style={{ borderRadius: 'var(--radius)' }}
                  >
                    {savingStatus === opt.value && <Loader2 className="w-3 h-3 animate-spin" />}
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Subtasks */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-2">Podúlohy</label>
              <SubtaskTree
                parentId={task.id}
                allTasks={allTasks}
                depth={0}
                onTaskClick={() => {}}
                onRefresh={handleRefreshAll}
              />
            </div>

            {/* Comments */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-2">Komentáre</label>
              <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                {comments.length === 0 && (
                  <p className="text-xs text-muted-foreground">Zatiaľ žiadne komentáre.</p>
                )}
                {comments.map(c => (
                  <div key={c.id} className="flex gap-2 items-start">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold"
                      style={{ background: 'hsl(var(--teal) / 0.2)', color: 'hsl(var(--teal))' }}
                    >
                      {c.author?.name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">{c.author?.name}</span>
                        <span className="text-xs text-muted-foreground">{format(new Date(c.created_at), 'dd.MM. HH:mm')}</span>
                        {currentUser?.id === c.created_by && (
                          <button
                            onClick={async () => { await deleteTaskComment(c.id); refetchComments(); }}
                            className="ml-auto text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-foreground mt-0.5">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendComment(); } }}
                  placeholder="Napísať komentár…"
                  className="flex-1 px-3 py-2 text-sm rounded border border-border bg-white dark:bg-muted text-foreground focus:outline-none focus:ring-1 focus:ring-teal"
                  style={{ borderRadius: 'var(--radius)' }}
                />
                <button
                  onClick={handleSendComment}
                  disabled={sendingComment || !commentText.trim()}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-semibold rounded bg-teal text-white hover:bg-teal/90 disabled:opacity-50 transition-colors"
                  style={{ borderRadius: 'var(--radius)' }}
                >
                  {sendingComment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Right: metadata */}
          <div className="space-y-4 text-sm">
            {/* Priority */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1">Priorita</label>
              {canEditFull ? (
                <select
                  value={task.priority}
                  onChange={e => handleFieldChange('priority', e.target.value)}
                  className="w-full px-2 py-1.5 text-sm rounded border border-border bg-white dark:bg-muted text-foreground focus:outline-none"
                  style={{ borderRadius: 'var(--radius)' }}
                >
                  {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              ) : (
                <span className="text-foreground">{PRIORITIES.find(p => p.value === task.priority)?.label}</span>
              )}
            </div>

            {/* Assigned to */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1">Priradený</label>
              {canEditFull ? (
                <select
                  value={task.assigned_to ?? ''}
                  onChange={e => handleFieldChange('assigned_to', e.target.value || null)}
                  className="w-full px-2 py-1.5 text-sm rounded border border-border bg-white dark:bg-muted text-foreground focus:outline-none"
                  style={{ borderRadius: 'var(--radius)' }}
                >
                  <option value="">— Nepriradený —</option>
                  {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              ) : (
                <span className="text-foreground">{task.assignee?.name ?? '—'}</span>
              )}
            </div>

            {/* Project */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1">Projekt</label>
              {canEditFull ? (
                <select
                  value={task.project_id ?? ''}
                  onChange={e => handleFieldChange('project_id', e.target.value || null)}
                  className="w-full px-2 py-1.5 text-sm rounded border border-border bg-white dark:bg-muted text-foreground focus:outline-none"
                  style={{ borderRadius: 'var(--radius)' }}
                >
                  <option value="">— Bez projektu —</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.quote_number} · {p.customer_name}</option>)}
                </select>
              ) : (
                <span className="text-foreground">{task.project ? `${task.project.quote_number} · ${task.project.customer_name}` : '—'}</span>
              )}
            </div>

            {/* Deadline */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1">Termín</label>
              {canEditFull ? (
                <input
                  type="datetime-local"
                  value={task.deadline ? task.deadline.slice(0, 16) : ''}
                  onChange={e => handleFieldChange('deadline', e.target.value ? new Date(e.target.value).toISOString() : null)}
                  className="w-full px-2 py-1.5 text-sm rounded border border-border bg-white dark:bg-muted text-foreground focus:outline-none"
                  style={{ borderRadius: 'var(--radius)' }}
                />
              ) : (
                <span className="text-foreground">{task.deadline ? format(new Date(task.deadline), 'dd.MM.yyyy HH:mm') : '—'}</span>
              )}
            </div>

            {/* Read-only meta */}
            <div className="border-t border-border pt-3 space-y-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block">Vytvoril</label>
                <span className="text-sm text-foreground">{task.creator?.name ?? '—'}</span>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block">Vytvorené</label>
                <span className="text-sm text-foreground">{format(new Date(task.created_at), 'dd.MM.yyyy HH:mm')}</span>
              </div>
              {task.completed_at && (
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block">Dokončené</label>
                  <span className="text-sm text-foreground">{format(new Date(task.completed_at), 'dd.MM.yyyy HH:mm')}</span>
                </div>
              )}
            </div>

            {/* Delete */}
            {canEditFull && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 text-xs text-destructive hover:text-destructive/80 transition-colors mt-2"
              >
                <Trash2 className="w-3.5 h-3.5" /> Vymazať úlohu
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
