# TileTest

Browser-based 2D tilemap game built with Phaser.js featuring procedural quest generation for VCF Midwest retro computing events.

## Project Overview

TileTest uses ES6 modules with a Manager pattern for game logic, asset management, and input handling. The game includes player/NPC movement, collision detection, dynamic tile-based maps, and a domain-based quest system.

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
  - `dialogSystem.js`: Unified dialog management system.
- **Assets & Data:**
  - Sprites: PNG files for player, NPCs, and tiles.
  - Maps: JSON/TMX files for tilemaps and configuration.
  - Domain Data: `technology_domains.json` with categorized items/facts.
  - Vendor Data: `vendors.json` with booth information and dialog trees.

## Setup & Development

### Prerequisites
- Python 3.x for local server

### Installation
```bash
npm install
```

### Running Locally
```bash
npm start
# or
python -m http.server 5000
```

Open `http://localhost:5000` in your browser.

## Developer Workflows

- **Local Development:** Serve with Python HTTP server as above.
- **Debugging:** Toggle debug mode with backtick (`) key. Console logging for quest events.
- **Content Updates:** Maps, domains, vendors loaded from external JSON files. Add assets directly to project folder.

## Quest System Design

### Quest Categories
1. **Save the NPC**: Assist vendors with tech-themed crises using items/facts.
2. **Level Up**: Progression challenges requiring puzzle-solving for upgrades.
3. **Barter**: Trading systems with chain trades and haggling.
4. **Investigate**: Exploration mysteries with clues and hidden elements.
5. **Assembly/Repair**: Building/fixing using vendor components.
6. **Logic/Riddle**: Brainteasers based on retro tech facts.
7. **Competition/Event**: Mini-games and auctions.
8. **Chain Reaction**: Multi-step sequences with dependencies.

### Procedural Generation
Quests vary per run through randomization of NPCs, items, dependencies, and rewards. Uses domain-based templates from `technology_domains.json`.

### Implementation Phases
- **Phase 1**: Foundation with 1-2 quest types and basic UI.
- **Phase 2**: Full system with state persistence and remaining types.
- **Phase 3**: Map integration and advanced features.
- **Phase 4**: Polish and optimization.

## Data Architecture

- **Domain-based**: Technology categories (Commodore, Apple, Gaming, etc.) for quest generation.
- **Vendor-based**: Booth data with interactions and dialog trees.
- **State Persistence**: Browser cookies for progress.

## File Structure

- `main.js`: Game initialization
- Managers: `playerManager.js`, `npcManager.js`, etc.
- UI: `uiManager.js`, `dialogSystem.js`
- Data: `vendors.json`, `technology_domains.json`
- Assets: PNG sprites, JSON/TMX maps
- Dev: `tilesets/` for tilemap editor files

## Adding Quest Functionality

1. Define domain data in `technology_domains.json`
2. Update `questManager.js` for generation
3. Add NPC interactions in `npcManager.js`
4. Handle completion in `uiManager.js`

## References

- Core patterns: Review manager modules
- Quest system: `questManager.js`, `domainManager.js`
- Data: `technology_domains.json`, `vendors.json`