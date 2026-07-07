# Simontini

A deforestation alert monitor: an interactive map of recent, satellite-detected
forest-loss alerts across Indonesia, Malaysia, mainland SE Asia, the Philippines,
and Papua. Built for forest monitors, environmental NGOs, investigative
journalists, and researchers who need to go from "where is it happening" to "who
does this land belong to and why does it matter" in under a minute.

## Features

- **Interactive alert map** with filtering by date range, alert size (hectares),
  country, deforestation driver, and original source
- **Alert detail card** showing administrative crossings (province, district,
  island, watershed), territorial overlaps (concessions, protected areas,
  community claims, moratorium maps), and a before/after satellite comparator
- **Command palette** (⌘K / Ctrl+K) for keyboard-first navigation: search alert
  codes, switch basemaps, open reports, share and embed alerts
- **Theme switcher** with light, dark, and system modes — persisted across
  refreshes with no flash of the wrong theme
- **Per-alert report page** with field story, crossings table, comments thread,
  and print-to-PDF support
- **Embed mode** (`?embed=1`) for placing a focused alert view inside an article
- **Deep linking** (`?alert=ID`) to share a selected alert directly
- **Full dark mode** including maplibre controls, attribution, scale bar, and
  map tiles
- **Accessibility**: WCAG 2.1 AA contrast targets, keyboard navigation,
  `prefers-reduced-motion` honored, color never the sole carrier of meaning

## Tech stack

- **React 19** with TypeScript (strict mode)
- **Vite 6** for dev server and builds
- **Tailwind CSS v4** with the `@tailwindcss/vite` plugin
- **shadcn/ui** primitives (Radix UI, CVA, cmdk)
- **maplibre-gl** + **react-map-gl** for the map
- **react-router-dom** for routing

## Getting started

```bash
npm install
npm run dev
```

The dev server runs on `http://localhost:5173`.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server with HMR |
| `npm run build` | Type-check (`tsc --noEmit`) then build for production |
| `npm run preview` | Preview the production build locally |
| `npm run typecheck` | Run TypeScript type checking only |

## Project structure

```
src/
  components/       App-level components
    ui/             shadcn/ui primitives (button, dialog, select, etc.)
  routes/           Page-level routes (MapPage, ReportPage)
  lib/              Data, types, utilities
  index.css         Tailwind theme tokens + component CSS
  main.tsx          Entry point
```

### Key components

- **`MapView`** — the maplibre map surface with alert polygons, pulse animation,
  basemap switching, and view reset
- **`FilterPanel`** — the filter grammar (date mode, month range, hectares
  range, country, driver, source)
- **`CommandPalette`** — the ⌘K command palette for keyboard navigation
- **`AlertCard`** — the floating alert summary with crossings and comparator
- **`BeforeAfterCompare`** — the clip-path satellite image comparator
- **`ThemeProvider` / `ThemeToggle`** — light/dark/system theme with persistence

## Routes

| Path | Description |
|---|---|
| `/` | The alert map with sidebar, filters, and command palette |
| `/alert/:id` | Full per-alert report with crossings, story, and comments |

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `⌘K` / `Ctrl+K` | Open the command palette |
| `Esc` | Close the alert detail card |
| `Esc Esc` | Reset view, filters, and search to defaults |

## Design tokens

Colors, typography, spacing, and elevation are defined as CSS custom properties
in `src/index.css`. The palette uses a forestry-native canopy green as the
single brand accent and an alert orange reserved exclusively for the map data
layer. Neutrals are tinted toward the brand hue in light mode and neutral black
in dark mode. See `DESIGN.md` for the full token reference.

## Quality

- TypeScript `strict: true`, zero type errors
- React Doctor score: **100/100**
- No `any` types, no unsafe casts, no `@ts-ignore`

## License

Demo data is illustrative. Replace `src/lib/data.ts` with a real GeoJSON API
feed when a backend exists.