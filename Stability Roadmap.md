# Stability Roadmap

## Purpose

Recover the current VCF Midwest game prototype into a stable, testable, maintainable state without adding new gameplay features. The goal is to stop regressions, harden the current runtime, and then replace the brittle UI layer with a simpler and more durable model.

This roadmap is intentionally stability-first. No feature work should be accepted until the exit criteria for the stabilization phases are met.

## Non-Goals

- No new quest types
- No new inventory mechanics
- No new map content beyond test fixtures
- No visual polish work that is not required for consistency or correctness
- No large engine rewrite unless a smaller boundary replacement fails

## Working Rules

1. Feature freeze until the acceptance gates in Phase 6 are green.
2. Every production bug fixed must either gain an automated check or be added to the manual regression checklist.
3. One source of truth per concern: dialog state, score state, inventory state, quest state, input state.
4. Prefer simplification over abstraction. Remove duplicate logic before introducing new layers.
5. Keep data-driven content files if they are structurally sound. Replace code boundaries before replacing content.
6. Any defect found during this plan is triaged immediately as blocker, high, medium, or low. Blockers and highs are fixed before advancing phases.

## Current Stability Risks

### Confirmed defects

- Quest completion calls a missing UI API.
- Dialog open state is checked in multiple places, but not owned in one place.
- Inventory collection and inventory display are not wired consistently.
- Inventory removal is referenced but not implemented.
- Domain data loads asynchronously, but vendor interactions can occur before data is ready.
- Scale behavior is inconsistent between config-time and runtime.
- HUD layout is hard-coded to screen coordinates.
- Input clearing is duplicated across UI and gameplay code.
- Cache-busting query strings in index.html are literal strings, not dynamic values.
- There is no automated test suite.

### Structural causes

- Managers communicate through mutable scene globals.
- Multiple systems own overlapping interaction behavior.
- Layout logic is half-abstracted: there is a custom layout subsystem, but production dialogs still use manual geometry.
- Collision authoring depends on custom tileset object metadata and implicit map conventions.
- There is no deterministic test mode for gameplay flows.

## Phase 0: Baseline And Controls

### Objective

Create a repeatable local workflow that can detect breakage before gameplay work continues.

### Tasks

- Add a minimal project scaffold for quality tooling.
- Add npm-based scripts for lint, static checks, unit tests, browser tests, and content validation.
- Add a JavaScript static analysis configuration.
  - Recommended: checkJs via jsconfig.json or tsconfig.json.
- Add ESLint for fast feedback on undefined methods, duplicate branches, and inconsistent state access.
- Add a browser test runner.
  - Recommended: Playwright for end-to-end smoke and gameplay checks.
- Add a lightweight unit test runner.
  - Recommended: Vitest for pure logic and content validation tests.
- Add one top-level document that explains how to run the stability checks locally.
- Record the current manual smoke path.
  - Boot game
  - Open vendor dialog
  - Open and close help
  - Open and close quest log
  - Collect an item
  - Complete a quest

### Exit Criteria

- One command runs static checks.
- One command runs unit and validation tests.
- One command runs browser smoke tests.
- The project can be served and exercised locally without undocumented steps.

## Phase 1: Stop The Bleeding

### Objective

Fix the known contract mismatches and race conditions before broader refactoring.

### Tasks

- Normalize score updates to one UI API.
  - Replace the addScore versus updateScore mismatch.
- Centralize dialog state.
  - DialogManager should own modal state or publish it through one consistent interface.
  - All callers must use that same source of truth.
- Make item collection consistent.
  - A collected item must update quests and inventory through one shared path.
  - If item dropping is out of scope, remove the dead removeItem path until it is deliberately rebuilt.
- Block vendor and fact interactions until domains are loaded.
  - Either preload domains before enabling interaction or gate the actions behind readiness.
- Normalize boot order.
  - Asset load, data load, scene setup, input enablement, then interaction enablement.
- Remove fake cache-busting strings from index.html.
- Replace repeated mobile detection and scale mutations with one boot-time decision.
- Consolidate input reset logic.
  - Buttons and dialogs should not each reset movement independently.
  - Introduce one safe method for suspending and resuming player input.
- Review duplicate pointer handlers.
  - InputManager, VendorManager, NPCManager, and UI buttons currently overlap.
  - Ensure one clear ownership path for interaction.

### Exit Criteria

- No known runtime exceptions on the main smoke path.
- Dialog state cannot desynchronize across systems.
- Collecting an item updates the right data model every time.
- No interaction is possible before required data is loaded.

## Phase 2: Stabilization Test Foundation

### Objective

Add tests around the behavior that has been regressing.

### Test Layers

#### Static and structure checks

- Undefined method and property usage
- Import path and module consistency
- Dead branch and duplicate state access detection

#### Unit tests

- DomainManager data loading and lookup behavior
- QuestManager quest generation with deterministic fixture data
- Quest progress updates on item collection
- Session serialization and restoration
- Dialog pagination calculations
- Any extracted utility for input suspension, scale selection, or UI state mapping

#### Content validation tests

- vendors.json references valid domain ids
- technology_domains.json has required fields
- map.json contains required layers and object layers
- Required player spawn markers exist
- Required vendor and NPC areas exist

#### Browser gameplay smoke tests

- Game boots without console errors
- Opening a dialog suppresses movement
- Closing a dialog restores movement safely
- Vendor interaction opens exactly one dialog
- Collecting an item updates the quest log
- Completing a quest does not throw and updates score
- Help, quest, and inventory panels open and close without side effects

### Required enabling work

- Add a deterministic test mode.
  - Stable vendor assignment
  - Stable quest generation seed or fixed fixtures
  - Predictable initial player position where needed
- Add a lightweight test harness entry point if the default boot path is too coupled.

### Exit Criteria

- Critical gameplay smoke scenarios are automated.
- At least one regression test exists for every Phase 1 defect.
- Test results are consistent across repeated runs.

## Phase 3: Architecture Hardening

### Objective

Reduce the number of ways state can drift before rebuilding the UI.

### Tasks

- Shrink scene-global coupling.
  - Managers should depend on explicit collaborators instead of discovering mutable state ad hoc.
- Introduce a small game state boundary.
  - Score
  - Inventory
  - Active dialog state
  - Quest state
  - Readiness flags for content loading
- Introduce a single interaction coordinator.
  - Pointer and keyboard interaction should flow through one ownership boundary.
- Separate pure logic from rendering.
  - Quest state transitions and content lookups should not require Phaser objects.
- Remove duplicate UI side effects.
  - Button clicks should trigger actions, not mutate gameplay internals directly.
- Centralize boot readiness.
  - The game should know when map, vendors, domains, player, and UI are ready.

### Likely code outcomes

- A shared state service or simple store object
- A UI facade between scene logic and presentation
- Smaller manager responsibilities
- Fewer direct scene property writes

### Exit Criteria

- Core state has one owner per concern.
- Quest and inventory logic can be tested without booting the full scene.
- Input, dialog, and interaction flows are understandable from one control path.

## Phase 4: Collision And Map Hardening

### Objective

Make map iteration safe enough for annual floor-plan changes.

### Tasks

- Document one collision authoring convention.
  - Preferred outcome: one explicit collision layer or one clearly defined object-metadata rule.
- Validate map requirements automatically.
  - Required layers
  - Required object layers
  - Required tileset metadata if still used
- Create a tiny fixture map for automated collision and spawn tests.
- Verify player spawn, vendor placement, and NPC area assumptions in tests.
- Reduce hidden conventions.
  - Hard-coded collidable layer names should be moved to configuration or explicit validation.
- Add a debug-only collision verification mode if needed during map authoring.

### Exit Criteria

- A changed map fails fast when required layers or markers are missing.
- Collision behavior is reproducible on a fixture map.
- Annual content updates can be validated without manual exploration first.

## Phase 5: UI Rebuild For Stability

### Objective

Replace the brittle in-canvas UI layer with a DOM and CSS overlay while preserving existing gameplay behavior.

### Scope

Only rebuild the existing UI surfaces:

- Score and top-level HUD
- Vendor dialog
- Help dialog
- Quest panel
- Inventory panel

No new UI features should be added in this phase.

### Approach

- Keep Phaser responsible for world rendering, movement, collisions, and NPC placement.
- Move menus, panels, and dialogs into a DOM overlay mounted above the canvas.
- Drive overlay state from explicit game actions and state changes.
- Use CSS layout for responsiveness instead of manual pixel coordinates.
- Use one modal controller.
  - One open dialog at a time
  - Focus management
  - Escape behavior
  - Consistent close semantics
- Replace hard-coded HUD coordinates with responsive layout containers.

### Migration plan

1. Build a minimal overlay shell and mount it without changing gameplay.
2. Port one dialog flow end to end.
   - Recommended first slice: vendor interaction dialog.
3. Port help, quest, and inventory views.
4. Port score and static HUD controls.
5. Remove the old canvas-based dialog and HUD logic after parity is verified.

### Required tests

- Responsive layout checks at desktop and mobile widths
- Modal open and close behavior
- No gameplay movement while modal is active
- Screenshot or visual regression tests for the key UI states

### Exit Criteria

- UI layout is controlled by CSS and DOM structure, not scene coordinates.
- Modal behavior is consistent across all existing panels.
- UI regression checks exist for the main views.

## Phase 6: Final Stabilization Gate

### Objective

Freeze the recovered prototype into a dependable baseline for future work.

### Acceptance checklist

- No console errors during the main smoke path
- Static checks pass
- Unit tests pass
- Content validation tests pass
- Browser gameplay smoke tests pass
- Mobile and desktop UI checks pass
- Collision fixture tests pass
- Manual regression checklist passes once on desktop and once on mobile emulation

### Manual regression checklist

- Boot game
- Move player with keyboard
- Move player with pointer or touch input if supported
- Open and close help
- Open and close quests
- Open and close inventory
- Approach a vendor and interact once
- Collect an item
- Confirm quest progress advances
- Complete a quest and verify score update
- Confirm dialog closure does not trigger stray movement
- Confirm collision boundaries stop movement as expected

## Recommended Execution Order

1. Phase 0 tooling and scripts
2. Phase 1 defect fixes and race-condition cleanup
3. Phase 2 automated regression coverage
4. Phase 3 architecture hardening
5. Phase 4 collision and map hardening
6. Phase 5 UI rebuild
7. Phase 6 final gate and freeze

Do not start the UI rebuild before the test foundation exists. Otherwise the UI migration will simply move regressions into a new layer.

## Rough Timeline

Assuming focused stability work with no feature additions:

- Phase 0: 1 to 2 days
- Phase 1: 2 to 4 days
- Phase 2: 3 to 5 days
- Phase 3: 3 to 5 days
- Phase 4: 2 to 4 days
- Phase 5: 5 to 8 days
- Phase 6: 1 to 2 days

Estimated total: 3 to 5 weeks of focused work.

## Immediate Next Steps

1. Add baseline tooling and scripts.
2. Fix the confirmed runtime contract mismatches.
3. Add the first browser smoke tests around the current UI before changing the UI implementation.
4. Only then begin the UI replacement slice.