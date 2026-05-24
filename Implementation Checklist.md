# Implementation Checklist

## Ground Rules

- [ ] Keep the project in feature freeze until the stability gate passes.
- [ ] Add either an automated check or a manual regression step for every defect fixed.
- [ ] Maintain one source of truth for dialog, input, quest, inventory, and score state.
- [ ] Do not begin UI replacement work until the Phase 0 and Phase 1 checks are running.

## Phase 0: Baseline And Controls

### Tooling

- [x] Add a package manifest and repeatable project scripts.
- [x] Add a repo ignore file for tooling artifacts.
- [x] Add baseline JavaScript project configuration for editor support.
- [x] Add ESLint configuration for the current browser and test code.
- [x] Add Vitest configuration for content validation and future unit tests.
- [x] Add Playwright configuration for browser smoke tests.
- [x] Add a top-level setup and test document.

### Environment

- [x] Install Node.js and npm on the development machine.
- [x] Install npm dependencies.
- [x] Install Playwright browser binaries.

### Initial Test Coverage

- [x] Validate technology_domains.json structure.
- [x] Validate vendors.json structure and domain references.
- [x] Validate required map layers and object markers.
- [x] Add a browser smoke test for boot and runtime errors.

### Phase 0 Validation

- [x] Run lint.
- [x] Run content validation tests.
- [x] Run browser smoke tests.
- [x] Document any environment blockers or failing baseline checks.
- [ ] Triage the remaining baseline ESLint warnings.

## Phase 1: Stop The Bleeding

- [x] Normalize score updates to one API.
- [x] Centralize modal and dialog state ownership.
- [x] Unify item collection so quests and inventory update through one path.
- [x] Remove or rebuild dead inventory actions such as item removal.
- [x] Gate vendor interactions on domain readiness.
- [x] Normalize boot order and interaction enablement.
- [x] Remove fake cache-busting strings from index.html.
- [x] Replace repeated scale and device checks with one boot-time decision.
- [x] Consolidate input suspension and movement reset behavior.
- [x] Remove duplicate pointer interaction ownership.
- [x] Add regression tests for every defect fixed here.

## Phase 2: Regression Harness

- [ ] Add deterministic test mode or stable fixtures.
- [ ] Add quest generation tests with fixed data.
- [ ] Add quest progress tests for item collection.
- [ ] Add session persistence tests.
- [ ] Add dialog pagination tests.
- [ ] Expand browser tests for vendor interaction, quest progress, and modal behavior.

## Phase 3: Architecture Hardening

- [ ] Reduce direct scene-global coupling between managers.
- [ ] Introduce a small shared state boundary for core gameplay state.
- [ ] Introduce a single interaction coordinator.
- [ ] Separate pure quest and content logic from rendering concerns.
- [ ] Route UI actions through one facade instead of direct gameplay mutations.
- [ ] Centralize readiness and initialization state.

## Phase 4: Collision And Map Hardening

- [ ] Define one collision authoring convention.
- [ ] Validate required map layers, objects, and metadata automatically.
- [ ] Add a small fixture map for collision and spawn tests.
- [ ] Move hidden map conventions into explicit configuration or validation.
- [ ] Add a debug-only collision verification mode if needed.

## Phase 5: UI Rebuild

- [ ] Mount a DOM overlay above the Phaser canvas.
- [ ] Port one dialog flow end to end.
- [ ] Port help, inventory, and quest views.
- [ ] Port HUD controls and score display.
- [ ] Add responsive layout checks.
- [ ] Add modal behavior checks.
- [ ] Add visual regression coverage for the main UI states.
- [ ] Remove the old canvas UI after parity is confirmed.

## Phase 6: Stabilization Gate

- [ ] Run the full static check suite.
- [ ] Run all unit and content validation tests.
- [ ] Run browser gameplay smoke tests.
- [ ] Run mobile and desktop UI checks.
- [ ] Run collision fixture tests.
- [ ] Complete the manual regression checklist on desktop.
- [ ] Complete the manual regression checklist on mobile emulation.
- [ ] Freeze the recovered baseline before any new feature work.