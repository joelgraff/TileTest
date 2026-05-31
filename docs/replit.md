# Tilemap Game

## Overview
A 2D browser-based tilemap game built with Phaser.js. This is a static frontend project that features player movement, NPCs, collision detection, and tile-based mapping.

## Recent Changes
- Fixed HTML file reference from "inputManager.js" to "input_Manager.js" (September 24, 2025)
- Configured workflow to serve static files on port 5000 using Python HTTP server
- Set up deployment configuration for autoscale deployment target

## Project Architecture
- **Frontend**: Static HTML/JavaScript using Phaser.js 3.55.2 from CDN
- **Game Engine**: Phaser.js for 2D game rendering and physics
- **Asset Management**: PNG sprites for player and NPCs, JSON for maps and configuration
- **Modules**: ES6 modules for organized code structure

## Key Files
- `index.html`: Main entry point with proper cache control headers
- `main.js`: Core game scene and Phaser configuration
- `config.js`: Game configuration constants
- `playerManager.js`: Player sprite and movement logic
- `mapManager.js`: Tilemap loading and rendering
- `npcManager.js`: NPC creation and movement
- `collisionManager.js`: Physics collision setup
- `input_Manager.js`: Input handling for keyboard and touch

## Development Setup
- Server runs on port 5000 using Python's built-in HTTP server
- Configured for 0.0.0.0 binding to work with Replit's proxy system
- Deployment configured for autoscale target

## Features
- Tile-based 2D world with collision detection
- Player character with keyboard and touch controls
- NPCs with movement patterns
- Debug mode toggle (backtick key)
- Camera following player with bounds
- Asset caching prevention for development