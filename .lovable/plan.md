
## Plan: Fix TypeScript errors + embed real logos in `send-task-notification`

### Two problems to solve

**1. TypeScript strict-mode errors** — 17 `TS7006`/`TS7053` errors because every helper function has untyped parameters. Deno's edge function runtime rejects these.

**2. Logo placeholders** — The current code uses crude hand-drawn SVG placeholders. The real brand SVGs are already in the project (`src/assets/sanfog-logo-white.svg`, `sanfog-logo-color.svg`). The PNG files exist in the project root but cannot be served from GitHub (404). Since the edge function runs on Deno (no filesystem access to project files), the best approach is to **inline the real SVG source directly** as data URIs — no base64 PNG needed.

### Logo strategy

| Position in email | Current placeholder | Replace with |
|---|---|---|
| Header left — piktogram (36×36 icon) | Crude circle+lines SVG | Extract just the **piktogram paths** from `sanfog-logo-white.svg` (the globe/waves icon portion, `viewBox="0 0 74 109"` approx) |
| Header right — full "sanfog" wordmark | SVG text "sanfog" | Full `sanfog-logo-white.svg` real paths |
| Footer right — VORA | SVG text "VORA" | Keep as styled SVG text (no VORA asset available in assets, only `src/assets/vora-logo.png` which is a PNG we can't inline for email without base64) |

Actually the real SVG assets are:
- `sanfog-logo-white.svg` — full horizontal logo (piktogram + "sanfog" wordmark) — white version, perfect for the dark `#0a2236` header
- `sanfog-logo-color.svg` — color version

For the email header, I'll use `sanfog-logo-white.svg` on the right side (full logo), and extract the piktogram paths from it for the left icon.

Looking at the SVG: the piktogram consists of 2 path elements (the two wave arcs) in `viewBox="0 0 239.38 109.13"`. The icon part occupies roughly `x: 34–69, y: 36–69`. I'll use the full SVG cropped with `viewBox="34 36 40 40"` for the piktogram icon.

For VORA: `src/assets/vora-logo.png` exists — it's a PNG. Since we can't easily inline a PNG in the edge function without build tooling, I'll keep a clean SVG text mark for VORA but improve it significantly with proper styling.

### What changes

**File: `supabase/functions/send-task-notification/index.ts`** — complete rewrite of the top section:

1. **Add TypeScript types** at the top:
   ```typescript
   type NotifType = 'assigned' | 'completed' | 'comment';
   type Priority = 'urgent' | 'high' | 'medium' | 'low';
   type TaskStatus = 'todo' | 'in_progress' | 'done';
   interface HtmlPayload { taskTitle: string; taskStatus: TaskStatus; taskPriority: Priority; taskDeadline: string | null; taskDescription: string | null; senderName: string; recipientName: string; projectRef: string; projectName: string; }
   ```

2. **Replace SVG placeholders** with real brand SVGs:
   - `SANFOG_PIKT_SVG`: Use the actual piktogram paths from `sanfog-logo-white.svg` with a viewBox cropped to just the icon area (`"34 36 40 40"`), wrapped in a white-fill SVG with dark background square
   - `SANFOG_FULL_SVG`: Use the real `sanfog-logo-white.svg` full paths with correct viewBox
   - `VORA_SVG`: Improved styled SVG text (no asset available)

3. **Add type annotations** to all helper functions:
   - `toDataUri(svg: string): string`
   - `buildSubject(type: NotifType, taskTitle: string): string`
   - `priorityLabel(p: Priority): string` — use `as Record<Priority, string>` cast to fix TS7053
   - `priorityColor(p: Priority): string`
   - `priorityBg(p: Priority): string`
   - `statusLabel(s: TaskStatus): string`
   - `statusColor(s: TaskStatus): string`
   - `formatDeadline(d: string | null): string`
   - `buildHtml(type: NotifType, payload: HtmlPayload): string`

4. No logic changes to the Deno.serve handler or Resend integration.

### Technical note on SVG data URIs in email clients

Most email clients (Gmail, Outlook web, Apple Mail) support `data:image/svg+xml` URIs for `<img>` tags. Outlook desktop (2016/2019) does not support them, but the rest of the email still renders correctly — logos just show as broken images in those clients. This is acceptable and the same limitation would apply to base64 PNGs that aren't hosted externally. For full Outlook desktop compatibility, logos would need to be hosted at a public URL.
