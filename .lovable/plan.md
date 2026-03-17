
## What the new template brings vs. current code

The uploaded HTML template (`email_templates_v2_2.html`) is a major visual redesign:

### Visual differences
| Element | Current | New template |
|---|---|---|
| Font | Segoe UI / system-ui | Raleway (Google Fonts — not usable in email, falls back to Arial) |
| Header | Dark bar + SVG piktogram left + full logo right | Dark bar (#002a4c) + Sanfog PNG logo left (piktogram) + "GREENHOUSE CALC" text right |
| Color bar | Teal banner with icon + headline | 4px accent color stripe below header |
| Badge | None | Colored pill badge ("Nová úloha", "Nový komentár", "Dokončené") |
| Body layout | Single column with task card | Single column with `h1` + `p` greeting + box card |
| Task card | Table with project/status/deadline/sender rows | Same rows but different styling (gray labels, bold values) |
| Comment block | Not present | Dedicated comment block with blue-left-border quote + author + timestamp |
| CTA button | Centered teal button | Colored button matching accent (orange/teal/green per type) |
| Footer | Light bar with VORA SVG | Dark (#002a4c) bar with VORA PNG logo centered |
| Logos | Inline SVG data URIs | Inline base64 PNG data URIs (already embedded in the HTML) |

### 3 notification types and their accent colors
- `assigned` → orange `#f38f00`
- `comment` → teal `#00adc6`
- `completed` → green `#1a6b2e`

### Key data in the template
- `S` variable = base64 PNG of Sanfog piktogram (50×50, already embedded)
- `V` variable = base64 PNG of VORA logo (44px height, already embedded)
- Both logos are already base64-encoded in the uploaded HTML — can be extracted directly

### Comment template specifics
The comment notification (`t1`) adds a comment block inside the box:
- Author name + timestamp
- Italic quoted comment text with left cyan border

This means the edge function needs a new field: `commentText` + `commentAuthor` + `commentAt` in the payload for comment-type notifications.

### What changes

**`supabase/functions/send-task-notification/index.ts`** — full `buildHtml` rewrite:

1. Extract real base64 PNGs from the uploaded HTML (`S` = Sanfog piktogram, `V` = VORA logo) and replace the current SVG data URIs
2. Rewrite `buildHtml` to match the new visual structure:
   - New header with `<table>`-based layout (email-safe, no flexbox)
   - 4px accent color stripe
   - Badge + h1 + greeting paragraph
   - Box card with table rows
   - Comment block (for `comment` type) with author + timestamp + quote
   - Colored CTA button
   - Dark footer centered with VORA logo
3. Update `HtmlPayload` interface to add optional `commentText`, `commentAuthor`, `commentAt` fields
4. Update `buildSubject` to use proper Slovak diacritics (the template uses full Slovak: "Nová úloha:", "Nový komentár k úlohe:", subject includes who completed it)
5. Fix Slovak text throughout (current code has stripped diacritics like "Bola vam priradena" — new should use "Bola vám pridelená")
6. Update the handler to pass `commentText`/`commentAuthor`/`commentAt` when `type === 'comment'`

**No changes needed** to the Deno handler logic, Resend integration, auth, or any front-end files.

### Logo extraction
The `S` and `V` base64 strings from the uploaded HTML will be inlined directly as `const SANFOG_PIKT_B64` and `const VORA_B64` — no encoding needed, they're already there.

### Email client compatibility note
The new template uses `<table>`-based layout (email-safe). The `display:flex` in the original code breaks in Outlook desktop — the new template fixes this by using proper table layout throughout.
