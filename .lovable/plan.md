
## Plan: AI Chat Assistant (VORA AI) — floating widget bottom-right

### What to build
A floating chat bubble in the bottom-right corner of the app (visible on all pages after login), showing the VORA logo. On hover it shows "Spýtaj sa ma". When clicked it opens a chat panel where users can ask questions about the GreenHouse Calc software. The AI is strictly scoped via a system prompt to answer only questions about the software.

### Architecture

**Backend — new edge function `supabase/functions/vora-ai/index.ts`**
- Receives `{ messages }` array from the frontend
- Prepends a strict Slovak-language system prompt that limits the AI to only answer questions about GreenHouse Calc software (fogové systémy, zóny, čerpadlá, NORMIST, ETNA, objednávky, atď.)
- Calls Lovable AI Gateway with `LOVABLE_API_KEY` (already configured)
- Streams SSE response back
- Uses `google/gemini-2.5-flash` model

**Frontend — new component `src/components/VoraAIChat.tsx`**
- Fixed `bottom-4 right-4` floating button (z-50), above footer
- Shows VORA logo image (`/lovable-uploads/029f5085-4877-4e0f-902e-565d9bab748c.png`)
- On hover: tooltip/label "Spýtaj sa ma"
- On click: opens a chat panel (slide-up, ~380px wide, ~500px tall) anchored bottom-right
- Chat panel has: header "VORA AI Asistent", message list, input + send button
- Renders AI replies with simple markdown (using `dangerouslySetInnerHTML` with basic sanitization or a simple text renderer — no extra library needed)
- Streams tokens token-by-token using the same SSE pattern from the docs

**App.tsx changes**
- Import and render `<VoraAIChat />` inside `AppInner`, after the main div, only when `currentUser` is set (i.e., after login)

**supabase/config.toml**
- Add `[functions.vora-ai]` with `verify_jwt = false` (auth validated in code)

### System prompt (strict scope)
```
Si VORA AI Asistent pre softvér GreenHouse Calc — nástroj na výpočet a projektovanie mlhových závlahových systémov Sanfog. 
Odpovedaj VÝHRADNE na otázky týkajúce sa tohto softvéru: kroky wizarda, výpočty zón, výber čerpadla, NORMIST, ETNA stanica, CAD modul, dokumenty, objednávky, sklad. 
Na otázky mimo tohto softvéru odpovedaj: "Prepáč, môžem ti pomôcť iba s otázkami týkajúcimi sa softvéru GreenHouse Calc." 
Odpovedaj v slovenčine.
```

### Files to create/modify
1. **NEW** `supabase/functions/vora-ai/index.ts` — edge function with streaming
2. **NEW** `src/components/VoraAIChat.tsx` — floating chat widget
3. **EDIT** `src/App.tsx` — add `<VoraAIChat />` inside `AppInner` return (below the main div wrapper, before closing tag)
4. **EDIT** `supabase/config.toml` — add `[functions.vora-ai]` entry

### UI layout

```text
┌─────────────────────────────┐
│ VORA AI Asistent        [×] │  ← navy header
├─────────────────────────────┤
│                             │
│  [AI bubble] Ahoj! Ako      │
│  ti môžem pomôcť?           │
│                             │
│         [User bubble] ...   │
│                             │
├─────────────────────────────┤
│ [input field]  [Odoslať →]  │
└─────────────────────────────┘
              ↕ 8px
         [○ VORA logo]  ← floating button, hover shows "Spýtaj sa ma"
```

No DB changes, no new secrets needed (LOVABLE_API_KEY already exists).
