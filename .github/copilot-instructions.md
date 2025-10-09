# Copilot Instructions for TileTest

## Project Overview
TileTest is a browser-based 2D tilemap game built with Phaser.js featuring procedural quest generation for VCF Midwest retro computing events. The codebase uses ES6 modules with a Manager pattern for game logic, asset management, and input handling. The game includes player/NPC movement, collision detection, dynamic tile-based maps, and a domain-based quest system.

## Architecture & Key Components
- **Entry Point:** `index.html` loads Phaser.js from CDN and initializes the game.
- **Game Loop:** `main.js` configures the Phaser scene, manages game state, and orchestrates core logic.
- **Core Managers:**
  - `playerManager.js`: Handles player sprite, movement, and camera following.
  - `npcManager.js`: Manages NPC creation, movement, and vendor interactions.
  - `collisionManager.js`: Sets up physics and collision boundaries.
  - `mapManager.js`: Loads and renders tilemaps from JSON/TMX files.
  - `input_Manager.js`: Keyboard and touch input handling.
- **Quest System Managers:**
  - `questManager.js`: Procedural quest generation and state management.
  - `domainManager.js`: Static class managing domain-based data (technology categories).
  - `uiManager.js`: Game interface with inventory, quests panel, and dialog delegation.
  - `dialogManager.js`: Modal dialog system with button interactions.
- **Assets & Data:**
  - Sprites: PNG files for player, NPCs, and tiles.
  - Maps: JSON/TMX files for tilemaps and configuration.
  - Domain Data: `technology_domains.json` with categorized items/facts.
  - Vendor Data: `vendors.json` with booth information and dialog trees.

## Developer Workflows
- **Local Development:**
  - Serve with Python HTTP server: `python -m http.server 5000` (binds to 0.0.0.0 for proxy compatibility)
  - Main development files: `.js` modules, `index.html`, asset files
- **Debugging:**
  - Toggle debug mode with the backtick (`) key
  - Camera follows player and respects map bounds
  - Asset caching is disabled for easier development
  - Console logging for quest system events and domain loading
- **Content Updates:**
  - Maps and vendor data loaded from external JSON/TMX files
  - Domain data in `technology_domains.json` drives quest generation
  - Add new assets (sprites, tiles) directly to project folder
  - Python scripts in workspace root for data processing (e.g., `improve_facts.py`)

## Project-Specific Patterns & Conventions
- **File Naming:**
  - Manager modules use `<entity>Manager.js` pattern (e.g., `playerManager.js`, `questManager.js`)
  - Input manager uses `input_Manager.js` (note the underscore)
  - Data files use `.json` extension with descriptive names
- **Module Structure:**
  - Static Manager classes with preload/create/update methods
  - ES6 imports/exports for cross-module communication
  - Async loading patterns for external data (DomainManager)
- **Data Architecture:**
  - **Domain-based**: Technology domains categorize items/facts for quests
  - **Vendor-based**: Booth data with dialog trees and NPC interactions
  - **State Persistence**: Browser cookies for quest progress/session data
- **Game State Management:**
  - Scene-level flags (e.g., `scene.isDialogOpen`) for pausing game logic
  - Manager instances attached to scene object for cross-component access
  - Event-driven interactions between NPCs, quests, and UI
- **Dialog System:**
  - Modal overlays with button stacks positioned in layout quadrants
  - Button callbacks handle quest progression and item collection
  - Scene pausing via flag rather than Phaser pause (enables input)

## Integration Points
- **Phaser.js:** Game engine for rendering, physics, and input (CDN-loaded)
- **External Data:** JSON/TMX files for maps, domains, vendors, and configuration
- **Browser APIs:** Cookies for quest state persistence, fetch for domain loading
- **Python Scripts:** Data processing utilities in workspace root

## Example: Adding Quest Functionality
1. Define domain data in `technology_domains.json` with items/facts arrays
2. Update `questManager.js` to generate quests from domain templates
3. Add NPC interactions in `npcManager.js` calling `scene.questManager.checkItemCollection()`
4. Handle quest completion in `uiManager.js` with reward dialogs

## References
- Core patterns: `main.js`, `playerManager.js`, `npcManager.js`, `mapManager.js`
- Quest system: `questManager.js`, `domainManager.js`, `uiManager.js`
- Data conventions: `technology_domains.json`, `vendors.json`, `config.js`
- Dialog patterns: `dialogManager.js` with quadrant-based button layout

---
For questions or unclear patterns, review manager modules and data files. If conventions are missing, ask for clarification or propose updates based on existing structure.
