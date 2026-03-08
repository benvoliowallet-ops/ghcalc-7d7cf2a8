
## Plan: Redesign the Login Page

The current login page is a plain navy background with a centered card. The user wants something more visually impressive — inspired by the social image style (rich gradient, geometric shapes, depth).

### What I'll build

A full-screen split/layered design using only CSS — no new image assets needed:

**Background layer:**
- Deep navy base (`#002a4c`)
- Animated/layered radial gradients using the teal (`#00adc6`) and a hint of orange (`#f38f00`) to create light blooms — similar to a social image effect
- Subtle geometric grid or diagonal lines overlay using pure CSS (repeating-linear-gradient) to give texture
- Abstract decorative circles/blobs in the corners with low opacity teal/navy tones

**Card redesign:**
- Give the card a frosted-glass feel: semi-transparent dark background (`bg-white/5` or `bg-navy/80`) with `backdrop-blur`
- Border: subtle teal glow (`border-teal/20`)
- Logo section above the card gets more breathing room and a subtle glow halo behind it

**Typography upgrades:**
- "Greenhouse Calc" title gets slightly larger, with a teal accent underline or highlight
- Subtitle uses teal color instead of plain white/40

**Details:**
- Decorative teal horizontal line above the card title
- Input fields styled for dark background (dark fill, teal focus glow)
- Submit button with a slight gradient (teal to teal-dark)

### Files to change

- `src/components/auth/LoginPage.tsx` — full visual redesign
- `src/index.css` — add `.login-bg` helper class with the CSS gradient/texture background

### Visual concept (ASCII)

```text
┌──────────────────────────────────────────────┐
│  [teal glow bloom top-right]                 │
│                                              │
│        [orange glow bloom bottom-left]       │
│                                              │
│    ┌──── frosted glass card ─────────┐       │
│    │  [SANFOG LOGO large]            │       │
│    │  GREENHOUSE CALC                │       │
│    │  ─────────────────              │       │
│    │  [tabs: Prihlásiť / Registr.]  │       │
│    │  Email ___________________      │       │
│    │  Heslo ___________________      │       │
│    │  [ PRIHLÁSIŤ SA → ]             │       │
│    └─────────────────────────────────┘       │
│                                              │
│  made by VORA [logo]                         │
└──────────────────────────────────────────────┘
```

No external images or new packages needed — pure CSS gradients + Tailwind inline styles.
