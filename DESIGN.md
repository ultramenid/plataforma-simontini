# Design — Simontini alert monitor

Captured from the existing prototype (`style.css`, `index.html`, `alert.html`).
This is the source of truth for the React/Tailwind/shadcn refactor: tokens are
preserved verbatim (committed brand identity), then mapped to Tailwind theme
variables and shadcn primitives.

## Color

Light theme only. Forestry-native canopy green as the single brand accent; alert
orange as the single data accent. Neutrals are slightly green-tinted (sage), not
warm-cream and not pure gray.

| Token | Value | Role |
|---|---|---|
| `--bg` | `#eef2f1` | app background (overlaid by gradient below) |
| body gradient | `linear-gradient(135deg, #f4f8f7 0%, #e8efed 100%)` | app surface wash |
| `--surface` / `--panel` | `#ffffff` | cards, sidebar, dialogs |
| `--panel-2` | `#f4f8f7` | inset fields, stat bar, hover wash |
| `--line` | `rgba(55,106,100,0.16)` | all hairline borders/dividers |
| `--text` | `#132a27` | body ink (deep forest near-black) |
| `--muted` | `#5a7c78` | secondary text, labels, placeholders (target placeholder `#7a9a95`) |
| `--canopy` | `#376a64` | primary brand / buttons / focus / links / kicker |
| `--canopy-light` | `#4a8f86` | primary hover / focus ring |
| `--high` | `#d94e2e` | severity high badge |
| `--medium` | `#d9921e` | severity medium badge |
| `--low` | `#c9b214` | severity low badge |

Data accents (used only on the map and crossings, never as UI chrome):

| Role | Value |
|---|---|
| alert fill/line/pulse | `#ff5c39` (alert orange) |
| severity high / medium / low | `#ff5c39` / `#ffb02e` / `#f2e04d` |
| crossing watershed | `#4aa8ff` |
| crossing province / concession | `#ff5c39` |
| crossing district / community | `#ffb02e` |
| crossing island / protected | `#63b96b` |
| crossing moratorium | `#7fc7ff` |

OKLCH equivalents (for the Tailwind v4 theme; hex above stays canonical for fidelity):
canopy ≈ `oklch(0.45 0.045 175)`, canopy-light ≈ `oklch(0.55 0.052 175)`,
text ≈ `oklch(0.24 0.03 170)`, muted ≈ `oklch(0.58 0.03 175)`,
alert orange ≈ `oklch(0.66 0.18 38)`.

## Typography

- **Sans:** `Poppins` (300, 400, 500, 600, 700, 800) — body, UI, headings.
- **Mono:** `IBM Plex Mono` (400, 600) — codes, figures, kickers, tags, stats.
- Base size **13px**, line-height **1.5**. Body cap ~65–75ch on the report story.
- Display ceiling: report h1 `28px` (mobile `22px`); sidebar headings `10px`
  uppercase tracked `0.06em`; kickers `10px` mono uppercase tracked `0.08em`.
- `text-wrap: balance` on report h1; `pretty` on story prose.
- No gradient text. No font pairing beyond this one sans + one mono.

## Spacing & radius

- Radius scale: inputs/buttons `6px`, tags `3px`, compare `7px`, stat swatches `2px`,
  card `10px`, command palette `12px`, dialog `12px`.
- Sidebar: brand pad `24px 20px 20px`, stats pad `12px 14px`, filter panel pad `25px`.
- Field gap `16px` (each filter reads as its own unit); label→control gap `8px`;
  section heading margin `24px 0 8px` (first heading `0`); filter-actions gap `8px`,
  actions row top margin `20px`.
- Report: `main` max-width `900px`, pad `22px 16px 60px`; section margin `28px`;
  meta-grid `auto-fit minmax(120px,1fr)` with `12px` left dividers.
- Vary spacing for rhythm; nested cards are forbidden.

## Elevation & shadow

- `--shadow: 0 1px 2px rgba(19,42,39,0.06)` — subtle resting shadow (comparator).
- Floating map search: `0 2px 8px rgba(19,42,39,0.08)` → focus
  `0 4px 18px rgba(55,106,100,0.12)` with canopy-tinted border.
- Alert card: `0 4px 14px rgba(19,42,39,0.1)`.
- Command palette / dialog: `0 20px 50px rgba(19,42,39,0.2), 0 8px 20px rgba(19,42,39,0.12)`.
- No glassmorphism. No decorative blur.

## Layout

- **App shell:** CSS grid `300px 1fr`, full viewport height, `overflow: hidden`.
  Sidebar (brand + stats + filter panel) on the left; map fills the rest.
- **Map overlay layer:** floating search top-center, alert card bottom-left, nav
  control top-right, scale bottom-right, embed badge bottom-left.
- **Mobile (`≤760px`):** grid collapses to `50px 1fr`; brand + stats hidden; a filter
  bar replaces them and the filter panel slides open below (Sheet in the refactor).
- **Report:** single centered column; hero is `1.6fr 1fr` (comparator + minimap),
  collapses to `1fr` on mobile.
- Flexbox for 1D rows (stats, actions, radio rows); grid for 2D (kv-grid `1fr 1fr`,
  meta-grid auto-fit).
- Responsive grid primitive: `repeat(auto-fit, minmax(120px, 1fr))` for meta-grid.

## z-index scale

`map-overlay (10) → command-palette/dialog-backdrop (1000)`. Alert card and map
search sit at 10; map controls are maplibre's own; command palette and modal
backdrops at 1000. No arbitrary 999/9999.

## Components

- **Button (`.btn`):** panel-2 bg, line border, 6px radius, `5px 10px`, hover lifts
  border to canopy-light with `rgba(74,143,134,0.08)` wash. **Primary**: canopy bg,
  white ink, 600 weight, hover canopy-light. Focus ring: `2px canopy-light,
  offset 1px`. → shadcn `Button` with `variant="outline"` / `variant="default"`
  (default = canopy).
- **Select / Input / Textarea:** panel-2 bg, line border, 6px radius, `5px 9px`,
  `12px` text. Placeholder `#7a9a95`. → shadcn `Select`, `Input`, `Textarea`.
- **RadioGroup (date-mode):** inline row, `accent-color: canopy`. → shadcn
  `RadioGroup`.
- **DualRange (month + hectares):** two overlaid native range inputs on a
  `rgba(55,106,100,0.12)` track, gradient fill `canopy→canopy-light`, 18px round
  thumbs with white border and canopy ring-on-hover. Custom component — not a
  shadcn primitive (shadcn Slider is single-thumb). Preserve the thumb-offset fill
  math.
- **Badge (`.sev` / `.tag`):** mono, 9–8px, uppercase tracked, 3px radius, white-on
  severity for `.sev`; outlined muted for `.tag` with type-tinted variants
  (concession=high, protected=canopy, community=medium, moratorium=#3a8fb8). →
  shadcn `Badge` variants.
- **Alert card:** fixed bottom-left, 320px, panel bg, 10px radius, head with
  canopy bottom-border + title + close, body with kv-grid `1fr 1fr`, compare block,
  compare-dates grid `1fr 1fr`, crossings list with color swatches, actions row
  (primary "Open report" + share/embed icon buttons).
- **Command palette (`.cmdk`):** full-screen `rgba(11,21,19,0.45)` backdrop, centered
  520px panel 12px radius, top input, scroll list with icon+label+hint, footer with
  kbd hints. Has a "search alert code" mode that lists matching alerts. → shadcn
  `Command` inside `Dialog`, ⌘K / Ctrl+K trigger.
- **Before/After comparator (`.compare`):** 16:10 (or fill-height on report hero),
  dark `#0b1513` base, two stacked images, `clip-path: inset()` reveal of "before",
  2px white divider with a circular grab handle and `↔` glyph, overlay range input
  (opacity 0, ew-resize). Mono labels top-left/right. No layout animation — only
  clip-path/divider left transition.
- **Embed dialog:** native `<dialog>`, 460px, mono code textarea (canopy ink on
  panel-2), copy button. → shadcn `Dialog`.
- **Separator:** `1px` line color. → shadcn `Separator`.
- **Tooltip:** on icon buttons (share/embed). → shadcn `Tooltip`.

## Motion

- **Alert pulse** (map): sin-driven `line-width` `2→9px` and `line-opacity`
  `0.85→0.20` at ~450ms period via `requestAnimationFrame`. Suppressed under
  `prefers-reduced-motion`.
- **Map fitBounds** on select: `duration: 1400` (instant when deep-linked).
- **Comparator:** clip-path + divider left update on input; no transition needed
  (follows the pointer).
- **Hover micro:** buttons border/bg 0.15s ease; dual-range thumb scale 1.12 +
  canopy ring 0.15s ease; map-search shadow/lift 0.15s ease.
- Global `@media (prefers-reduced-motion: reduce)` kills all animation/transition.
- No bounce/elastic. No motion gates content visibility (alert card opens via
  class, not a transitioned reveal).

## Content & copy

- Alert codes are monospace and always shown verbatim (`ID-RIAU-2481`).
- Dates `en-GB` (`28 Jun 2026`) via `fmtDate`.
- Hectares `toLocaleString()` with `minimumFractionDigits:2` in crossings table.
- Severity is **not** shown on the report detail view (intentional in the source) —
  preserve that.
- Empty comment state: "No comments yet. Add field observations or context below."
- Not-found state for bad alert id: titled "Alert not found" with link back to map.

## Edge cases & states

- **No WebGL:** map container renders a muted paragraph directing to alert
  reports; deep-link selection still works via the card.
- **Embed mode (`?embed=1`):** sidebar hidden, grid becomes `1fr`, embed badge
  bottom-left linking to the full map; "Open report" opens in a new tab.
- **Deep link (`?alert=ID`):** selects the alert on load, updates the URL on
  select/close.
- **Empty filters result:** stats show `0` and the map source is set to an empty
  feature set; no error state.
- **Report not found:** centered not-found block.