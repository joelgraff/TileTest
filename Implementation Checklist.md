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
- [x] Triage the remaining baseline ESLint warnings.

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

- [x] Add deterministic test mode or stable fixtures.
- [x] Add quest generation tests with fixed data.
- [x] Add quest progress tests for item collection.
- [x] Add session persistence tests.
- [x] Add dialog pagination tests.
- [x] Expand browser tests for vendor interaction, quest progress, and modal behavior.

## Phase 3: Architecture Hardening

- [x] Reduce direct scene-global coupling between managers.
	- Complete: `main.js` now injects explicit collaborators into `UIManager`, `DialogManager`, `VendorManager`, and `InputManager`, and its create-time boot sequencing routes through `sceneBootstrap.js`; `InputManager` and `VendorManager` now receive shared state explicitly in composition; movement-input gating now routes through shared state in `inputDirectionResolver.js` and `inputPointerHandlers.js` instead of scene booleans; `PlayerManager` and `NPCManager` now pause against shared game state rather than scene-global flags; `VendorManager` receives explicit dialog/item collaborators plus its NPC group, player, camera, game-object factory, and test-mode flag; `DialogLayout` and `ButtonFactory` receive only the injected `prepareUiInteraction(...)` callback; `UIManager` movement-indicator and HUD construction route through helpers; `DialogManager` open/close input effects route through explicit callbacks; `MapManager` stores layers in `scene.mapLayers`; `QuestManager` receives `testMode` explicitly; `CollisionManager` delegates to focused helper modules; scene boolean flags remain only as bound compatibility surfaces through `stateBindings.js`; and player/input target ownership routes through `InputManager` methods instead of direct `PlayerManager` access to input internals.
- [x] Introduce a small shared state boundary for core gameplay state.
- [x] Introduce a single interaction coordinator.
	- Complete: `interactionCoordinator.js` now owns the global non-movement interaction path for nearby-vendor pointer interception plus keyboard shortcuts for vendor interaction, panel toggles, dialog close, and debug-toggle dispatch; `inputPointerHandlers.js` delegates vendor-click interception into that coordinator instead of registering a second `pointerdown` listener; `sceneRuntimeSetup.js` now only hands debug toggling into that coordinator; and the coordinator depends on explicit UI-input and pointer-suppression callbacks rather than whole manager objects.
- [x] Separate pure quest and content logic from rendering concerns.
	- Complete: vendor dialog-model construction now routes through `vendorDialogModels.js` with `VendorManager` retaining only interaction orchestration and callback wiring, vendor dialog presentation and item collection route through explicit collaborators instead of a broad `UIManager` object, `DialogManager.showDialog(...)` routes its layout and render orchestration through `dialogRenderSurface.js`, dialog image/text rendering details route through `dialogContentRenderer.js`, pure dialog text pagination routes through `dialogTextPagination.js`, button plus bottom-button pagination route through `dialogButtonPagination.js`, and `UIManager` inventory, help, quest, and quest-completion dialog payload construction routes through `uiDialogModels.js` instead of remaining inline beside UI state toggles and `showDialog(...)` calls.
- [x] Route UI actions through one facade instead of direct gameplay mutations.
- [x] Centralize readiness and initialization state.
	- Complete: `interactionsEnabled` now lives in shared state and is exposed back through the scene via `stateBindings.js`; boot-time quest readiness composition lives in `bootReadiness.js` with explicit collaborators; scene manager construction plus collaborator wiring lives in `sceneComposition.js`; scene world setup lives in `sceneWorldSetup.js`; post-create camera/debug runtime setup lives in `sceneRuntimeSetup.js`; and create-time boot sequencing now lives in `sceneBootstrap.js` instead of remaining inline in `main.js`.

## Phase 4: Collision And Map Hardening

- [x] Define one collision authoring convention.
- [x] Validate required map layers, objects, and metadata automatically.
- [x] Add a small fixture map for collision and spawn tests.
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