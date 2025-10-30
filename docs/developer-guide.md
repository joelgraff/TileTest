# TileTest Developer Guide

## Architecture & Key Components

- **Entry Point:** `index.html` loads Phaser.js and initializes the game
- **Game Loop:** `main.js` configures the Phaser scene, manages state
- **Managers:**
  - `playerManager.js`: Player sprite, movement, camera
  - `npcManager.js`: NPC creation, movement, vendor interactions
  - `collisionManager.js`: Physics, collision
  - `mapManager.js`: Tilemap loading/rendering
  - `input_Manager.js`: Keyboard/touch input
  - `questManager.js`: Procedural quest generation
  - `domainManager.js`: Domain-based data
  - `uiManager.js`: UI, inventory, quests, dialog
  - `dialogSystem.js`: Modal dialog system
- **Assets/Data:**
  - Sprites: PNGs for player, NPCs, tiles
  - Maps: JSON/TMX
  - Domain Data: `technology_domains.json`
  - Vendor Data: `vendors.json`

## UI System

- **AssetFactory:** Creates dialog assets (images, text, containers)
- **ButtonFactory:** Consistent button creation
- **ContentProcessor:** Formats dialog content
- **MovementIndicator:** Handles movement reticle

## Project Patterns & Conventions

- Manager modules: `<entity>Manager.js`
- Static classes with preload/create/update
- ES6 imports/exports
- Async loading for external data
- Scene-level flags for pausing
- Event-driven interactions

## Adding Quest Functionality

1. Add domain data to `technology_domains.json`
2. Update `questManager.js`
3. Add NPC interactions in `npcManager.js`
4. Handle completion in `uiManager.js`

## References

- Core: `main.js`, `playerManager.js`, `npcManager.js`, `mapManager.js`
- Quest: `questManager.js`, `domainManager.js`, `uiManager.js`
- Data: `technology_domains.json`, `vendors.json`, `config.js`
- Dialog: `dialogSystem.js` (quadrant-based button layout)

## Developer Workflows

- Serve with `python -m http.server 5000`
- Debug: backtick (`) toggles debug mode
- Content: Add assets to project folder
- Python scripts for data processing

## Conventions

- Input manager: `input_Manager.js` (underscore)
- Data files: `.json` with descriptive names
- State: Browser cookies for quest/session

## For more, see `README.md` and `docs/user-guide.md`.
