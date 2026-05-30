# Game Vision

## Status

This is the canonical product-direction document for TileTest.

It consolidates the high-level intent that was previously spread across `vcf_quest_outline.md`, `Revised Implementation Plan.md`, `quest_template_discussion.txt`, and the player-facing descriptions in `help.json`.

Those older files are still useful as reference material, but this document is the source of truth for:

- the final-form game experience
- the intended application architecture
- the major systems and services the game should grow toward
- the gap between the current prototype and the actual target product

## Product Summary

TileTest should become a browser-based 2D festival adventure set on the full VCF Midwest floor.

The final game should feel like walking a living show floor, not just harvesting facts from NPCs. The player should explore a large real-world-inspired space, meet exhibitors, learn what is happening around the hall, solve multi-step problems, trade knowledge and parts, attend or unlock demonstrations, and gradually assemble a memorable run through the event.

At the product level, the game also serves a practical purpose: it should promote VCF Midwest, help attendees explore the convention floor, and give exhibitors a digital presence inside the experience.

The current prototype proves that the project can load a map, move through space, interact with vendors, manage inventory, and complete simple procedural quests. That foundation is useful, but it is not yet a compelling game.

## Product Purpose

TileTest is not only a game. It is a hybrid of:

- a playable VCF Midwest floor guide
- a promotional and discovery tool for exhibitors and the show itself
- an optional on-site companion experience during the conference
- a web or app-based festival adventure layer that can also be explored remotely

This matters because it changes the design target. The product does not need to justify itself only as a standalone game with traditional progression. It can create value by helping people discover the event, learn what is on the floor, and engage more deeply with exhibitors.

## Audience And Modes

The product should support two closely related modes of use.

### Remote Or Pre-Show Exploration

People who are not physically on the floor can browse the map, discover exhibitors, follow featured content, and interact with virtual representatives. In this mode, the product acts as a digital companion and promotional layer for VCF Midwest.

### On-Site Conference Companion

People attending the show can use the same experience as an exploratory guide layered onto the actual floor. In this mode, the game can include location-aware or conference-exclusive mechanics such as codes, clues, scavenger tasks, giveaways, or exhibitor-triggered unlocks.

The final design should work in both modes, but it does not need to give both modes identical mechanics.

## Why The Current Gameplay Is Not Enough

The current loop is functional but shallow:

- most interactions resolve through simple dialog selection
- collection quests are easy to understand, but they do not create enough tension, choice, or surprise
- facts mostly behave like collectible payloads instead of useful knowledge
- the full map matters less than it should because the player is not making meaningful route or opportunity decisions
- vendors do not yet participate in a richer network of needs, offers, timing, or consequences

The next stage should not be "add more quest types" in isolation.

The next stage should be to define a stronger player fantasy and a stronger systemic loop, then let quests, encounters, UI, and content grow out of that core.

## Player Fantasy

The player is not just a tourist or collector.

The player is a resourceful festival explorer, fixer, connector, and archivist moving through the show. They notice opportunities, learn who needs what, recover missing parts and missing context, broker exchanges, unlock demonstrations, and turn scattered stories across the floor into a coherent and satisfying run.

## Design Pillars

### 1. The Floorplan Must Matter

The full VCF Midwest map should not be a backdrop. Distance, routing, crowding, booth placement, and event timing should affect decision-making. A large floor is an asset only if traversal creates meaningful tradeoffs.

### 2. Social Problem Solving Beats Passive Collection

Talking to exhibitors should reveal needs, leads, clues, schedules, preferences, and relationships. Conversations should open paths rather than only dispensing rewards.

### 3. Multi-Step Chains Are The Core Of Play

The interesting part of the game should be turning clue A into opportunity B into payoff C. A satisfying run should feel like connected discoveries, not isolated pickups.

### 4. Procedural Variety Should Recombine Authored Content

The game should use procedural systems to remix good authored ingredients, not to replace them. Randomness should create freshness and routing differences, while the underlying exhibits, stories, and encounter logic remain intentional.

### 5. Systems Must Stay Small Enough To Update Yearly

The game needs to survive annual floorplan and exhibitor changes. That means content must be data-driven, validation must stay strong, and the runtime must avoid tightly coupling show content to one-off code paths.

### 6. Architecture Must Support Testability And Iteration

The project already has a stronger stability base than before. The final design should preserve that. Core gameplay rules should live in testable logic and content schemas, not only inside scene-specific rendering code.

## Final-Form Experience

The finished game should be a show-floor adventure with a run structure.

Each run should give the player:

- a large navigable VCF map
- a set of active leads and opportunities
- a small number of major story arcs or showcase goals
- many smaller side encounters
- reasons to move across the floor with intent
- enough uncertainty that each run feels different

The player should leave a session feeling that they had a story at the show: what they discovered, who they helped, what they restored, which demos they unlocked, which routes they prioritized, and what they chose to ignore.

## Endgame And Payoff

The game does not necessarily need a hard win state in the traditional sense.

A better fit may be a soft payoff model built around completion, discovery, and memorable outcomes.

Possible payoff layers:

- a completed discovery trail or exhibitor circuit
- a session summary showing what the player uncovered and who they helped
- unlocks tied to featured demos, hidden content, or showcase encounters
- collectible stamps, badges, or acknowledgments from exhibitors
- conference-only rewards such as codes, giveaway entries, or easter-egg reveals

In other words, the payoff can be "I meaningfully explored the show and found things worth finding" rather than "I defeated the final boss."

That said, the product still benefits from strong local goals. Each session should give the player at least one clear objective chain to complete, even if the overall experience remains open-ended.

## Recommended Core Loop

1. Survey the floor and identify active leads.
2. Talk to exhibitors, attendees, and points of interest to gather clues, requests, and opportunities.
3. Decide which leads to pursue based on distance, inventory, timing, trust, and likely payoff.
4. Travel the floor to gather parts, facts, access, or confirmations.
5. Resolve multi-step encounter chains.
6. Convert the rewards from those chains into broader access, stronger reputation, better options, and endgame progress.

This loop gives the map a job, gives conversation a job, and gives inventory more meaning than simple score accumulation.

## Recommended Session Structure

The final game should be structured more like a run through a live event than an endless sandbox.

Recommended structure:

- early run: orientation, low-stakes leads, learning the floor
- mid run: tradeoffs between multiple promising chains, longer travel, inventory pressure, and timed opportunities
- late run: one or more high-value showcase arcs that depend on what the player has already unlocked

Each run should include:

- one primary arc with a strong payoff
- several secondary arcs that support or compete with the primary arc
- optional discovery content that adds flavor, score, or alternate routes

## What A Better Encounter Model Looks Like

The current collection quest model should be treated as a prototype seed, not the final structure.

The game should move toward an encounter model built from reusable ingredients:

- requests
- trades
- repairs
- investigations
- deliveries
- demonstrations
- introductions or social handoffs
- chained consequences

Each encounter should be able to describe:

- where it starts
- what unlocks it
- what blockers it has
- what kinds of inputs it accepts
- what state it changes when resolved
- what new opportunities it creates

That model is more flexible than a hard-coded list of unrelated quest types and better matches the kind of festival adventure this game wants to be.

## Core Gameplay Systems For The Final Game

### Exploration And Routing

Movement remains simple and readable, but traversal becomes strategically important. The player should choose where to go next based on current leads, event timing, access, and location efficiency.

### Knowledge As Usable Currency

Facts should stop being mostly passive collectibles. Knowledge should unlock dialog options, solve investigations, satisfy requests, enable trades, and reveal hidden opportunities.

### Inventory As Constraint And Opportunity

Items should matter because they enable repairs, trades, demonstrations, and chain progression. Inventory limits should create decisions, not frustration.

### Trust, Reputation, Or Access

The player should gain forms of standing with communities, exhibitors, or encounter chains. This does not need to become a giant faction system, but the world should remember what the player has proven they can do.

### Time And Scheduling

A large event naturally suggests timing. The final game should consider lightweight schedule pressure: demos, meetups, limited-time opportunities, or changing NPC availability. This should create routing choices, not harsh punishment.

### Showcase Payoffs

The strongest arcs should culminate in visible outcomes: a repaired system, a restored exhibit, an unlocked demo, a successful handoff, a staged event, or a discovered secret. The player should be able to point to what they accomplished.

## World Structure

The full-scale map should support multiple categories of spaces:

- vendor booths and exhibitor clusters
- utility or support spaces
- social hubs and intersections
- side-content or discovery pockets
- special showcase locations

The world should not require combat to stay interesting. The festival itself is the source of complexity: people, things, stories, schedules, and distances.

## Content Architecture Vision

The content model should stay data-driven and year-friendly.

Each show year should be representable as a content pack made of:

- map and tileset data
- booth and vendor metadata
- domain and topic metadata
- encounter definitions
- dialog and flavor text
- location tags and event hooks

Vendor-authored content should also fit into that model. Exhibitors should be able to contribute selected content without hand-editing game code.

This is important because the long-term maintenance burden is not just code. The project has to survive yearly map changes and exhibitor churn without rewriting systems every time.

## Application Architecture Vision

The current codebase already points in the right direction. The final architecture should formalize those boundaries.

### Client Runtime Layers

World layer:
Phaser remains responsible for map rendering, actor placement, movement, collisions, camera behavior, and world-space interaction points.

UI layer:
The DOM overlay remains responsible for HUD, panels, dialogs, and modal interaction. It should stay presentation-focused and avoid owning gameplay rules.

Shared state layer:
The small shared game state should continue to own authoritative player-facing state such as inventory, score, quest or encounter progress, UI flags, and readiness flags.

Application services layer:
Feature logic should sit in explicit services or manager-style modules for interaction coordination, encounter progression, inventory and trade rules, NPC availability, progression, persistence, and content lookups.

Content layer:
Maps, vendors, domains, encounters, and dialog variants should remain external data wherever practical.

### Internal Service Boundaries

The final game should have clear service ownership for:

- content loading and validation
- encounter generation and progression
- inventory and item rules
- knowledge and dialog unlock rules
- schedule or time-state evaluation
- persistence and save restoration
- interaction coordination between world and UI
- scoring, progression, and end-of-run summary

These can live entirely in the client at first. They do not require a backend to be valid architectural boundaries.

### Optional Online Services

The project should stay playable as a static browser game, but the final vision can support optional online services if they unlock meaningful value.

Static frontend deployability is a hard product constraint. The game client should remain deployable to GitHub Pages or any equivalent static host using only bundled assets and JSON data. Backend-powered services may enhance the experience, but they must not be required for the game to boot, explore the map, interact with bundled vendors, or demonstrate the core prototype.

Reasonable optional services:

- cloud save sync across devices
- leaderboard or high-score submissions
- daily or weekly seeded runs
- downloadable or hosted year-specific content packs
- lightweight analytics to understand dead content and failed encounter chains
- exhibitor authentication and content management
- conference-announcement publishing for in-game vendor representatives
- on-site code redemption, giveaway hooks, or scavenger validation

### Hosted Conference Platform Direction

There is a credible long-term version of this project as a hosted conference platform.

In that model:

- attendees play on the web or in an installed app
- players can participate anonymously or through an account system
- exhibitors log into a dashboard to manage their in-game presence
- the server delivers approved content to each vendor's virtual representative
- staff can highlight featured content, announcements, or event-wide scavenger goals

The exhibitor dashboard could allow vendors to supply or manage:

- booth descriptions
- featured items or demos
- rotating announcements
- timed clues or scavenger hints
- reward codes or secret phrases
- special encounter hooks for the virtual representative

This hosted direction is promising because it gives the project real utility beyond pure entertainment.

These should be additive, not foundational. The core single-player festival experience should work locally.

## What The Repo Already Has That Supports This Vision

- Phaser world rendering and map loading
- DOM overlay UI instead of fragile in-canvas HUD logic
- a shared gameplay state object
- explicit manager composition during scene bootstrap
- deterministic test mode and a stable browser test API
- data-driven domains and vendors
- map validation and collision authoring rules

These are real foundations. The vision should build on them instead of discarding them.

## What Is Missing

- a stronger central player fantasy
- an encounter model richer than collection quests
- useful knowledge mechanics
- vendor needs, offers, and changing availability
- schedule-driven or location-driven opportunity design
- a soft-payoff structure that gives sessions satisfying closure
- a clean hosted-service model for vendor-authored content and moderation

## Design Guidance For Near-Term Planning

Before adding large amounts of new content, the project should answer these questions:

1. What kind of session payoff is strongest for this product: discovery completion, exhibitor circuit completion, scavenger completion, or something similar?
2. What are the first three encounter archetypes worth building beyond pure collection?
3. How should knowledge differ from physical inventory?
4. How much time pressure belongs in the game?
5. What minimal trust, reputation, or access system is needed to make NPC relationships matter?
6. What content schema changes are required so vendors can express needs, offers, and schedule hooks?
7. Which kinds of vendor-authored content are safe and useful enough to support through a dashboard?

## Recommended Product Direction From Here

If the goal is a more compelling game, the project should prioritize these moves:

1. Reframe the product as a conference companion with game systems, not just a standalone quest prototype.
2. Replace collection-only thinking with encounter-chain thinking.
3. Define a soft-payoff session structure instead of forcing a traditional endgame too early.
4. Add a lightweight time or schedule model so route planning matters.
5. Upgrade vendor content so exhibitors can have needs, offers, blockers, consequences, and optional dashboard-fed announcements.
6. Treat facts as actionable knowledge instead of passive score pickups.
7. Preserve the current stability and validation discipline while new systems are introduced.

## Recommended Prototype Target

The next prototype does not need to prove the entire final vision.

It should prove one useful and believable slice:

"A playable VCF floor companion where a player can explore a large convention map, visit exhibitors, receive dynamic vendor content, and complete a small discovery or scavenger arc that feels better on-site than off-site."

That prototype target is strong because it aligns with the real product value you described.

Recommended prototype ingredients:

- the full or near-full floorplan populated with many vendor NPCs
- a vendor content model that supports descriptions, featured items, and announcements
- a lightweight server/client path that can serve the game, expose a vendor dashboard, and push live content changes into the running game
- one lightweight scavenger or discovery circuit across a curated set of exhibitors
- at least one on-site-only mechanic such as a code, clue, or exhibitor-provided phrase
- a simple session payoff such as a completed circuit, reveal screen, or reward unlock summary

This is enough to test whether the project feels useful, charming, and conference-specific before committing to a much larger systems build.

## Server/Client Prototype Goal

The near-term hosted prototype should demonstrate the application scope even before the final full map is finished.

The first slice should be intentionally small:

- serve the existing browser game through a local Node server
- expose a simple dashboard page for vendor content updates
- let a dashboard change update a vendor announcement in the running game in real time or on the next vendor-dialog open
- keep the Python/static serving path usable for development that does not need live services
- keep GitHub Pages-style static hosting usable for public demos without the backend or dashboard
- keep all live-service behavior graceful when the game is opened without the Node server

This gives the project a concrete hosted-app vertical slice without waiting for authentication, durable storage, a polished exhibitor dashboard, or the final full-floor content pass.

## Recommended First Encounter Types

If you are unsure what to build next, these are the three most practical encounter archetypes for the next prototype:

1. Discovery encounter:
	Visit a booth, learn something unique, and record or unlock it in the player's festival log.

2. Scavenger clue encounter:
	A vendor or location provides part of a clue chain that leads the player to other booths or hidden map features.

3. On-site verification encounter:
	A player must obtain a code, phrase, or observed detail from the physical conference floor to unlock the next step or reward.

These three types are achievable, fit the conference theme, and create a better bridge between remote and in-person play than pure collection quests alone.

## Canonical And Reference Documents

Canonical product-direction document:

- `Game Vision.md`

Operational engineering documents:

- `README.md`
- `Stability Roadmap.md`
- `Implementation Checklist.md`

Reference-only historical planning material:

- `vcf_quest_outline.md`
- `Revised Implementation Plan.md`
- `quest_template_discussion.txt`
- `help.json`