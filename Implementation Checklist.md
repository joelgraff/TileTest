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

- [ ] Reduce direct scene-global coupling between managers.
	- In progress: `main.js` now injects explicit collaborators into `UIManager`, `DialogManager`, `VendorManager`, and `InputManager`, and its create-time boot sequencing now routes through `sceneBootstrap.js` instead of remaining inline; `VendorManager` now receives explicit dialog/item collaborators plus its NPC group, player, camera, game-object factory, and test-mode flag for assignment, nearby-vendor prompt updates, dialog presentation, and item collection instead of retaining a whole `UIManager` dependency; `DialogLayout` and `ButtonFactory` now receive only the injected `prepareUiInteraction(...)` callback so dialog buttons no longer reach through `scene.inputManager` or retain a whole input manager in that path; `UIManager` movement-indicator initialization, pointer projection, and fade behavior now route through `uiMovementIndicator.js`, while score display, HUD buttons, and version-label construction now route through `uiHudFactory.js`; `InputManager` now receives an explicit `handlePointerMove(...)` callback in production wiring instead of retaining a whole `UIManager`, while its pointerdown/move/up registration routes through `inputPointerHandlers.js`, its movement-direction gating routes through `inputDirectionResolver.js`, and pointer suppression stays latched across dialog-open pointer release and is explicitly released when the dialog closes without an active pointer still down; `DialogManager` open/close input effects now route through explicit `prepareUiInteraction(...)` and `releasePointerSuppression(...)` callbacks instead of a broad behavioral dependency on `inputManager`; `PlayerManager` now resolves movement direction once per frame instead of rediscovering it through `InputManager` across movement, animation, and debug paths, and direction-to-animation selection now routes through `playerAnimationResolver.js`; `NPCManager` proximity/exclamation updates now route through `npcInteractionState.js`, while tables-layer depth fallback plus grouped spawn orchestration route through `npcSpawnFactory.js`; `MapManager` now stores tilemap layers in an explicit `scene.mapLayers` registry instead of exporting one scene property per layer; `QuestManager` now receives `testMode` explicitly at construction time instead of discovering it through the whole scene; `CollisionManager` collidable-layer setup now routes through `collisionLayerSetup.js`, player/NPC collider binding now routes through `collisionColliderBinding.js`, tile collision object lookup plus body creation now route through `collisionBodyFactory.js`, collision-body debug drawing and cleanup now route through `collisionBodyDebug.js`, and tile collision debug rendering and teardown now route through `collisionTileDebug.js`, leaving `CollisionManager` as orchestration plus helper delegation; scene boolean flags are bound through `stateBindings.js`; and player/input target ownership now routes through `InputManager` methods instead of direct `PlayerManager` access to input internals.
- [x] Introduce a small shared state boundary for core gameplay state.
- [x] Introduce a single interaction coordinator.
	- Complete: `interactionCoordinator.js` now owns the global non-movement interaction path for nearby-vendor pointer interception plus keyboard shortcuts for vendor interaction, panel toggles, dialog close, and debug-toggle dispatch; `inputPointerHandlers.js` delegates vendor-click interception into that coordinator instead of registering a second `pointerdown` listener; `sceneRuntimeSetup.js` now only hands debug toggling into that coordinator; and the coordinator depends on explicit UI-input and pointer-suppression callbacks rather than whole manager objects.
- [ ] Separate pure quest and content logic from rendering concerns.
	- In progress: vendor dialog-model construction now lives in smaller `VendorManager` helper methods instead of one large nested `interactWithVendor(...)` flow, which makes the vendor dialog tree directly unit-testable, vendor dialog presentation and item collection now route through explicit collaborators instead of a broad `UIManager` object, `DialogManager.showDialog(...)` now routes its layout and render orchestration through `dialogRenderSurface.js` instead of keeping the whole assembly flow inline, dialog image/text rendering details now route through `dialogContentRenderer.js` instead of remaining embedded in `DialogManager`, pure dialog text pagination now routes through `dialogTextPagination.js` instead of remaining embedded in the dialog manager, and button plus bottom-button pagination now routes through `dialogButtonPagination.js`, including the restored dialog page-navigation button contract; `UIManager` inventory, help, quest, and quest-completion dialog payload construction now routes through `uiDialogModels.js` instead of remaining inline beside UI state toggles and `showDialog(...)` calls.
- [x] Route UI actions through one facade instead of direct gameplay mutations.
- [x] Centralize readiness and initialization state.
	- Complete: `interactionsEnabled` now lives in shared state and is exposed back through the scene via `stateBindings.js`; boot-time quest readiness composition lives in `bootReadiness.js` with explicit collaborators; scene manager construction plus collaborator wiring lives in `sceneComposition.js`; scene world setup lives in `sceneWorldSetup.js`; post-create camera/debug runtime setup lives in `sceneRuntimeSetup.js`; and create-time boot sequencing now lives in `sceneBootstrap.js` instead of remaining inline in `main.js`.

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