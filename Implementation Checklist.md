# Implementation Checklist

## Ground Rules

- [ ] Keep the project in feature freeze until the stability gate passes.
- [ ] Add either an automated check or a manual regression step for every defect fixed.
- [ ] Maintain one source of truth for dialog, input, quest, inventory, and score state.
- [ ] Do not begin UI replacement work until the Phase 0 and Phase 1 checks are running.

## Phase 0: Baseline And Controls

### Tooling

- [ ] Add a package manifest and repeatable project scripts.
- [ ] Add a repo ignore file for tooling artifacts.
- [ ] Add baseline JavaScript project configuration for editor support.
- [ ] Add ESLint configuration for the current browser and test code.
- [ ] Add Vitest configuration for content validation and future unit tests.
- [ ] Add Playwright configuration for browser smoke tests.
- [ ] Add a top-level setup and test document.

### Environment

- [ ] Install Node.js and npm on the development machine.
- [ ] Install npm dependencies.
- [ ] Install Playwright browser binaries.

### Initial Test Coverage

- [ ] Validate technology_domains.json structure.
- [ ] Validate vendors.json structure and domain references.
- [ ] Validate required map layers and object markers.
- [ ] Add a browser smoke test for boot and runtime errors.

### Phase 0 Validation

- [ ] Run lint.
- [ ] Run content validation tests.
- [ ] Run browser smoke tests.
- [ ] Document any environment blockers or failing baseline checks.

## Phase 1: Stop The Bleeding

- [ ] Normalize score updates to one API.
- [ ] Centralize modal and dialog state ownership.
- [ ] Unify item collection so quests and inventory update through one path.
- [ ] Remove or rebuild dead inventory actions such as item removal.
- [ ] Gate vendor interactions on domain readiness.
- [ ] Normalize boot order and interaction enablement.
- [ ] Remove fake cache-busting strings from index.html.
- [ ] Replace repeated scale and device checks with one boot-time decision.
- [ ] Consolidate input suspension and movement reset behavior.
- [ ] Remove duplicate pointer interaction ownership.
- [ ] Add regression tests for every defect fixed here.

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