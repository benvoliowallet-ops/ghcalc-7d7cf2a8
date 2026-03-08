import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Check, Trash2, Send, CheckCheck } from 'lucide-react';
import { useComments, ProjectComment } from '@/hooks/useComments';
import { useAuthStore } from '@/store/authStore';

interface ProjectCommentsProps {
  projectId: string | null;
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
      style={{ background: 'hsl(var(--teal) / 0.2)', color: 'hsl(var(--teal))' }}
    >
      {initials || '?'}
    </div>
  );
}

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString('sk-SK', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

function CommentItem({
  comment,
  onToggle,
  onDelete,
  canDelete,
}: {
  comment: ProjectComment;
  onToggle: () => void;
  onDelete: () => void;
  canDelete: boolean;
}) {
  return (
    <div
      className={`flex gap-2 p-3 border-b transition-colors ${comment.resolved ? 'opacity-50' : ''}`}
      style={{ borderColor: 'hsl(var(--white) / 0.07)' }}
    >
      <Avatar name={comment.author_name} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-semibold" style={{ color: 'hsl(var(--white) / 0.85)' }}>
            {comment.author_name}
          </span>
          <span className="text-xs" style={{ color: 'hsl(var(--white) / 0.3)' }}>
            {formatTime(comment.created_at)}
          </span>
          {comment.resolved && (
            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'hsl(var(--teal) / 0.15)', color: 'hsl(var(--teal))' }}>
              ✓ vyriešené
            </span>
          )}
        </div>
        <p className="text-sm leading-relaxed break-words" style={{ color: 'hsl(var(--white) / 0.7)' }}>
          {comment.body}
        </p>
      </div>
      <div className="flex flex-col gap-1 flex-shrink-0">
        <button
          onClick={onToggle}
          title={comment.resolved ? 'Označiť ako nevyriešené' : 'Označiť ako vyriešené'}
          className="w-6 h-6 flex items-center justify-center rounded transition-colors"
          style={{ color: comment.resolved ? 'hsl(var(--teal))' : 'hsl(var(--white) / 0.25)' }}
        >
          <CheckCheck className="w-3.5 h-3.5" />
        </button>
        {canDelete && (
          <button
            onClick={onDelete}
            title="Zmazať"
            className="w-6 h-6 flex items-center justify-center rounded transition-colors"
            style={{ color: 'hsl(var(--white) / 0.2)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'hsl(0 80% 65%)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'hsl(var(--white) / 0.2)')}
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

export function ProjectCommentsPanel({ projectId }: ProjectCommentsProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const { currentUser } = useAuthStore();
  const { comments, loading, addComment, toggleResolved, deleteComment, unresolvedCount } = useComments(projectId);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [open, comments.length]);

  const handleSend = async () => {
    if (!input.trim()) return;
    await addComment(input);
    setInput('');
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!projectId) return null;

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 flex items-center justify-center shadow-lg transition-all"
        style={{
          background: 'hsl(var(--navy))',
          border: '1px solid hsl(var(--white) / 0.15)',
          borderRadius: '50%',
          boxShadow: '0 4px 20px hsl(var(--navy) / 0.8)',
        }}
        title="Komentáre k projektu"
      >
        <MessageSquare className="w-5 h-5" style={{ color: 'hsl(var(--teal))' }} />
        {unresolvedCount > 0 && (
          <span
            className="absolute -top-1 -right-1 w-5 h-5 text-xs font-bold flex items-center justify-center rounded-full"
            style={{ background: 'hsl(var(--orange))', color: 'hsl(var(--white))' }}
          >
            {unresolvedCount > 9 ? '9+' : unresolvedCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          className="fixed bottom-20 right-6 z-50 w-80 flex flex-col shadow-2xl overflow-hidden"
          style={{
            borderRadius: 'calc(var(--radius) + 4px)',
            background: 'hsl(var(--navy))',
            border: '1px solid hsl(var(--white) / 0.1)',
            boxShadow: '0 8px 40px hsl(var(--navy) / 0.9)',
            maxHeight: '480px',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: 'hsl(var(--white) / 0.08)' }}
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" style={{ color: 'hsl(var(--teal))' }} />
              <span className="text-sm font-bold" style={{ color: 'hsl(var(--white))' }}>
                Komentáre
              </span>
              {unresolvedCount > 0 && (
                <span
                  className="text-xs px-1.5 py-0.5 font-semibold rounded"
                  style={{ background: 'hsl(var(--orange) / 0.2)', color: 'hsl(var(--orange))' }}
                >
                  {unresolvedCount} otvorených
                </span>
              )}
            </div>
            <button onClick={() => setOpen(false)} style={{ color: 'hsl(var(--white) / 0.4)' }}>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Comments list */}
          <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
            {loading && (
              <div className="p-4 text-center text-xs" style={{ color: 'hsl(var(--white) / 0.3)' }}>
                Načítavam...
              </div>
            )}
            {!loading && comments.length === 0 && (
              <div className="p-6 text-center">
                <MessageSquare className="w-8 h-8 mx-auto mb-2" style={{ color: 'hsl(var(--white) / 0.15)' }} />
                <p className="text-xs" style={{ color: 'hsl(var(--white) / 0.3)' }}>
                  Zatiaľ žiadne komentáre.<br />Pridaj prvý.
                </p>
              </div>
            )}
            {comments.map(c => (
              <CommentItem
                key={c.id}
                comment={c}
                onToggle={() => toggleResolved(c)}
                onDelete={() => deleteComment(c.id)}
                canDelete={c.author_id === currentUser?.id || currentUser?.role === 'admin'}
              />
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div
            className="border-t p-3"
            style={{ borderColor: 'hsl(var(--white) / 0.08)' }}
          >
            <div className="flex gap-2 items-end">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nová poznámka… (Ctrl+Enter odošle)"
                rows={2}
                className="flex-1 resize-none text-sm px-3 py-2 focus:outline-none"
                style={{
                  background: 'hsl(var(--white) / 0.06)',
                  border: '1px solid hsl(var(--white) / 0.12)',
                  borderRadius: 'var(--radius)',
                  color: 'hsl(var(--white))',
                }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="w-9 h-9 flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40"
                style={{
                  background: 'hsl(var(--teal))',
                  borderRadius: 'var(--radius)',
                  color: 'hsl(var(--white))',
                }}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs mt-1" style={{ color: 'hsl(var(--white) / 0.25)' }}>
              Ctrl+Enter odošle
            </p>
          </div>
        </div>
      )}
    </>
  );
}
