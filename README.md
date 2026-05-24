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

Run browser smoke tests:

```bash
npm run test:e2e
```

Run the full baseline suite:

```bash
npm test
```

## Current Test Scope

- Content validation for domains, vendors, and map structure
- Browser smoke coverage for boot and runtime errors during initial load

Gameplay-flow and UI regression coverage will expand in later stabilization phases.