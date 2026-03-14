import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useTaskMutations, useProfiles, useProjectList } from '@/hooks/useTasks';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface NewTaskModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
  prefilledProjectId?: string | null;
}

const PRIORITIES = [
  { value: 'low', label: 'Nízka' },
  { value: 'medium', label: 'Stredná' },
  { value: 'high', label: 'Vysoká' },
  { value: 'urgent', label: 'Urgentná' },
];

export function NewTaskModal({ open, onClose, onCreated, prefilledProjectId }: NewTaskModalProps) {
  const { createTask } = useTaskMutations(onCreated);
  const profiles = useProfiles();
  const projects = useProjectList();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [projectId, setProjectId] = useState(prefilledProjectId ?? '');
  const [priority, setPriority] = useState('medium');
  const [deadline, setDeadline] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setTitle(''); setDescription(''); setAssignedTo('');
    setProjectId(prefilledProjectId ?? ''); setPriority('medium');
    setDeadline(''); setError('');
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Názov je povinný.'); return; }
    setSaving(true);
    await createTask({
      title: title.trim(),
      description: description.trim() || undefined,
      assigned_to: assignedTo || null,
      project_id: projectId || null,
      priority,
      deadline: deadline ? new Date(deadline).toISOString() : null,
    });
    setSaving(false);
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nová úloha</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1">
              Názov <span className="text-destructive">*</span>
            </label>
            <input
              autoFocus
              value={title}
              onChange={e => { setTitle(e.target.value); setError(''); }}
              placeholder="Čo treba urobiť?"
              className="w-full px-3 py-2 text-sm rounded border border-border bg-white text-foreground focus:outline-none focus:ring-1 focus:ring-teal"
              style={{ borderRadius: 'var(--radius)' }}
            />
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1">Popis</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="Voliteľný popis..."
              className="w-full px-3 py-2 text-sm rounded border border-border bg-white text-foreground focus:outline-none focus:ring-1 focus:ring-teal resize-none"
              style={{ borderRadius: 'var(--radius)' }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Assigned to */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1">Priradený</label>
              <select
                value={assignedTo}
                onChange={e => setAssignedTo(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded border border-border bg-white text-foreground focus:outline-none focus:ring-1 focus:ring-teal"
                style={{ borderRadius: 'var(--radius)' }}
              >
                <option value="">— Nepriradený —</option>
                {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            {/* Project */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1">Projekt</label>
              <select
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                disabled={!!prefilledProjectId}
                className="w-full px-3 py-2 text-sm rounded border border-border bg-white text-foreground focus:outline-none focus:ring-1 focus:ring-teal disabled:opacity-60"
                style={{ borderRadius: 'var(--radius)' }}
              >
                <option value="">— Bez projektu —</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.quote_number} · {p.customer_name}</option>)}
              </select>
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-2">Priorita</label>
            <RadioGroup value={priority} onValueChange={setPriority} className="flex gap-3 flex-wrap">
              {PRIORITIES.map(p => (
                <div key={p.value} className="flex items-center gap-1.5">
                  <RadioGroupItem value={p.value} id={`priority-${p.value}`} />
                  <Label htmlFor={`priority-${p.value}`} className="text-sm cursor-pointer">{p.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Deadline */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1">Termín</label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded border border-border bg-white text-foreground focus:outline-none focus:ring-1 focus:ring-teal"
              style={{ borderRadius: 'var(--radius)' }}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm rounded border border-border bg-card hover:bg-muted transition-colors"
              style={{ borderRadius: 'var(--radius)' }}
            >
              Zrušiť
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded bg-teal text-white hover:bg-teal/90 disabled:opacity-60 transition-colors"
              style={{ borderRadius: 'var(--radius)' }}
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Vytvoriť
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
