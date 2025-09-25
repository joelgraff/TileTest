# Copilot Instructions for TileTest

## Project Overview
TileTest is a browser-based 2D tilemap game built with Phaser.js. The codebase is modular, using ES6 modules for game logic, asset management, and input handling. The game features player and NPC movement, collision detection, and dynamic tile-based maps.

## Architecture & Key Components
- **Entry Point:** `index.html` loads Phaser.js from CDN and initializes the game.
- **Game Loop:** `main.js` configures the Phaser scene, manages game state, and orchestrates core logic.
- **Managers:**
  - `playerManager.js`: Handles player sprite, movement, and camera following.
  - `npcManager.js`: Manages NPC creation and movement.
  - `collisionManager.js`: Sets up physics and collision boundaries.
  - `mapManager.js`: Loads and renders tilemaps from JSON/TMX files.
  - `input_Manager.js`: Keyboard and touch input handling.
- **Assets:**
  - Sprites: PNG files for player, NPCs, and tiles.
  - Maps: JSON/TMX files for tilemaps and configuration.
  - Vendor data: JSON files for dynamic content (e.g., `vendors_.json`).

## Developer Workflows
- **Local Development:**
  - Serve with Python HTTP server: `python -m http.server 5000` (binds to 0.0.0.0 for proxy compatibility)
  - Main development files: `.js` modules, `index.html`, asset files
- **Debugging:**
  - Toggle debug mode with the backtick (`) key
  - Camera follows player and respects map bounds
  - Asset caching is disabled for easier development
- **Updating Content:**
  - Maps and vendor data are loaded from external JSON/TMX files; update these to change game layout or NPCs
  - Add new assets (sprites, tiles) directly to the project folder

## Project-Specific Patterns & Conventions
- **File Naming:**
  - Manager modules use the pattern `<entity>Manager.js` (e.g., `playerManager.js`, `npcManager.js`)
  - Input manager uses `input_Manager.js` (note the underscore)
- **Module Structure:**
  - Each manager encapsulates logic for a specific game entity or system
  - Use ES6 imports/exports for cross-module communication
- **Data Loading:**
  - Maps and vendor lists are loaded at runtime from JSON/TMX files
  - Asset paths are relative and referenced in config files
- **Game State:**
  - Player, NPCs, and map state are managed in their respective modules
  - Interactions (e.g., vendor dialogs) are handled via data-driven logic

## Integration Points
- **Phaser.js:** Used for rendering, physics, and input
- **External Data:** JSON/TMX files for maps, vendors, and configuration
- **Assets:** PNG sprites and tiles

## Example: Adding a New NPC
1. Add sprite file (e.g., `npc3.png`) to project
2. Update `npcManager.js` to include new NPC logic
3. Reference new NPC in map or vendor JSON as needed

## References
- See `main.js`, `playerManager.js`, `npcManager.js`, and `mapManager.js` for core patterns
- For asset and data conventions, review `tiles.json`, `map.json`, and `vendors_.json`

---
For questions or unclear patterns, review manager modules and config files. If conventions are missing, ask for clarification or propose updates based on existing structure.
