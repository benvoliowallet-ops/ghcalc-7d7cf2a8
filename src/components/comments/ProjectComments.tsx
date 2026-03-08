import { useState, useRef, useEffect } from 'react';
import { MessageSquare, CheckCheck, Trash2, Send } from 'lucide-react';
import { useComments, ProjectComment } from '@/hooks/useComments';
import { useAuthStore } from '@/store/authStore';

interface InlineCommentsProps {
  projectId: string;
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
      style={{ background: 'hsl(var(--teal) / 0.15)', color: 'hsl(var(--teal))' }}
    >
      {initials || '?'}
    </div>
  );
}

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString('sk-SK', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
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
    <div className={`flex gap-3 py-3 border-b border-border last:border-b-0 transition-opacity ${comment.resolved ? 'opacity-50' : ''}`}>
      <Avatar name={comment.author_name} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className="text-sm font-semibold text-foreground">{comment.author_name}</span>
          <span className="text-xs text-muted-foreground">{formatTime(comment.created_at)}</span>
          {comment.resolved && (
            <span
              className="text-xs px-1.5 py-0.5 font-semibold"
              style={{ background: 'hsl(var(--teal) / 0.1)', color: 'hsl(var(--teal))', borderRadius: 'var(--radius)' }}
            >
              ✓ vyriešené
            </span>
          )}
        </div>
        <p className="text-sm text-foreground/80 leading-relaxed break-words">{comment.body}</p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={onToggle}
          title={comment.resolved ? 'Označiť ako otvorené' : 'Označiť ako vyriešené'}
          className="w-7 h-7 flex items-center justify-center rounded transition-colors hover:bg-muted"
          style={{ color: comment.resolved ? 'hsl(var(--teal))' : 'hsl(var(--muted-foreground))' }}
        >
          <CheckCheck className="w-4 h-4" />
        </button>
        {canDelete && (
          <button
            onClick={onDelete}
            title="Zmazať"
            className="w-7 h-7 flex items-center justify-center rounded transition-colors hover:bg-destructive/10 text-muted-foreground/40 hover:text-destructive"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

export function InlineProjectComments({ projectId }: InlineCommentsProps) {
  const [input, setInput] = useState('');
  const { currentUser } = useAuthStore();
  const { comments, loading, addComment, toggleResolved, deleteComment, unresolvedCount } = useComments(projectId);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden" style={{ borderRadius: 'var(--radius)' }}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <MessageSquare className="w-4 h-4" style={{ color: 'hsl(var(--teal))' }} />
        <span className="font-bold text-foreground uppercase tracking-wide text-sm">Komentáre</span>
        {unresolvedCount > 0 && (
          <span
            className="text-xs px-2 py-0.5 font-semibold ml-1"
            style={{ background: 'hsl(var(--orange) / 0.12)', color: 'hsl(var(--orange))', borderRadius: 'var(--radius)' }}
          >
            {unresolvedCount} otvorených
          </span>
        )}
        {unresolvedCount === 0 && comments.length > 0 && (
          <span
            className="text-xs px-2 py-0.5 font-semibold ml-1"
            style={{ background: 'hsl(var(--teal) / 0.1)', color: 'hsl(var(--teal))', borderRadius: 'var(--radius)' }}
          >
            Všetky vyriešené ✓
          </span>
        )}
      </div>

      {/* Comments list */}
      <div className="px-4 max-h-72 overflow-y-auto">
        {loading && (
          <p className="py-4 text-sm text-muted-foreground text-center">Načítavam...</p>
        )}
        {!loading && comments.length === 0 && (
          <div className="py-8 text-center">
            <MessageSquare className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Žiadne komentáre. Pridaj prvý.</p>
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
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border bg-muted/30">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nová poznámka… (Ctrl+Enter odošle)"
            rows={2}
            className="flex-1 resize-none text-sm px-3 py-2 border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
            style={{ borderRadius: 'var(--radius)' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="h-9 px-3 flex items-center gap-1.5 text-sm font-semibold transition-all disabled:opacity-40"
            style={{
              background: 'hsl(var(--teal))',
              color: 'hsl(var(--white))',
              borderRadius: 'var(--radius)',
            }}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs mt-1 text-muted-foreground">Ctrl+Enter odošle</p>
      </div>
    </div>
  );
}
