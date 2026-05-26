# Frozen Baseline 2026-05-25

## Status

This release note records the recovered TileTest baseline frozen on 2026-05-25.

A git tag was not created at this point because the working tree still contains uncommitted baseline changes. Create the baseline commit first, then tag that commit.

Suggested tag name after commit:

- `baseline-2026-05-25-stability-freeze`

## Scope

This baseline freezes the repo after the full stabilization program:

- Phase 0 through Phase 6 complete in `Implementation Checklist.md`
- DOM overlay HUD and dialog system fully replaces the legacy runtime canvas UI
- Collision authoring and spawn contracts are explicitly validated
- Desktop and mobile stabilization-gate checklist runs are automated

## Validation Snapshot

Validated on 2026-05-25 with the following passing commands:

- `npm run check`
  - clean ESLint
  - 10 content tests
  - 106 unit tests across 37 files
- `npx vitest run tests/unit/map-fixture-contracts.test.js`
  - 2 collision fixture tests
- `npx playwright test`
  - 13 browser tests
  - 7 smoke tests
  - 4 visual regression tests
  - 2 stabilization-gate tests covering desktop and mobile emulation

## Key Outcomes

- Browser test setup is standardized on `window.__tileTest.testApi` in `?test=1` mode
- Overlay visuals are stabilized by isolating the DOM layer from the animated Phaser canvas during screenshot capture
- Runtime HUD and dialogs are DOM-only; the canvas fallback path has been removed from production code
- The roadmap manual regression checklist is now covered by Playwright on both desktop and mobile emulation

## Follow-Up For Tagging

After committing the frozen baseline, create the tag with:

```bash
git tag -a baseline-2026-05-25-stability-freeze -m "Freeze recovered stability baseline on 2026-05-25"
```

If the tag should be published, then push it with:

```bash
git push origin baseline-2026-05-25-stability-freeze
```
