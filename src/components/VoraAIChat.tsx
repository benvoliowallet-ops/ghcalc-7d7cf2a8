import { useState, useRef, useEffect, useCallback } from 'react';

type Msg = { role: 'user' | 'assistant'; content: string };

const SUGGESTED = [
  'Ako fungujú zóny v projekte?',
  'Čo je NORMIST a ako ho vyplniť?',
  'Ako vybrať správne čerpadlo?',
];

const DEFAULT_BOTTOM = 80;
const MIN_BOTTOM = 16;

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vora-ai`;

async function streamChat({
  messages,
  onDelta,
  onDone,
  signal,
}: {
  messages: Msg[];
  onDelta: (chunk: string) => void;
  onDone: () => void;
  signal: AbortSignal;
}) {
  const resp = await fetch(CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages }),
    signal,
  });

  if (!resp.ok || !resp.body) {
    let errMsg = 'Chyba spojenia.';
    try {
      const j = await resp.json();
      errMsg = j.error ?? errMsg;
    } catch {/* ignore */}
    throw new Error(errMsg);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = '';
  let streamDone = false;

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;
    textBuffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);
      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (line.startsWith(':') || line.trim() === '') continue;
      if (!line.startsWith('data: ')) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === '[DONE]') { streamDone = true; break; }
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {
        textBuffer = line + '\n' + textBuffer;
        break;
      }
    }
  }

  if (textBuffer.trim()) {
    for (let raw of textBuffer.split('\n')) {
      if (!raw) continue;
      if (raw.endsWith('\r')) raw = raw.slice(0, -1);
      if (!raw.startsWith('data: ')) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === '[DONE]') continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {/* ignore */}
    }
  }

  onDone();
}

export function VoraAIChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Drag state
  const [bottomOffset, setBottomOffset] = useState(DEFAULT_BOTTOM);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{
    startY: number;
    startBottom: number;
    moved: boolean;
  } | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auto-reset to default position when opening chat
  useEffect(() => {
    if (open) {
      setIsAnimating(true);
      setBottomOffset(DEFAULT_BOTTOM);
      setTimeout(() => setIsAnimating(false), 300);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: 'assistant', content: 'Ahoj! Som VORA AI Asistent. Ako ti môžem pomôcť s GreenHouse Calc?' }]);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const maxBottom = typeof window !== 'undefined' ? window.innerHeight - 80 : 800;

  const onDragMove = useCallback((clientY: number) => {
    if (!dragRef.current) return;
    const delta = dragRef.current.startY - clientY;
    if (Math.abs(delta) > 5) dragRef.current.moved = true;
    const newBottom = Math.min(maxBottom, Math.max(MIN_BOTTOM, dragRef.current.startBottom + delta));
    setBottomOffset(newBottom);
  }, [maxBottom]);

  const onDragEnd = useCallback(() => {
    if (!dragRef.current) return;
    const wasDrag = dragRef.current.moved;
    dragRef.current = null;
    setIsDragging(false);
    if (!wasDrag) {
      setOpen(v => !v);
    }
  }, []);

  // Mouse events
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = { startY: e.clientY, startBottom: bottomOffset, moved: false };
    setIsDragging(true);
  }, [bottomOffset]);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => onDragMove(e.clientY);
    const onUp = () => onDragEnd();
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDragging, onDragMove, onDragEnd]);

  // Touch events
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    dragRef.current = { startY: touch.clientY, startBottom: bottomOffset, moved: false };
    setIsDragging(true);
  }, [bottomOffset]);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: TouchEvent) => { e.preventDefault(); onDragMove(e.touches[0].clientY); };
    const onEnd = () => onDragEnd();
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
    return () => {
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [isDragging, onDragMove, onDragEnd]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setError(null);
    setInput('');

    const userMsg: Msg = { role: 'user', content: trimmed };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setLoading(true);

    abortRef.current = new AbortController();
    let assistantSoFar = '';

    try {
      await streamChat({
        messages: nextMessages,
        signal: abortRef.current.signal,
        onDelta: (chunk) => {
          assistantSoFar += chunk;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === 'assistant') {
              return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
            }
            return [...prev, { role: 'assistant', content: assistantSoFar }];
          });
        },
        onDone: () => setLoading(false),
      });
    } catch (e: unknown) {
      if ((e as Error).name !== 'AbortError') {
        setError((e as Error).message ?? 'Neznáma chyba');
      }
      setLoading(false);
    }
  };

  const btnTransition = isAnimating ? 'transition-all duration-300' : isDragging ? '' : 'transition-[right]';

  return (
    <>
      {/* Floating button */}
      <div
        className={`fixed z-50 flex flex-col items-end gap-2 ${btnTransition}`}
        style={{ bottom: bottomOffset, right: 16 }}>

        <div className="group relative">
          {/* Hover label */}
          <div className="absolute bottom-full right-0 mb-2 pointer-events-none">
            <div className={`
              text-xs font-semibold px-2.5 py-1 rounded-full border border-navy bg-white text-navy
              shadow whitespace-nowrap transition-all duration-200
              opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0
              ${open ? '!opacity-0' : ''}
            `}>
              Spýtaj sa ma
            </div>
          </div>

          <button
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
            aria-label="VORA AI Asistent"
            className={`
              relative w-12 h-12 rounded-full shadow-lg border-2 flex items-center justify-center
              transition-[border-color,box-shadow,transform] duration-200
              hover:scale-105 active:scale-95 bg-white select-none
              ${isDragging ? 'cursor-grabbing scale-105 shadow-xl' : 'cursor-grab'}
              ${open ? 'border-navy ring-2 ring-navy/30' : 'border-navy hover:border-teal'}
            `}>

            {/* Drag hint dots — visible on hover */}
            <span className={`
              absolute -left-1 top-1/2 -translate-y-1/2 text-[10px] leading-none text-navy/30
              transition-opacity duration-150
              ${isDragging ? 'opacity-60' : 'opacity-0 group-hover:opacity-50'}
            `} aria-hidden>⠿</span>

            <img
              alt="VORA"
              className="w-8 h-8 object-contain pointer-events-none"
              src="/lovable-uploads/ba9fde5a-1b5b-4c79-a6ac-cfa28de6816c.png"
            />
          </button>
        </div>
      </div>

      {/* Chat panel — follows button position */}
      <div
        className={`
          fixed z-50 w-[360px] flex flex-col
          rounded-xl border-2 border-navy shadow-2xl bg-white
          transition-all duration-300 origin-bottom-right
          ${open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}
        `}
        style={{ bottom: bottomOffset + 64, right: 16, maxHeight: '520px' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-navy rounded-t-[10px] shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">VORA AI Asistent</span>
            <span className="w-2 h-2 rounded-full animate-pulse bg-green-600" />
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-white/60 hover:text-white transition-colors text-xl leading-none"
            aria-label="Zatvoriť">
            ×
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2 bg-white" style={{ minHeight: 0 }}>
          {messages.map((msg, i) =>
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`
                  max-w-[85%] text-sm px-3 py-2 rounded-xl leading-relaxed
                  ${msg.role === 'user'
                    ? 'bg-teal text-white rounded-br-sm'
                    : 'bg-slate-100 text-navy rounded-bl-sm border border-navy/20'}
                `}
                style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {msg.content}
                {msg.role === 'assistant' && loading && i === messages.length - 1 &&
                  <span className="inline-block w-1.5 h-3.5 bg-teal ml-0.5 animate-pulse rounded-sm align-middle" />
                }
              </div>
            </div>
          )}

          {/* Suggested questions */}
          {messages.length === 1 && !loading &&
            <div className="flex flex-col gap-1.5 mt-1">
              {SUGGESTED.map((q) =>
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="text-left text-xs px-3 py-2 rounded-lg border border-navy/30 text-navy hover:bg-navy/5 transition-colors">
                  {q}
                </button>
              )}
            </div>
          }

          {error &&
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              ⚠ {error}
            </div>
          }

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t-2 border-navy/20 px-3 py-2.5 flex gap-2 items-center shrink-0 bg-white rounded-b-[10px]">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
            }}
            placeholder="Spýtaj sa na softvér..."
            disabled={loading}
            className="flex-1 bg-slate-50 border border-navy/30 rounded-lg px-3 py-1.5 text-sm text-navy placeholder:text-navy/40 focus:outline-none focus:border-teal disabled:opacity-50 transition-colors"
          />
          <button
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            className="px-3 py-1.5 rounded-lg bg-navy hover:bg-navy/90 text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
            {loading ? '...' : '→'}
          </button>
        </div>
      </div>
    </>
  );
}
