# TileTest

## Product Direction

The canonical scope, gameplay, and final-form architecture document is [Game Vision.md](Game%20Vision.md).

Use that document as the source of truth for what the game is trying to become.

Older planning and brainstorming files remain in the repo as reference material, but they should no longer be treated as the authoritative product brief:

- `vcf_quest_outline.md`
- `Revised Implementation Plan.md`
- `quest_template_discussion.txt`
- `help.json`

## Stability Work

This repo is currently under a stability-first recovery plan. No new feature work should begin until the baseline checks and defect cleanup phases are complete.

See:

- [Stability Roadmap.md](Stability%20Roadmap.md)
- [Implementation Checklist.md](Implementation%20Checklist.md)

## Prerequisites

- Python 3
- Node.js and npm

If Playwright browsers are not installed yet, run the browser install step after `npm install`.

## Phase 0 Commands

Install dependencies:

```bash
npm install
```

Install Playwright browser binaries:

```bash
npm run test:e2e:install
```

If the browser install reports missing OS libraries, install those separately through your system package manager.

Serve the game locally:

```bash
npm run serve
```

This static frontend path is the GitHub Pages-compatible demo mode. It must keep working without the Node server, dashboard, account system, or live API. When opened from a static host, backend-powered features should degrade quietly and the game should continue using bundled JSON content.

Run the hosted prototype server with the vendor dashboard and live announcement API:

```bash
npm run serve:live
```

The game remains available at `http://localhost:5000/`, and the dashboard is available at `http://localhost:5000/dashboard`.
Dashboard announcement edits are stored in memory and appear in vendor dialogs after the browser-side live content service fetches the update.
The hosted server is optional for development and demonstration; use it only when testing dashboard/live-content behavior.

Run static checks and content validation:

```bash
npm run check
```

This now runs ESLint, content validation, and unit regression tests.

For the draft full VCF map readiness report, run:

```bash
node tests/content/reportFullMapReadiness.js
```

The report is non-destructive: it shows the draft map inventory, layer mapping hints, blocking runtime-contract issues, informational notes, and grouped next actions for converting the export toward the current Phaser runtime contract.

To preview the layer-only runtime conversion in memory without writing any map files, run:

```bash
node tests/content/reportMapConversionPreview.js
```

The preview copies likely draft layers into the five required runtime layer names, creates empty placeholders for missing runtime layers, and then reports the remaining blockers that still require real map authoring.

The focused readiness test is `npx vitest run tests/content/full-map-readiness.test.js`.

Run browser smoke tests:

```bash
npm run test:e2e
```

The Playwright static suite starts its own Python static server on `127.0.0.1:5199` by default so manual live-server sessions on port 5000 cannot pollute static verification. Use `PLAYWRIGHT_STATIC_PORT=<port>` to choose another static test port, or `PLAYWRIGHT_BASE_URL=<url>` when intentionally pointing the browser tests at an already-running server.

Run the full baseline suite:

```bash
npm test
```

## Stable Test API

Browser smoke tests should use `window.__tileTest.testApi` when the game is running with `?test=1`.
Keep browser setup and assertions on that test surface instead of reaching through `window.__tileTest.scene` or manager internals.
The API is defined in `testModeApi.js` and is intended to remain stable across refactors unless runtime behavior changes.

## DOM Overlay Status

The Phaser canvas now sits under `#ui-overlay-root`.
The score display, HUD controls, vendor dialogs, quest-completion dialogs, and the help, inventory, plus quest panel flows now render into that DOM overlay.
The runtime no longer falls back to the legacy Phaser canvas UI for HUD or dialog rendering.
Responsive Playwright checks now cover a narrow mobile viewport for the overlay shell, and visual snapshot coverage now tracks overlay-only HUD, help, inventory, and quest states without depending on the animated canvas underneath.

## Current Test Scope

- Content validation for domains, vendors, and map structure
- Unit regression coverage for quest generation, quest progress, session persistence, dialog pagination, input handling, inventory behavior, and readiness guards
- Browser smoke coverage for boot and runtime errors during initial load
- Browser smoke coverage for vendor interaction, item collection, quest completion, and panel open/close behavior
- Browser visual coverage for the main overlay HUD, help, inventory, and quest states
- Browser stabilization-gate coverage for the roadmap regression checklist on desktop and mobile emulation

## Recovered Baseline

As of 2026-05-25, the recovered baseline is frozen at:

- `npm run check` passing with clean ESLint, 10 content tests, and 106 unit tests across 37 files
- `npx vitest run tests/unit/map-fixture-contracts.test.js` passing as the explicit collision fixture gate
- `npx playwright test` passing with 13 browser tests, including smoke, visual regression, and desktop/mobile stabilization-gate coverage

Release note: [Frozen Baseline 2026-05-25](Frozen%20Baseline%202026-05-25.md)

Re-establish this baseline before starting any new feature work.

## Collision Authoring Convention

Collision is authored through embedded tileset object metadata in `assets/map.json`.
The runtime reads collision rectangles from every non-empty tile used by the `tables` and `tabletops` layers.
If a tile is added to either collision layer, its tileset entry must define at least one rectangle with positive `width` and `height`.
Those layers should also keep an explicit `depth` property so rendering order remains data-driven.

## Map Runtime Contracts

The runtime expects a tileset named `tiles` in `assets/map.json`.
Runtime maps must define the default layer set: `floor`, `tables`, `player`, `npc_area`, and `tabletops`.
The `player` object layer must contain exactly one `start` point marker.
The `npc_area` object layer must contain exactly one `rect` object plus one or more `point` spawn markers.

## Collision Debug Verification

The existing backquote debug toggle is the collision verification mode for runtime checks.
When enabled, it recreates collision state and draws tile-authored collision shapes plus instantiated collision bodies so collision authoring mismatches are visible during manual inspection.