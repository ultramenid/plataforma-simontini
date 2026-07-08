# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

React 19 + TypeScript (strict) on Vite 6. Tailwind CSS v4 via `@tailwindcss/vite`. shadcn/ui (`new-york` style) on Radix UI primitives. react-router-dom v7. maplibre-gl + react-map-gl for the map. No state-management library — local state / React context only (see `ThemeProvider`).

Import alias `@/*` → `./src/*` (matches `tsconfig.json` and `vite.config.ts` — keep both in sync if it ever changes).

## Commands

- `npm run dev` — dev server on `http://localhost:5173`
- `npm run typecheck` — `tsc --noEmit`
- `npm run lint` — ESLint (flat config in `eslint.config.js`: typescript-eslint + react-hooks + react-refresh)
- `npm run build` — runs typecheck, then `vite build`

There is no formatter or test framework configured. Do not assume Prettier/Vitest exist. Before considering a change done, run `npm run typecheck` and `npm run lint` and confirm both are clean.

## Quality bar

This codebase maintains zero TypeScript errors with no `any`, no unsafe casts, and no `@ts-ignore`. Preserve that bar in every change — don't introduce any of these to silence a type error; fix the underlying type instead.

**Naming:** Always use meaningful, descriptive variable and parameter names. Never use single letters or opaque abbreviations — `res` → `response`, `fid` → `featureId`, `k` → `districtRecord`, `v` → `value`, `c` → `comment`. Readers must infer intent from the name alone. The only allowed exceptions are tight loop indices (`i`, `j`, `k`) where meaning is unambiguous from context, and domain-idiomatic letters (`x`/`y` for pixel coords, `r`/`g`/`b` for color channels). Encode type hints in names (`isLoading`, `alertCache`, `districtFilter`, `cachedTileUrl`), and rename any non-English or opaque external API parameter to a clear English name at the import boundary. When in doubt, spell it out (`alertId` over `id` when ambiguous; `eventsByRegion` over `data`).

## Engineering rules

These are binding, adapted from the LTKL-Platform development rules to this stack.

**No logic duplication.** If the same logic block appears in 2+ places, extract it into a shared helper in `src/lib/` — don't pre-extract for a single occurrence, and don't extract when the branches differ fundamentally. Copy-paste logic is a bug waiting to happen.

**Data integrity & backward compatibility.** Refactors must not silently discard user data, break the existing `localStorage` schema (see `ThemeProvider`), or change URL query-param formats (`?embed=1`, `?alert=ID` deep links). If a format must change, write a versioned, invertible migration that logs a warning, and keep a rollback path. Preserve optional hooks/entry points so existing callers don't break.

**Minimality & edge cases.** Change only what's asked — no scope creep. Strictly preserve correctness. Handle `null`, `undefined`, empty arrays, and `NaN` robustly. Don't flatten or simplify complex/nested data structures without discussion.

**MapLibre hygiene.** Clean up layers and event listeners in the `useEffect` return (map removal, source/layer teardown). Separate `useEffect`s by responsibility — map init once vs. layer/data loading driven by state — so dependency arrays stay clear and avoid race conditions.

**Error boundaries.** Wrap independent functional areas (route or container level — e.g. map view vs. sidebar vs. report sections) in error boundaries so one component crash doesn't take down the whole page. Boundaries are a safety net for render-phase errors only; async errors, event-handler errors, and promise rejections still need their own try/catch and per-component error/loading state. Prefer per-area boundaries over a single top-level one so the error message stays specific.

**Catch without a variable.** If a `catch` block only swallows the error (no-op), omit the binding — `} catch { /* abaikan */ }`, not `} catch (e) { }`.

## Design is a contract, not documentation

`DESIGN.md` and `PRODUCT.md` at the repo root are binding specs, not background reading — read them before any UI change. They pin exact color tokens (light-theme only, OKLCH values), typography (Poppins + IBM Plex Mono for codes/figures only), spacing/z-index scale, and explicit prohibitions: no nested cards, no glassmorphism/decorative blur, no gradient text. `DualRange` is intentionally custom (shadcn's `Slider` is single-thumb only) — don't swap it back.

`PRODUCT.md` describes the brand as "forensic, calm, civic" — explicitly not a glossy SaaS climate dashboard or a dataviz demo toy. Data leads, story supports; the single pulsing alert outline is the only allowed motion flourish beyond standard transitions. Respect `prefers-reduced-motion`.

## Gotchas

- **Embed mode** (`?embed=1`) and **deep links** (`?alert=ID`) are first-class query-param-driven modes with their own layout/interaction rules (see DESIGN.md's "Edge cases" section) — test both when touching routing, `ThemeProvider`, or map view logic.
- Embed mode can run inside a sandboxed iframe: `localStorage` and `matchMedia` calls must be guarded against `SecurityError` (see recent history on `ThemeProvider`).
- `src/lib/data.ts` is placeholder demo data standing in for a future real GeoJSON API feed — there is no backend yet.
- `prototype/` (the legacy HTML/CSS/JS this app's design was migrated from) is gitignored and may not exist in a fresh clone, even though DESIGN.md references it as the token source of origin.
