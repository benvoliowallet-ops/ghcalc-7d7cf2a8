import { useState, useRef, useEffect } from 'react';

type Msg = { role: 'user' | 'assistant'; content: string };

const SUGGESTED = [
  'Ako fungujú zóny v projekte?',
  'Čo je NORMIST a ako ho vyplniť?',
  'Ako vybrať správne čerpadlo?',
];

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
    } catch { /* ignore */ }
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
      } catch { /* ignore */ }
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
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: 'assistant', content: 'Ahoj! Som VORA AI Asistent. Ako ti môžem pomôcť s GreenHouse Calc?' }]);
    }
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
              return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
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

  return (
    <>
      {/* Floating button */}
      <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-2">
        {/* Tooltip */}
        <div
          className={`
            text-xs font-semibold px-2.5 py-1 rounded-full border border-teal/40 bg-navy text-teal
            whitespace-nowrap transition-all duration-200 pointer-events-none
            ${open ? 'opacity-0 translate-y-1' : 'opacity-0 group-hover:opacity-100'}
          `}
          style={{ marginBottom: '2px' }}
          aria-hidden
        >
          Spýtaj sa ma
        </div>

        <div className="group relative">
          {/* Hover label */}
          <div className="absolute bottom-full right-0 mb-2 pointer-events-none">
            <div className={`
              text-xs font-semibold px-2.5 py-1 rounded-full border border-teal/40 bg-navy text-teal
              whitespace-nowrap transition-all duration-200
              opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0
              ${open ? '!opacity-0' : ''}
            `}>
              Spýtaj sa ma
            </div>
          </div>

          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="VORA AI Asistent"
            className={`
              w-12 h-12 rounded-full shadow-lg border-2 flex items-center justify-center
              transition-all duration-200 hover:scale-105 active:scale-95
              ${open
                ? 'border-teal bg-teal/20 ring-2 ring-teal/40'
                : 'border-teal/40 bg-navy hover:border-teal'}
            `}
          >
            <img
              src="/lovable-uploads/029f5085-4877-4e0f-902e-565d9bab748c.png"
              alt="VORA"
              className="w-8 h-8 object-contain"
            />
          </button>
        </div>
      </div>

      {/* Chat panel */}
      <div
        className={`
          fixed bottom-36 right-4 z-50 w-[360px] flex flex-col
          rounded-xl border border-white/10 shadow-2xl bg-navy
          transition-all duration-300 origin-bottom-right
          ${open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}
        `}
        style={{ maxHeight: '520px' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <img
              src="/lovable-uploads/029f5085-4877-4e0f-902e-565d9bab748c.png"
              alt="VORA"
              className="w-6 h-6 object-contain"
            />
            <span className="text-sm font-semibold text-foreground">VORA AI Asistent</span>
            <span className="w-2 h-2 rounded-full bg-teal animate-pulse" />
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-muted-foreground hover:text-foreground transition-colors text-lg leading-none"
            aria-label="Zatvoriť"
          >
            ×
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2" style={{ minHeight: 0 }}>
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`
                  max-w-[85%] text-sm px-3 py-2 rounded-xl leading-relaxed
                  ${msg.role === 'user'
                    ? 'bg-teal text-white rounded-br-sm'
                    : 'bg-white/8 text-foreground rounded-bl-sm border border-white/10'}
                `}
                style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
              >
                {msg.content}
                {msg.role === 'assistant' && loading && i === messages.length - 1 && (
                  <span className="inline-block w-1.5 h-3.5 bg-teal ml-0.5 animate-pulse rounded-sm align-middle" />
                )}
              </div>
            </div>
          ))}

          {/* Suggested questions (show only when just the greeting is visible) */}
          {messages.length === 1 && !loading && (
            <div className="flex flex-col gap-1.5 mt-1">
              {SUGGESTED.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="text-left text-xs px-3 py-2 rounded-lg border border-teal/30 text-teal hover:bg-teal/10 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {error && (
            <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
              ⚠ {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-white/10 px-3 py-2.5 flex gap-2 items-center shrink-0">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
            }}
            placeholder="Spýtaj sa na softvér..."
            disabled={loading}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-teal/50 disabled:opacity-50 transition-colors"
          />
          <button
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            className="px-3 py-1.5 rounded-lg bg-teal hover:bg-teal/90 text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            {loading ? '...' : '→'}
          </button>
        </div>
      </div>
    </>
  );
}
