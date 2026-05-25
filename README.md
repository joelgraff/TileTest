# TileTest

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

Run static checks and content validation:

```bash
npm run check
```

This now runs ESLint, content validation, and unit regression tests.

Run browser smoke tests:

```bash
npm run test:e2e
```

Run the full baseline suite:

```bash
npm test
```

## Stable Test API

Browser smoke tests should use `window.__tileTest.testApi` when the game is running with `?test=1`.
Keep browser setup and assertions on that test surface instead of reaching through `window.__tileTest.scene` or manager internals.
The API is defined in `testModeApi.js` and is intended to remain stable across refactors unless runtime behavior changes.

## Current Test Scope

- Content validation for domains, vendors, and map structure
- Unit regression coverage for quest generation, quest progress, session persistence, dialog pagination, input handling, inventory behavior, and readiness guards
- Browser smoke coverage for boot and runtime errors during initial load
- Browser smoke coverage for vendor interaction, item collection, and panel open/close behavior

## Collision Authoring Convention

Collision is authored through embedded tileset object metadata in `assets/map.json`.
The runtime reads collision rectangles from every non-empty tile used by the `tables` and `tabletops` layers.
If a tile is added to either collision layer, its tileset entry must define at least one rectangle with positive `width` and `height`.
Those layers should also keep an explicit `depth` property so rendering order remains data-driven.