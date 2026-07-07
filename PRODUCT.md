# Product

## Register

product

## Users

Forest monitors, environmental NGOs, investigative journalists, and researchers
tracking deforestation across Southeast Asia. They work at desks and in the field,
often under time pressure during a breaking clearing event, and need to move from
"where is it happening" to "who does this land belong to and why does it matter" in
seconds. A secondary audience is the public and community advocates who receive a
shared alert link and need to understand it without training. The embed surface
serves editors placing a focused alert view inside an article.

## Product Purpose

Simontini is a deforestation alert monitor: an interactive map of recent,
satellite-detected forest-loss alerts across Indonesia, Malaysia, mainland SE Asia,
the Philippines, and Papua. Users filter by date, area, country, deforestation
driver, and original source; search by alert code; select an alert to see its
location, administrative crossings (province / district / island / watershed),
territorial overlaps (concessions, protected areas, community claims, moratorium
maps), and a before/after satellite comparator; and open a full per-alert report with
field story and a comments thread. Success: a monitor can go from a vague tip to a
defensible, shareable, context-rich alert in under a minute.

## Brand Personality

Forensic, calm, civic. Three words: **precise, trustworthy, urgent-without-alarm**.
The product carries the gravity of forest loss without sensationalizing it — data
leads, story supports. The Simontini canopy-green identity reads as scientific and
forestry-native, not corporate SaaS.

## Anti-references

- Not a glossy SaaS climate-tech dashboard: no dark-mode-for-its-own-sake, no neon
  gradients, no hero-metric KPI theatre, no "AI-generated" cream/sand body.
- Not a generic Google-Maps wrapper: the sidebar, filter grammar, and crossings
  hierarchy are the product, not chrome around a map.
- Not an activist petition site: neutral, evidence-first framing; severity and
  drivers are labels, not calls to action.
- Not a data-viz demo toy: every control must correspond to a real monitoring
  workflow.

## Design Principles

1. **Data leads, story supports.** The map and the alert polygon are the hero;
   narrative and commentary are secondary layers a user opts into.
2. **Show the crossing, not just the dot.** An alert is meaningful because of what
   it overlaps — concessions, protected areas, community claims, watersheds. Surface
   those crossings at the first level of detail.
3. **Forensic calm.** Convey urgency through precision and density, not through
   motion, color saturation, or alarm chrome. The single pulsing alert outline is the
   one allowed flourish; everything else is still.
4. **One surface, many entry points.** The same map supports a full app view, a
   focused embed, a shared deep-link, and a printable report — without redesigning
   each.
5. **Faithful to the source data's grammar.** Codes, dates, hectares, drivers, and
   source names are the vocabulary; the UI is typeset around them (monospace for
   codes and figures, not decoration).

## Accessibility & Inclusion

- Targets WCAG 2.1 AA: body text ≥4.5:1 contrast, controls ≥3:1, visible focus rings
  on all interactive elements (the canopy-light outline already in the prototype is
  the focus token).
- `prefers-reduced-motion: reduce` is honored: the alert-pulse animation and the
  comparator transition are suppressed; no motion gates content visibility.
- Keyboard-first for power surfaces: the command palette (⌘K / Ctrl+K) is fully
  keyboard navigable; map markers are reachable via the code search → select flow.
- All map imagery and the comparator carry alt text describing what changed.
- Color is never the sole carrier of meaning: severity and crossing types pair color
  with text labels (HIGH / MEDIUM / LOW, territory-type names).